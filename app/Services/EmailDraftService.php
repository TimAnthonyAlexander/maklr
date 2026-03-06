<?php

declare(strict_types=1);

namespace App\Services;

use RuntimeException;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\Estate;
use App\Models\User;

final readonly class EmailDraftService
{
    private const array INTENT_MAP = [
        'follow_up_viewing' => 'Write a follow-up email after a property viewing. Reference the specific property and the viewing experience. Be warm and ask if they have any questions.',
        'price_update' => 'Inform the contact about a price change on a property they are interested in. Mention the old and new price if available, and highlight the opportunity.',
        'new_listing_match' => "Introduce a new listing that matches the contact's search criteria. Highlight the key features that align with their preferences.",
        'document_request' => 'Request necessary documents from the contact. Be clear about which documents are needed and provide a reasonable deadline.',
        'viewing_invitation' => 'Invite the contact to view a property. Suggest specific times and highlight what makes this property worth visiting.',
        'general_follow_up' => 'Write a general relationship maintenance follow-up. Reference recent interactions and maintain the professional relationship.',
        'custom' => "Use the agent's additional notes to determine the email content and tone.",
    ];

    public function __construct(
        private OpenAIService $openAIService,
    ) {}

    /**
     * Generate a contextual email draft using AI.
     *
     * @return array{subject: string, body_html: string, body_text: string}
     */
    public function generate(
        string $intent,
        ?string $contactId,
        ?string $estateId,
        ?string $contextNotes,
        string $userId,
        string $officeId,
    ): array {
        $contact = null;
        if ($contactId !== null && $contactId !== '') {
            $contact = Contact::where('id', '=', $contactId)
                ->where('office_id', '=', $officeId)
                ->first();
        }

        $estate = null;
        if ($estateId !== null && $estateId !== '') {
            $estate = Estate::where('id', '=', $estateId)
                ->where('office_id', '=', $officeId)
                ->first();
        }

        $user = User::find($userId);

        $systemPrompt = $this->buildSystemPrompt(
            $intent,
            $contact,
            $estate,
            $user instanceof User ? $user : null,
            $contactId,
            $estateId,
            $officeId,
            $contextNotes,
        );

        $schema = [
            'type' => 'object',
            'properties' => [
                'subject' => ['type' => 'string'],
                'body_html' => ['type' => 'string'],
                'body_text' => ['type' => 'string'],
            ],
            'required' => ['subject', 'body_html', 'body_text'],
            'additionalProperties' => false,
        ];

        $response = $this->openAIService
            ->model('gpt-4.1-mini')
            ->withInstructions($systemPrompt)
            ->withSampling(0.7)
            ->withResponseFormatJsonSchema('email_draft', $schema)
            ->withService('email_draft_generate', $userId)
            ->withLimits(2000)
            ->create('Generate the email draft now.');

        $text = OpenAIService::extractText($response);
        $parsed = json_decode($text, true);

        if (!is_array($parsed) || !isset($parsed['subject'], $parsed['body_html'], $parsed['body_text'])) {
            throw new RuntimeException('Failed to parse AI response');
        }

        return [
            'subject' => $parsed['subject'],
            'body_html' => $parsed['body_html'],
            'body_text' => $parsed['body_text'],
        ];
    }

    public function getIntentInstruction(string $intent): string
    {
        return self::INTENT_MAP[$intent] ?? self::INTENT_MAP['custom'];
    }

    /**
     * @return array<string, string>
     */
    public function buildContactContext(?Contact $contact): array
    {
        if (!$contact instanceof Contact) {
            return [];
        }

        $context = [
            'name' => trim(($contact->first_name ?? '') . ' ' . ($contact->last_name ?? '')),
            'type' => $contact->type,
            'stage' => $contact->stage,
        ];

        if ($contact->email !== null) {
            $context['email'] = $contact->email;
        }

        if ($contact->phone !== null) {
            $context['phone'] = $contact->phone;
        }

        if ($contact->city !== null) {
            $context['city'] = $contact->city;
        }

        if ($contact->country !== null) {
            $context['country'] = $contact->country;
        }

        if ($contact->company_name !== null) {
            $context['company'] = $contact->company_name;
        }

        if ($contact->salutation !== null) {
            $context['salutation'] = $contact->salutation;
        }

        $searchProfiles = $contact->getSearchProfiles();
        if ($searchProfiles !== []) {
            $context['search_preferences'] = json_encode($searchProfiles) ?: '';
        }

        return $context;
    }

    /**
     * @return array<string, string>
     */
    public function buildEstateContext(?Estate $estate): array
    {
        if (!$estate instanceof Estate) {
            return [];
        }

        $context = [
            'title' => $estate->title,
            'property_type' => $estate->property_type,
            'marketing_type' => $estate->marketing_type,
            'status' => $estate->status,
        ];

        if ($estate->price !== null) {
            $context['price'] = number_format($estate->price, 2, '.', ',');
        }

        if ($estate->rooms !== null) {
            $context['rooms'] = (string) $estate->rooms;
        }

        if ($estate->area_total !== null) {
            $context['area_total'] = $estate->area_total . ' m²';
        }

        if ($estate->area_living !== null) {
            $context['area_living'] = $estate->area_living . ' m²';
        }

        if ($estate->city !== null) {
            $context['city'] = $estate->city;
        }

        if ($estate->street !== null && $estate->house_number !== null) {
            $context['address'] = $estate->street . ' ' . $estate->house_number;
        }

        if ($estate->bedrooms !== null) {
            $context['bedrooms'] = (string) $estate->bedrooms;
        }

        if ($estate->bathrooms !== null) {
            $context['bathrooms'] = (string) $estate->bathrooms;
        }

        return $context;
    }

    /**
     * @return list<string>
     */
    public function buildActivitySummary(?string $contactId, ?string $estateId, string $officeId): array
    {
        $modelQuery = Activity::where('office_id', '=', $officeId);

        if ($contactId !== null && $estateId !== null) {
            // Get activities for either the contact or the estate
            $contactActivities = Activity::where('office_id', '=', $officeId)
                ->where('contact_id', '=', $contactId)
                ->orderBy('created_at', 'DESC')
                ->limit(10)
                ->get();

            $estateActivities = Activity::where('office_id', '=', $officeId)
                ->where('estate_id', '=', $estateId)
                ->orderBy('created_at', 'DESC')
                ->limit(10)
                ->get();

            // Merge, deduplicate by id, sort by created_at desc, take 10
            $all = [];
            $seen = [];
            foreach ([...$contactActivities, ...$estateActivities] as $activity) {
                if (isset($seen[$activity->id])) {
                    continue;
                }

                $seen[$activity->id] = true;
                $all[] = $activity;
            }

            usort($all, static fn($a, $b): int => strcmp($b->created_at ?? '', $a->created_at ?? ''));
            $activities = array_slice($all, 0, 10);
        } elseif ($contactId !== null) {
            $activities = $modelQuery->where('contact_id', '=', $contactId)
                ->orderBy('created_at', 'DESC')
                ->limit(10)
                ->get();
        } elseif ($estateId !== null) {
            $activities = $modelQuery->where('estate_id', '=', $estateId)
                ->orderBy('created_at', 'DESC')
                ->limit(10)
                ->get();
        } else {
            return [];
        }

        $lines = [];
        foreach ($activities as $activity) {
            $date = substr($activity->created_at ?? '', 0, 10);
            $lines[] = sprintf('%s: %s — %s', $date, $activity->type, $activity->subject);
        }

        return $lines;
    }

    /**
     * @return array<string, string>
     */
    public function buildAgentContext(?User $user): array
    {
        if (!$user instanceof User) {
            return [];
        }

        $context = [
            'name' => $user->name,
            'email' => $user->email,
        ];

        if ($user->phone !== null) {
            $context['phone'] = $user->phone;
        }

        return $context;
    }

    private function buildSystemPrompt(
        string $intent,
        ?Contact $contact,
        ?Estate $estate,
        ?User $user,
        ?string $contactId,
        ?string $estateId,
        string $officeId,
        ?string $contextNotes,
    ): string {
        $intentInstruction = $this->getIntentInstruction($intent);
        $sections = ["You are a real estate email writer. Generate a ready-to-send email (not a template).\n"];
        $sections[] = sprintf('INTENT: %s%s', $intentInstruction, PHP_EOL);

        $contactContext = $this->buildContactContext($contact);
        if ($contactContext !== []) {
            $sections[] = "CONTACT:\n" . $this->formatContext($contactContext);
        }

        $estateContext = $this->buildEstateContext($estate);
        if ($estateContext !== []) {
            $sections[] = "PROPERTY:\n" . $this->formatContext($estateContext);
        }

        $activitySummary = $this->buildActivitySummary($contactId, $estateId, $officeId);
        if ($activitySummary !== []) {
            $sections[] = "RECENT ACTIVITY:\n" . implode("\n", $activitySummary);
        }

        $agentContext = $this->buildAgentContext($user);
        if ($agentContext !== []) {
            $sections[] = "AGENT (sign off with these details):\n" . $this->formatContext($agentContext);
        }

        if ($contextNotes !== null && $contextNotes !== '') {
            $sections[] = 'ADDITIONAL NOTES FROM AGENT:
' . $contextNotes;
        }

        $sections[] = "RULES:\n" .
            "- Personalize with specific details from the context above\n" .
            "- Use the contact's name when available\n" .
            "- Sign off with the agent's details\n" .
            "- Detect the appropriate language from the contact's location (country/city); default to English\n" .
            "- Do NOT use {{...}} placeholders — this is a ready-to-send email, not a template\n" .
            "- body_html: use HTML paragraphs and line breaks for formatting\n" .
            "- body_text: plain text version with no HTML tags\n" .
            "- Keep subject under 100 characters";

        return implode("\n\n", $sections);
    }

    /**
     * @param array<string, string> $context
     */
    private function formatContext(array $context): string
    {
        $lines = [];
        foreach ($context as $key => $value) {
            $lines[] = sprintf('  %s: %s', $key, $value);
        }

        return implode("\n", $lines);
    }

}
