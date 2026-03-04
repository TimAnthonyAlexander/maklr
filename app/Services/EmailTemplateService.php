<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\EmailTemplate;
use App\Models\Estate;
use App\Models\User;

class EmailTemplateService
{
    /**
     * Resolve placeholders in a template and return the result.
     *
     * @return array{subject: string, body_html: string|null, body_text: string|null}
     */
    public function resolve(
        EmailTemplate $emailTemplate,
        ?Contact $contact,
        ?Estate $estate,
        User $user,
    ): array {
        $replacements = $this->buildReplacements($contact, $estate, $user);

        return [
            'subject' => strtr($emailTemplate->subject, $replacements),
            'body_html' => $emailTemplate->body_html !== null
                ? strtr($emailTemplate->body_html, $replacements)
                : null,
            'body_text' => $emailTemplate->body_text !== null
                ? strtr($emailTemplate->body_text, $replacements)
                : null,
        ];
    }

    /**
     * Return the list of available placeholders grouped by entity.
     *
     * @return array<string, array<int, array{key: string, label: string}>>
     */
    public function availablePlaceholders(): array
    {
        return [
            'contact' => [
                ['key' => '{{contact.first_name}}', 'label' => 'First Name'],
                ['key' => '{{contact.last_name}}', 'label' => 'Last Name'],
                ['key' => '{{contact.email}}', 'label' => 'Email'],
                ['key' => '{{contact.phone}}', 'label' => 'Phone'],
                ['key' => '{{contact.mobile}}', 'label' => 'Mobile'],
                ['key' => '{{contact.company_name}}', 'label' => 'Company Name'],
                ['key' => '{{contact.city}}', 'label' => 'City'],
                ['key' => '{{contact.street}}', 'label' => 'Street'],
                ['key' => '{{contact.zip}}', 'label' => 'ZIP'],
            ],
            'estate' => [
                ['key' => '{{estate.title}}', 'label' => 'Title'],
                ['key' => '{{estate.price}}', 'label' => 'Price'],
                ['key' => '{{estate.city}}', 'label' => 'City'],
                ['key' => '{{estate.street}}', 'label' => 'Street'],
                ['key' => '{{estate.rooms}}', 'label' => 'Rooms'],
                ['key' => '{{estate.area_total}}', 'label' => 'Total Area'],
                ['key' => '{{estate.area_living}}', 'label' => 'Living Area'],
                ['key' => '{{estate.property_type}}', 'label' => 'Property Type'],
                ['key' => '{{estate.marketing_type}}', 'label' => 'Marketing Type'],
            ],
            'user' => [
                ['key' => '{{user.name}}', 'label' => 'Name'],
                ['key' => '{{user.email}}', 'label' => 'Email'],
                ['key' => '{{user.phone}}', 'label' => 'Phone'],
            ],
        ];
    }

    /**
     * Resolve placeholders in arbitrary text strings.
     *
     * @return array{subject: string, body_html: string, body_text: string|null}
     */
    public function resolveText(
        string $subject,
        string $bodyHtml,
        ?string $bodyText,
        ?Contact $contact,
        ?Estate $estate,
        User $user,
    ): array {
        $replacements = $this->buildReplacements($contact, $estate, $user);

        return [
            'subject' => strtr($subject, $replacements),
            'body_html' => strtr($bodyHtml, $replacements),
            'body_text' => $bodyText !== null ? strtr($bodyText, $replacements) : null,
        ];
    }

    /**
     * Build the search => replace map from the provided entities.
     *
     * @return array<string, string>
     */
    private function buildReplacements(?Contact $contact, ?Estate $estate, User $user): array
    {
        $replacements = [];

        // Contact placeholders
        $contactFields = [
            'first_name', 'last_name', 'email', 'phone', 'mobile',
            'company_name', 'city', 'street', 'zip',
        ];

        foreach ($contactFields as $contactField) {
            $replacements['{{contact.' . $contactField . '}}'] = $contact instanceof Contact
                ? (string) ($contact->{$contactField} ?? '')
                : '';
        }

        // Estate placeholders
        $estateFields = [
            'title', 'price', 'city', 'street', 'rooms',
            'area_total', 'area_living', 'property_type', 'marketing_type',
        ];

        foreach ($estateFields as $estateField) {
            $replacements['{{estate.' . $estateField . '}}'] = $estate instanceof Estate
                ? (string) ($estate->{$estateField} ?? '')
                : '';
        }

        // User placeholders
        $replacements['{{user.name}}'] = $user->name;
        $replacements['{{user.email}}'] = $user->email;
        $replacements['{{user.phone}}'] = $user->phone ?? '';

        return $replacements;
    }
}
