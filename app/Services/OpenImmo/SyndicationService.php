<?php

namespace App\Services\OpenImmo;

use App\Models\EstateImage;
use App\Models\Estate;
use App\Models\EstateSyndication;
use App\Models\Office;
use App\Models\Portal;
use App\Models\SyncLog;
use App\Services\ActivityService;
use BaseApi\Logger;
use Throwable;
use Ujamii\OpenImmo\API\Aktion;

class SyndicationService
{
    public function __construct(
        private readonly OpenImmoExportService $openImmoExportService,
        private readonly FtpSyncService $ftpSyncService,
        private readonly ActivityService $activityService,
        private readonly Logger $logger,
    ) {}

    /**
     * Sync all enabled estates for a portal.
     */
    public function syncPortal(Portal $portal, string $officeId, string $userId): SyncResult
    {
        $syncLog = $this->createSyncLog($portal->id, null, 'export', $officeId);

        try {
            /** @var array<EstateSyndication> $syndications */
            $syndications = EstateSyndication::where('portal_id', '=', $portal->id)
                ->where('office_id', '=', $officeId)
                ->where('enabled', '=', true)
                ->get();

            if (count($syndications) === 0) {
                return $this->finishSyncLog($syncLog, true, 0, 0, 'No enabled syndications');
            }

            $this->markSyncing($syndications);

            $estateData = $this->loadEstateData($syndications, $officeId);
            $office = Office::find($officeId);

            if (!$office instanceof Office) {
                return $this->finishSyncLog($syncLog, false, 0, count($estateData), 'Office not found');
            }

            $xml = $this->openImmoExportService->generateXml($portal, $estateData, $office);

            $imageFiles = $this->collectImageFiles($estateData);
            $uploadResult = $this->ftpSyncService->upload($portal, $xml, $imageFiles);

            if (!$uploadResult['success']) {
                $this->markError($syndications, $uploadResult['error'] ?? 'Upload failed');
                return $this->finishSyncLog(
                    $syncLog,
                    false,
                    0,
                    count($estateData),
                    $uploadResult['error'],
                );
            }

            $this->markSynced($syndications);
            $this->updatePortalSyncStatus($portal, null);

            $this->activityService->log(
                type: 'portal_sync_completed',
                subject: 'Portal sync completed: ' . $portal->name,
                userId: $userId,
                officeId: $officeId,
                description: count($estateData) . ' estates synced',
            );

            return $this->finishSyncLog($syncLog, true, count($estateData), 0, null);
        } catch (Throwable $throwable) {
            $this->logger->error('syndication_sync_failed', [
                'portal_id' => $portal->id,
                'error' => $throwable->getMessage(),
            ]);

            $this->updatePortalSyncStatus($portal, $throwable->getMessage());

            return $this->finishSyncLog($syncLog, false, 0, 0, $throwable->getMessage());
        }
    }

    /**
     * Sync a single estate to a single portal.
     */
    public function syncSingleEstate(EstateSyndication $estateSyndication, string $userId): SyncResult
    {
        $syncLog = $this->createSyncLog(
            $estateSyndication->portal_id,
            $estateSyndication->estate_id,
            'export',
            $estateSyndication->office_id,
        );

        try {
            $portal = Portal::find($estateSyndication->portal_id);
            if (!$portal instanceof Portal) {
                return $this->finishSyncLog($syncLog, false, 0, 1, 'Portal not found');
            }

            $office = Office::find($estateSyndication->office_id);
            if (!$office instanceof Office) {
                return $this->finishSyncLog($syncLog, false, 0, 1, 'Office not found');
            }

            $estateData = $this->loadEstateData([$estateSyndication], $estateSyndication->office_id);
            if ($estateData === []) {
                return $this->finishSyncLog($syncLog, false, 0, 1, 'Estate not found');
            }

            $estateSyndication->sync_status = 'syncing';
            $estateSyndication->save();

            $xml = $this->openImmoExportService->generateXml($portal, $estateData, $office);
            $imageFiles = $this->collectImageFiles($estateData);
            $uploadResult = $this->ftpSyncService->upload($portal, $xml, $imageFiles);

            if (!$uploadResult['success']) {
                $estateSyndication->sync_status = 'error';
                $estateSyndication->last_error = $uploadResult['error'];
                $estateSyndication->save();
                return $this->finishSyncLog($syncLog, false, 0, 1, $uploadResult['error']);
            }

            $estateSyndication->sync_status = 'synced';
            $estateSyndication->last_synced_at = date('Y-m-d H:i:s');
            $estateSyndication->last_error = null;
            $estateSyndication->save();

            return $this->finishSyncLog($syncLog, true, 1, 0, null);
        } catch (Throwable $throwable) {
            $this->logger->error('single_estate_sync_failed', [
                'syndication_id' => $estateSyndication->id,
                'error' => $throwable->getMessage(),
            ]);
            return $this->finishSyncLog($syncLog, false, 0, 1, $throwable->getMessage());
        }
    }

