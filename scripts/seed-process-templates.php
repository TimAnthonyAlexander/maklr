#!/usr/bin/env php
<?php

/**
 * Seed script for pre-built process templates.
 *
 * Usage: php scripts/seed-process-templates.php <office_id> <user_id>
 *
 * Creates 4 example templates:
 * 1. New Listing Acquisition
 * 2. Lead Nurturing
 * 3. After-Sale Follow-up
 * 4. Viewing Preparation
 */

require_once __DIR__ . '/../vendor/autoload.php';

use App\Models\ProcessTemplate;

if ($argc < 3) {
    echo "Usage: php scripts/seed-process-templates.php <office_id> <user_id>\n";
    exit(1);
}

$officeId = $argv[1];
$userId = $argv[2];

$templates = [
    [
        'name' => 'New Listing Acquisition',
        'description' => 'Automated workflow when a new estate listing becomes active. Schedules photography, brochure creation, and sends owner confirmation.',
        'entity_type' => 'estate',
        'trigger_type' => 'status_change',
        'trigger_config' => json_encode(['from_status' => 'draft', 'to_status' => 'active']),
        'steps' => json_encode([
            ['key' => 'start', 'type' => 'start', 'label' => 'Start', 'next' => 'photo_task', 'position' => ['x' => 250, 'y' => 0]],
            ['key' => 'photo_task', 'type' => 'create_task', 'label' => 'Schedule Photos', 'config' => ['title' => 'Schedule property photography', 'priority' => 'high', 'assign_to' => 'assigned_user'], 'deadline_days' => 3, 'next' => 'brochure_task', 'position' => ['x' => 250, 'y' => 120]],
            ['key' => 'brochure_task', 'type' => 'create_task', 'label' => 'Create Brochure', 'config' => ['title' => 'Create property brochure/exposé', 'priority' => 'medium', 'assign_to' => 'assigned_user'], 'deadline_days' => 5, 'next' => 'owner_email', 'position' => ['x' => 250, 'y' => 240]],
            ['key' => 'owner_email', 'type' => 'send_email', 'label' => 'Send Owner Confirmation', 'config' => ['subject' => 'Your property listing is now live', 'body' => 'Dear {{contact.first_name}}, your property {{estate.title}} is now listed.'], 'next' => 'end', 'position' => ['x' => 250, 'y' => 360]],
            ['key' => 'end', 'type' => 'end', 'label' => 'Done', 'position' => ['x' => 250, 'y' => 480]],
        ]),
    ],
    [
        'name' => 'Lead Nurturing',
        'description' => 'Automated follow-up sequence when a contact becomes a warm lead. Creates tasks and sends emails over time.',
        'entity_type' => 'contact',
        'trigger_type' => 'field_change',
        'trigger_config' => json_encode(['field' => 'stage', 'value' => 'warm']),
        'steps' => json_encode([
            ['key' => 'start', 'type' => 'start', 'label' => 'Start', 'next' => 'intro_call', 'position' => ['x' => 250, 'y' => 0]],
            ['key' => 'intro_call', 'type' => 'create_task', 'label' => 'Intro Call', 'config' => ['title' => 'Make introductory call to new lead', 'priority' => 'high', 'assign_to' => 'trigger_user'], 'deadline_days' => 1, 'next' => 'wait_3', 'position' => ['x' => 250, 'y' => 120]],
            ['key' => 'wait_3', 'type' => 'wait_days', 'label' => 'Wait 3 Days', 'config' => ['days' => 3], 'next' => 'followup_email', 'position' => ['x' => 250, 'y' => 240]],
            ['key' => 'followup_email', 'type' => 'send_email', 'label' => 'Follow-up Email', 'config' => ['subject' => 'Following up on our conversation', 'body' => 'Dear {{contact.first_name}}, I wanted to follow up on our recent conversation.'], 'next' => 'wait_7', 'position' => ['x' => 250, 'y' => 360]],
            ['key' => 'wait_7', 'type' => 'wait_days', 'label' => 'Wait 7 Days', 'config' => ['days' => 7], 'next' => 'checkin_task', 'position' => ['x' => 250, 'y' => 480]],
            ['key' => 'checkin_task', 'type' => 'create_task', 'label' => 'Check-in Task', 'config' => ['title' => 'Check in with lead - assess interest level', 'priority' => 'medium', 'assign_to' => 'trigger_user'], 'deadline_days' => 2, 'next' => 'end', 'position' => ['x' => 250, 'y' => 600]],
            ['key' => 'end', 'type' => 'end', 'label' => 'Done', 'position' => ['x' => 250, 'y' => 720]],
        ]),
    ],
    [
        'name' => 'After-Sale Follow-up',
        'description' => 'Post-sale follow-up sequence. Sends thank-you email, schedules feedback collection, and referral task.',
        'entity_type' => 'estate',
        'trigger_type' => 'status_change',
        'trigger_config' => json_encode(['from_status' => 'reserved', 'to_status' => 'sold']),
        'steps' => json_encode([
            ['key' => 'start', 'type' => 'start', 'label' => 'Start', 'next' => 'thankyou_email', 'position' => ['x' => 250, 'y' => 0]],
            ['key' => 'thankyou_email', 'type' => 'send_email', 'label' => 'Thank You Email', 'config' => ['subject' => 'Congratulations on your purchase!', 'body' => 'Dear {{contact.first_name}}, congratulations on purchasing {{estate.title}}.'], 'next' => 'wait_7', 'position' => ['x' => 250, 'y' => 120]],
            ['key' => 'wait_7', 'type' => 'wait_days', 'label' => 'Wait 7 Days', 'config' => ['days' => 7], 'next' => 'feedback_task', 'position' => ['x' => 250, 'y' => 240]],
            ['key' => 'feedback_task', 'type' => 'create_task', 'label' => 'Collect Feedback', 'config' => ['title' => 'Contact buyer for feedback on experience', 'priority' => 'medium', 'assign_to' => 'assigned_user'], 'deadline_days' => 3, 'next' => 'wait_30', 'position' => ['x' => 250, 'y' => 360]],
            ['key' => 'wait_30', 'type' => 'wait_days', 'label' => 'Wait 30 Days', 'config' => ['days' => 30], 'next' => 'referral_task', 'position' => ['x' => 250, 'y' => 480]],
            ['key' => 'referral_task', 'type' => 'create_task', 'label' => 'Ask for Referral', 'config' => ['title' => 'Ask buyer for referrals', 'priority' => 'low', 'assign_to' => 'assigned_user'], 'deadline_days' => 7, 'next' => 'end', 'position' => ['x' => 250, 'y' => 600]],
            ['key' => 'end', 'type' => 'end', 'label' => 'Done', 'position' => ['x' => 250, 'y' => 720]],
        ]),
    ],
    [
        'name' => 'Viewing Preparation',
        'description' => 'Manual workflow to prepare for property viewings. Checks document readiness, sends invites, and schedules the viewing appointment.',
        'entity_type' => 'estate',
        'trigger_type' => 'manual',
        'trigger_config' => json_encode([]),
        'steps' => json_encode([
            ['key' => 'start', 'type' => 'start', 'label' => 'Start', 'next' => 'docs_task', 'position' => ['x' => 250, 'y' => 0]],
            ['key' => 'docs_task', 'type' => 'create_task', 'label' => 'Prepare Documents', 'config' => ['title' => 'Prepare viewing documents (floor plan, energy cert)', 'priority' => 'high', 'assign_to' => 'assigned_user'], 'deadline_days' => 2, 'next' => 'docs_check', 'position' => ['x' => 250, 'y' => 120]],
            ['key' => 'docs_check', 'type' => 'decision', 'label' => 'Documents Ready?', 'config' => ['mode' => 'auto', 'field' => 'estate.status', 'operator' => 'equals', 'value' => 'active'], 'next_yes' => 'invite_email', 'next_no' => 'gather_docs', 'position' => ['x' => 250, 'y' => 240]],
            ['key' => 'gather_docs', 'type' => 'create_task', 'label' => 'Gather Missing Docs', 'config' => ['title' => 'Gather missing documents for viewing', 'priority' => 'urgent', 'assign_to' => 'assigned_user'], 'deadline_days' => 1, 'next' => 'invite_email', 'position' => ['x' => 500, 'y' => 360]],
            ['key' => 'invite_email', 'type' => 'send_email', 'label' => 'Send Viewing Invite', 'config' => ['subject' => 'Property viewing invitation - {{estate.title}}', 'body' => 'Dear {{contact.first_name}}, you are invited to view {{estate.title}}.'], 'next' => 'wait_1', 'position' => ['x' => 250, 'y' => 480]],
            ['key' => 'wait_1', 'type' => 'wait_days', 'label' => 'Wait 1 Day', 'config' => ['days' => 1], 'next' => 'reminder_email', 'position' => ['x' => 250, 'y' => 600]],
            ['key' => 'reminder_email', 'type' => 'send_email', 'label' => 'Send Reminder', 'config' => ['subject' => 'Reminder: Property viewing tomorrow', 'body' => 'Dear {{contact.first_name}}, this is a reminder about your upcoming viewing of {{estate.title}}.'], 'next' => 'viewing_appt', 'position' => ['x' => 250, 'y' => 720]],
            ['key' => 'viewing_appt', 'type' => 'create_appointment', 'label' => 'Create Viewing Appointment', 'config' => ['title' => 'Property viewing: {{estate.title}}'], 'deadline_days' => 0, 'next' => 'end', 'position' => ['x' => 250, 'y' => 840]],
            ['key' => 'end', 'type' => 'end', 'label' => 'Done', 'position' => ['x' => 250, 'y' => 960]],
        ]),
    ],
];

$created = 0;
foreach ($templates as $data) {
    $template = new ProcessTemplate();
    $template->name = $data['name'];
    $template->description = $data['description'];
    $template->entity_type = $data['entity_type'];
    $template->trigger_type = $data['trigger_type'];
    $template->trigger_config = $data['trigger_config'];
    $template->steps = $data['steps'];
    $template->active = true;
    $template->office_id = $officeId;
    $template->created_by_user_id = $userId;
    $template->save();
    $created++;
    echo "Created: {$data['name']}\n";
}

echo "\nDone! Created {$created} process templates.\n";
