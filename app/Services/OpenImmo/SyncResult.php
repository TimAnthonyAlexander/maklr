<?php

namespace App\Services\OpenImmo;

final readonly class SyncResult
{
    public function __construct(
        public bool $success,
        public int $estatesSynced,
        public int $estatesFailed,
        public ?string $error,
        public string $syncLogId,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'estates_synced' => $this->estatesSynced,
            'estates_failed' => $this->estatesFailed,
            'error' => $this->error,
            'sync_log_id' => $this->syncLogId,
        ];
    }
}
