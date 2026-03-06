<?php

namespace App\Services\OpenImmo;

use App\Models\Contact;
use App\Models\Estate;
use App\Models\EstateSyndication;
use App\Models\SyncLog;
use App\Services\ActivityService;
use BaseApi\Logger;
use SimpleXMLElement;
use Throwable;

class FeedbackImportService
{
    public function __construct(
        private readonly ActivityService $activityService,
        private readonly Logger $logger,
    ) {}

    /**
     * Parse OpenImmo feedback XML and create contacts + activities.
     *
     * @return array{imported: int, errors: array<string>}
     */
    public function importFeedback(
        string $xmlContent,
        string $portalId,
        string $officeId,
        string $userId,
    ): array {
        $syncLog = $this->createSyncLog($portalId, $officeId);
        $imported = 0;
        $errors = [];

        try {
            $xml = new SimpleXMLElement($xmlContent);
            $objects = $xml->objekt ?? [];

            foreach ($objects as $object) {
                try {
                    $result = $this->processEnquiry($object, $officeId, $userId);
                    if ($result) {
                        $imported++;
                    }
                } catch (Throwable $e) {
                    $errors[] = $e->getMessage();
                    $this->logger->error('feedback_enquiry_failed', [
                        'portal_id' => $portalId,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $this->finishSyncLog($syncLog, $errors === [], $imported, $errors);

            return ['imported' => $imported, 'errors' => $errors];
        } catch (Throwable $throwable) {
            $this->logger->error('feedback_import_failed', [
                'portal_id' => $portalId,
                'error' => $throwable->getMessage(),
            ]);

            $this->finishSyncLog($syncLog, false, 0, [$throwable->getMessage()]);

            return ['imported' => 0, 'errors' => [$throwable->getMessage()]];
        }
    }

    private function processEnquiry(
        SimpleXMLElement $objekt,
        string $officeId,
        string $userId,
    ): bool {
        $portalObjId = (string) ($objekt->portal_obj_id ?? '');
        $interessenten = $objekt->interessent ?? [];

        $hasInteressent = false;
        foreach ($interessenten as $person) {
            $hasInteressent = true;
            $estate = $this->findEstateByPortalId($portalObjId, $officeId);
            $contact = $this->findOrCreateContact($person, $officeId);
            $anfrage = (string) ($person->anfrage ?? 'Portal enquiry');

            $this->activityService->log(
                type: 'portal_enquiry_received',
                subject: 'Portal enquiry from ' . ($contact->first_name ?? '') . ' ' . ($contact->last_name ?? ''),
                userId: $userId,
                officeId: $officeId,
                estateId: $estate?->id,
                contactId: $contact->id,
                description: $anfrage,
            );
        }

        return $hasInteressent;
    }

    private function findEstateByPortalId(string $portalObjId, string $officeId): ?Estate
    {
        if ($portalObjId === '') {
            return null;
        }

        $estate = Estate::where('external_id', '=', $portalObjId)
            ->where('office_id', '=', $officeId)
            ->first();

        if ($estate instanceof Estate) {
            return $estate;
        }

        $syndication = EstateSyndication::where('external_id', '=', $portalObjId)
            ->where('office_id', '=', $officeId)
            ->first();

        if ($syndication instanceof EstateSyndication) {
            return Estate::where('id', '=', $syndication->estate_id)
                ->where('office_id', '=', $officeId)
                ->first();
        }

        return Estate::where('id', '=', $portalObjId)
            ->where('office_id', '=', $officeId)
            ->first();
    }

    private function findOrCreateContact(SimpleXMLElement $person, string $officeId): Contact
    {
        $email = (string) ($person->email_direkt ?? '');

        if ($email !== '') {
            $existing = Contact::where('email', '=', $email)
                ->where('office_id', '=', $officeId)
                ->first();

            if ($existing instanceof Contact) {
                return $existing;
            }
        }

        $contact = new Contact();
        $contact->type = 'buyer';
        $contact->entity_type = 'person';
        $contact->first_name = (string) ($person->vorname ?? '');
        $contact->last_name = (string) ($person->name ?? '');
        $contact->email = $email !== '' ? $email : null;
        $contact->phone = (string) ($person->tel_durchw ?? '') ?: null;
        $contact->salutation = (string) ($person->anrede ?? '') ?: null;
        $contact->street = (string) ($person->strasse ?? '') ?: null;
        $contact->zip = (string) ($person->plz ?? '') ?: null;
        $contact->city = (string) ($person->ort ?? '') ?: null;
        $contact->stage = 'cold';
        $contact->office_id = $officeId;
        $contact->save();

        return $contact;
    }

    private function createSyncLog(string $portalId, string $officeId): SyncLog
    {
        $syncLog = new SyncLog();
        $syncLog->portal_id = $portalId;
        $syncLog->action = 'feedback_import';
        $syncLog->status = 'started';
        $syncLog->office_id = $officeId;
        $syncLog->save();

        return $syncLog;
    }

    /**
     * @param array<string> $errors
     */
    private function finishSyncLog(SyncLog $syncLog, bool $success, int $imported, array $errors): void
    {
        $syncLog->status = $success ? 'success' : 'failed';
        $syncLog->error_message = $errors !== [] ? implode('; ', $errors) : null;
        $syncLog->setDetails(['imported' => $imported, 'errors_count' => count($errors)]);
        $syncLog->save();
    }
}