    /**
     * Send DELETE action for a delisted estate.
     */
    public function delistEstate(EstateSyndication $estateSyndication, string $userId): SyncResult
    {
        $syncLog = $this->createSyncLog(
            $estateSyndication->portal_id,
            $estateSyndication->estate_id,
            'delete',
            $estateSyndication->office_id,
        );

        try {
            $portal = Portal::find($estateSyndication->portal_id);
            if (!$portal instanceof Portal) {
                return $this->finishSyncLog($syncLog, false, 0, 1, 'Portal not found');
            }

            $office = Office::find($estateSyndication->office_id);
            if (!$office instanceof Office) {
                return $this->finishSyncLog($syncLog, false, 0, 1, 'Office not found');
            }

            $estate = Estate::where('id', '=', $estateSyndication->estate_id)
                ->where('office_id', '=', $estateSyndication->office_id)
                ->first();

            if (!$estate instanceof Estate) {
                return $this->finishSyncLog($syncLog, false, 0, 1, 'Estate not found');
            }

            $estateData = [[
                'estate' => $estate,
                'images' => [],
                'owner' => null,
                'action' => Aktion::AKTIONART_DELETE,
            ]];

            $xml = $this->openImmoExportService->generateXml($portal, $estateData, $office);
            $uploadResult = $this->ftpSyncService->upload($portal, $xml);

            if (!$uploadResult['success']) {
                return $this->finishSyncLog($syncLog, false, 0, 1, $uploadResult['error']);
            }

            $estateSyndication->enabled = false;
            $estateSyndication->sync_status = 'pending';
            $estateSyndication->save();

            $this->activityService->log(
                type: 'portal_estate_delisted',
                subject: 'Estate delisted from portal: ' . $portal->name,
                userId: $userId,
                officeId: $estateSyndication->office_id,
                estateId: $estateSyndication->estate_id,
            );

            return $this->finishSyncLog($syncLog, true, 1, 0, null);
        } catch (Throwable $throwable) {
            $this->logger->error('delist_estate_failed', [
                'syndication_id' => $estateSyndication->id,
                'error' => $throwable->getMessage(),
            ]);
            return $this->finishSyncLog($syncLog, false, 0, 1, $throwable->getMessage());
        }
    }

    /**
     * @param array<EstateSyndication> $syndications
     * @return array<array{estate: Estate, images: array, owner: mixed, action: string}>
     */
    private function loadEstateData(array $syndications, string $officeId): array
    {
        $estateData = [];

        foreach ($syndications as $syndication) {
            $estate = Estate::with(['images', 'ownerContact'])
                ->where('id', '=', $syndication->estate_id)
                ->where('office_id', '=', $officeId)
                ->first();

            if (!$estate instanceof Estate) {
                continue;
            }

            $images = EstateImage::where('estate_id', '=', $estate->id)
                ->orderBy('sort_order', 'ASC')
                ->get();
            $owner = $estate->ownerContact()->first();

            $estateData[] = [
                'estate' => $estate,
                'images' => $images,
                'owner' => $owner,
                'action' => Aktion::AKTIONART_CHANGE,
            ];
        }

        return $estateData;
    }

    /**
     * @param array<array{estate: Estate, images: array, owner: mixed, action: string}> $estateData
     * @return array<string>
     */
    private function collectImageFiles(array $estateData): array
    {
        $files = [];

        foreach ($estateData as $entry) {
            foreach ($entry['images'] as $image) {
                $path = $image->file_path ?? '';
                if ($path !== '' && file_exists($path)) {
                    $files[] = $path;
                }
            }
        }

        return $files;
    }

    /**
     * @param array<EstateSyndication> $syndications
     */
    private function markSyncing(array $syndications): void
    {
        foreach ($syndications as $syndication) {
            $syndication->sync_status = 'syncing';
            $syndication->save();
        }
    }

    /**
     * @param array<EstateSyndication> $syndications
     */
    private function markSynced(array $syndications): void
    {
        $now = date('Y-m-d H:i:s');

        foreach ($syndications as $syndication) {
            $syndication->sync_status = 'synced';
            $syndication->last_synced_at = $now;
            $syndication->last_error = null;
            $syndication->save();
        }
    }

    /**
     * @param array<EstateSyndication> $syndications
     */
    private function markError(array $syndications, string $error): void
    {
        foreach ($syndications as $syndication) {
            $syndication->sync_status = 'error';
            $syndication->last_error = $error;
            $syndication->save();
        }
    }

    private function updatePortalSyncStatus(Portal $portal, ?string $error): void
    {
        $portal->last_sync_at = date('Y-m-d H:i:s');
        $portal->last_error = $error;
        $portal->save();
    }

    private function createSyncLog(string $portalId, ?string $estateId, string $action, ?string $officeId): SyncLog
    {
        $syncLog = new SyncLog();
        $syncLog->portal_id = $portalId;
        $syncLog->estate_id = $estateId;
        $syncLog->action = $action;
        $syncLog->status = 'started';
        $syncLog->office_id = $officeId;
        $syncLog->save();

        return $syncLog;
    }

    private function finishSyncLog(
        SyncLog $syncLog,
        bool $success,
        int $synced,
        int $failed,
        ?string $error,
    ): SyncResult {
        $syncLog->status = $success ? 'success' : 'failed';
        $syncLog->error_message = $error;
        $syncLog->setDetails([
            'estates_synced' => $synced,
            'estates_failed' => $failed,
        ]);
        $syncLog->save();

        return new SyncResult($success, $synced, $failed, $error, $syncLog->id);
    }
}
