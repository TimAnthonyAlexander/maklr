<?php

namespace App\Services;

use App\Models\Activity;
use BaseApi\Logger;
use Throwable;

class ActivityService
{
    public function __construct(
        private readonly Logger $logger,
    ) {}

    /**
     * Log an activity event. Soft-fails: never throws, logs errors instead.
     */
    public function log(
        string $type,
        string $subject,
        string $userId,
        ?string $officeId,
        ?string $description = null,
        ?string $estateId = null,
        ?string $contactId = null,
        ?string $appointmentId = null,
        ?string $taskId = null,
        ?string $emailId = null,
        ?string $documentId = null,
        ?string $oldValue = null,
        ?string $newValue = null,
        array $metadata = [],
    ): void {
        try {
            $activity = new Activity();
            $activity->type = $type;
            $activity->subject = $subject;
            $activity->user_id = $userId;
            $activity->office_id = $officeId;
            $activity->description = $description;
            $activity->estate_id = $estateId;
            $activity->contact_id = $contactId;
            $activity->appointment_id = $appointmentId;
            $activity->task_id = $taskId;
            $activity->email_id = $emailId;
            $activity->document_id = $documentId;
            $activity->old_value = $oldValue;
            $activity->new_value = $newValue;
            $activity->setMetadata($metadata);
            $activity->save();
        } catch (Throwable $throwable) {
            try {
                $this->logger->error('activity_log_failed', [
                    'error' => $throwable->getMessage(),
                    'type' => $type,
                    'subject' => $subject,
                ]);
            } catch (Throwable) {
                // Silently fail — activity logging must never break the request
            }
        }
    }
}
