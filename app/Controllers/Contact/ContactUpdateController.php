<?php

namespace App\Controllers\Contact;

use App\Models\Contact;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class ContactUpdateController extends Controller
{
    public string $id = '';

    // All patchable fields (nullable = only apply if sent)
    public ?string $entity_type = null;

    public ?string $type = null;

    public ?string $company_name = null;

    public ?string $salutation = null;

    public ?string $first_name = null;

    public ?string $last_name = null;

    public ?string $email = null;

    public ?string $phone = null;

    public ?string $mobile = null;

    public ?string $street = null;

    public ?string $zip = null;

    public ?string $city = null;

    public ?string $country = null;

    public ?string $stage = null;

    public ?string $assigned_user_id = null;

    public ?bool $gdpr_consent = null;

    public ?string $gdpr_consent_date = null;

    public ?bool $gdpr_deletion_requested = null;

    public ?string $gdpr_deletion_requested_at = null;

    public ?string $notes = null;

    public ?string $office_id = null;

    public ?array $search_profiles = null;

    private const array ENTITY_TYPES = ['person', 'company'];

    private const array CONTACT_TYPES = ['buyer', 'seller', 'tenant', 'landlord', 'misc'];

    private const array STAGES = ['cold', 'warm', 'hot', 'customer', 'lost'];

    private const array PATCHABLE_FIELDS = [
        'entity_type', 'type', 'company_name', 'salutation', 'first_name', 'last_name',
        'email', 'phone', 'mobile',
        'street', 'zip', 'city', 'country',
        'stage', 'assigned_user_id',
        'gdpr_consent', 'gdpr_consent_date', 'gdpr_deletion_requested', 'gdpr_deletion_requested_at',
        'notes',
    ];

    public function patch(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $contact = Contact::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$contact instanceof Contact) {
            return JsonResponse::notFound('Contact not found');
        }

        // Validate enum fields if provided
        try {
            if ($this->entity_type !== null) {
                $this->validate(['entity_type' => 'string|in:' . implode(',', self::ENTITY_TYPES)]);
            }

            if ($this->type !== null) {
                $this->validate(['type' => 'string|in:' . implode(',', self::CONTACT_TYPES)]);
            }

            if ($this->stage !== null) {
                $this->validate(['stage' => 'string|in:' . implode(',', self::STAGES)]);
            }

            if ($this->email !== null) {
                $this->validate(['email' => 'string|email']);
            }
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        // Snapshot old values for audit
        $oldData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $oldData[$field] = $contact->{$field};
        }

        // Apply non-null incoming values
        foreach (self::PATCHABLE_FIELDS as $field) {
            if ($this->{$field} !== null) {
                $contact->{$field} = $this->{$field};
            }
        }

        // Handle search_profiles separately (not a simple field)
        $oldSearchProfiles = $contact->getSearchProfiles();
        if ($this->search_profiles !== null) {
            $contact->setSearchProfiles($this->search_profiles);
        }

        $contact->save();

        // Compute diff for audit
        $newData = [];
        foreach (self::PATCHABLE_FIELDS as $field) {
            $newData[$field] = $contact->{$field};
        }

        // Include search_profiles in audit diff
        if ($this->search_profiles !== null) {
            $newSearchProfiles = $contact->getSearchProfiles();
            if ($oldSearchProfiles !== $newSearchProfiles) {
                $oldData['search_profiles'] = $oldSearchProfiles;
                $newData['search_profiles'] = $newSearchProfiles;
            }
        }

        $changes = AuditLogService::computeChanges($oldData, $newData, array_merge(self::PATCHABLE_FIELDS, ['search_profiles']));

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'updated',
            'contact',
            $contact->id,
            $changes,
            ClientIp::from($this->request, true),
            $officeId,
        );

        // Log activity for stage changes
        if (isset($changes['stage'])) {
            /** @var ActivityService $activityService */
            $activityService = $this->make(ActivityService::class);
            $contactName = trim(($contact->first_name ?? '') . ' ' . ($contact->last_name ?? '')) ?: ($contact->company_name ?? 'Unnamed');
            $activityService->log(
                type: 'contact_stage_changed',
                subject: 'Contact stage changed: ' . $contactName,
                userId: $this->request->user['id'],
                officeId: $officeId,
                contactId: $contact->id,
                oldValue: (string) $changes['stage']['old'],
                newValue: (string) $changes['stage']['new'],
            );
        }

        CacheHelper::forget('contact', $this->id);
        CacheHelper::forget('dashboard', $officeId ?? 'none');

        return JsonResponse::ok($contact->toArray());
    }
}
