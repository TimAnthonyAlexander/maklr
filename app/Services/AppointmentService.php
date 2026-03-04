<?php

namespace App\Services;

use App\Models\AppointmentContact;
use App\Models\AppointmentUser;
use BaseApi\App;

class AppointmentService
{
    /**
     * Find scheduling conflicts for the given user IDs within a time range.
     *
     * @param array<string> $userIds
     * @param string|null $excludeId Appointment ID to exclude (for updates)
     * @return array<array{user_id: string, appointment_id: string, title: string, starts_at: string, ends_at: string}>
     */
    public function findConflicts(array $userIds, string $startsAt, string $endsAt, ?string $excludeId = null): array
    {
        if ($userIds === []) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($userIds), '?'));
        $params = [...$userIds, $endsAt, $startsAt];

        $sql = "SELECT appointment_user.user_id, appointment.id AS appointment_id, "
            . "appointment.title, appointment.starts_at, appointment.ends_at "
            . "FROM appointment "
            . "INNER JOIN appointment_user ON appointment.id = appointment_user.appointment_id "
            . sprintf('WHERE appointment_user.user_id IN (%s) ', $placeholders)
            . "AND appointment.starts_at < ? "
            . "AND appointment.ends_at > ?";

        if ($excludeId !== null) {
            $sql .= " AND appointment.id != ?";
            $params[] = $excludeId;
        }

        return App::db()->raw($sql, $params);
    }

    /**
     * Replace all user records for an appointment.
     *
     * @param array<string> $userIds
     */
    public function syncUsers(string $appointmentId, array $userIds): void
    {
        $existing = AppointmentUser::where('appointment_id', '=', $appointmentId)->get();
        foreach ($existing as $record) {
            $record->delete();
        }

        foreach ($userIds as $userId) {
            $record = new AppointmentUser();
            $record->appointment_id = $appointmentId;
            $record->user_id = $userId;
            $record->save();
        }
    }

    /**
     * Replace all contact records for an appointment.
     *
     * @param array<string> $contactIds
     */
    public function syncContacts(string $appointmentId, array $contactIds): void
    {
        $existing = AppointmentContact::where('appointment_id', '=', $appointmentId)->get();
        foreach ($existing as $record) {
            $record->delete();
        }

        foreach ($contactIds as $contactId) {
            $record = new AppointmentContact();
            $record->appointment_id = $appointmentId;
            $record->contact_id = $contactId;
            $record->save();
        }
    }
}
