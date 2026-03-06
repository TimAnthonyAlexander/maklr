<?php

namespace App\Controllers\Match;

use App\Models\Contact;
use App\Models\Estate;
use App\Services\OpenAIService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use RuntimeException;

class MatchExplainController extends Controller
{
    public string $estate_id = '';

    public string $contact_id = '';

    public string $profile_id = '';

    public function post(): JsonResponse
    {
        $this->validate([
            'estate_id' => 'required|string',
            'contact_id' => 'required|string',
            'profile_id' => 'required|string',
        ]);

        $userId = $this->request->user['id'] ?? null;
        $officeId = $this->request->user['office_id'] ?? null;

        if ($userId === null || $officeId === null) {
            return JsonResponse::error('Unauthorized', 401);
        }

        $estate = Estate::where('id', '=', $this->estate_id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }

        $contact = Contact::where('id', '=', $this->contact_id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$contact instanceof Contact) {
            return JsonResponse::notFound('Contact not found');
        }

        $profiles = $contact->getSearchProfiles();
        $profile = null;
        foreach ($profiles as $p) {
            if (($p['id'] ?? '') === $this->profile_id) {
                $profile = $p;
                break;
            }
        }

        if ($profile === null) {
            return JsonResponse::notFound('Search profile not found');
        }

        $estateContext = $this->buildEstateContext($estate);
        $profileContext = $this->buildProfileContext($profile);

        $systemPrompt = <<<PROMPT
You are a real estate matching analyst for a professional CRM. Given a property listing and a buyer/tenant search profile, explain why they match or don't match.

Rules:
- List 3-5 bullet points maximum across strong_fits and stretches combined
- Each bullet point should be one concise sentence
- strong_fits: criteria where the property clearly meets or exceeds the profile requirements
- stretches: criteria where the property partially meets or misses the profile requirements
- suggested_pitch: one practical sentence the agent can use when presenting this property to the client
- Be specific with numbers (e.g. "3 rooms matches the 2-4 room requirement")
- Keep it actionable and practical for a real estate agent
PROMPT;

        $userPrompt = "Estate:\n{$estateContext}\n\nSearch Profile:\n{$profileContext}";

        $schema = [
            'type' => 'object',
            'properties' => [
                'strong_fits' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
                'stretches' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
                'suggested_pitch' => ['type' => 'string'],
            ],
            'required' => ['strong_fits', 'stretches', 'suggested_pitch'],
            'additionalProperties' => false,
        ];

        try {
            /** @var OpenAIService $openai */
            $openai = $this->make(OpenAIService::class);

            $response = $openai
                ->model('gpt-4.1-mini')
                ->withInstructions($systemPrompt)
                ->withSampling(0.4)
                ->withResponseFormatJsonSchema('match_explanation', $schema)
                ->withService('match_explain', $userId)
                ->withLimits(500)
                ->create($userPrompt);

            $text = OpenAIService::extractText($response);
            $parsed = json_decode($text, true);

            if (!is_array($parsed) || !isset($parsed['strong_fits'], $parsed['stretches'], $parsed['suggested_pitch'])) {
                return JsonResponse::error('Failed to parse AI response', 502);
            }

            return JsonResponse::ok([
                'strong_fits' => $parsed['strong_fits'],
                'stretches' => $parsed['stretches'],
                'suggested_pitch' => $parsed['suggested_pitch'],
            ]);
        } catch (RuntimeException $runtimeException) {
            return JsonResponse::error('AI explanation failed: ' . $runtimeException->getMessage(), 502);
        }
    }

    private function buildEstateContext(Estate $estate): string
    {
        $data = $estate->toArray();
        $lines = [];

        $fields = [
            'title' => 'Title',
            'property_type' => 'Property Type',
            'marketing_type' => 'Marketing Type',
            'price' => 'Price',
            'rooms' => 'Rooms',
            'bedrooms' => 'Bedrooms',
            'bathrooms' => 'Bathrooms',
            'area_total' => 'Total Area (m²)',
            'area_living' => 'Living Area (m²)',
            'area_plot' => 'Plot Area (m²)',
            'floor' => 'Floor',
            'floors_total' => 'Total Floors',
            'year_built' => 'Year Built',
            'city' => 'City',
            'zip' => 'ZIP',
            'condition' => 'Condition',
        ];

        foreach ($fields as $key => $label) {
            $value = $data[$key] ?? null;
            if ($value !== null && $value !== '') {
                $lines[] = sprintf('%s: %s', $label, $value);
            }
        }

        $booleanFields = [
            'furnished' => 'Furnished',
            'balcony' => 'Balcony',
            'garden' => 'Garden',
            'elevator' => 'Elevator',
            'cellar' => 'Cellar',
        ];

        $features = [];
        foreach ($booleanFields as $key => $label) {
            if (!empty($data[$key])) {
                $features[] = $label;
            }
        }

        if ($features !== []) {
            $lines[] = 'Features: ' . implode(', ', $features);
        }

        return implode("\n", $lines);
    }

    /**
     * @param array<string, mixed> $profile
     */
    private function buildProfileContext(array $profile): string
    {
        $lines = [];

        $lines[] = 'Name: ' . ($profile['name'] ?? 'Unnamed');

        $propertyTypes = $profile['property_types'] ?? [];
        if (is_array($propertyTypes) && $propertyTypes !== []) {
            $lines[] = 'Property Types: ' . implode(', ', $propertyTypes);
        }

        $simpleFields = [
            'marketing_type' => 'Marketing Type',
        ];

        foreach ($simpleFields as $key => $label) {
            $value = $profile[$key] ?? null;
            if ($value !== null && $value !== '') {
                $lines[] = sprintf('%s: %s', $label, $value);
            }
        }

        $rangeFields = [
            ['price_min', 'price_max', 'Price Range'],
            ['area_min', 'area_max', 'Area Range (m²)'],
            ['rooms_min', 'rooms_max', 'Rooms Range'],
            ['bedrooms_min', 'bedrooms_max', 'Bedrooms Range'],
        ];

        foreach ($rangeFields as [$minKey, $maxKey, $label]) {
            $min = $profile[$minKey] ?? null;
            $max = $profile[$maxKey] ?? null;
            if ($min !== null || $max !== null) {
                $minStr = $min !== null ? (string) $min : 'any';
                $maxStr = $max !== null ? (string) $max : 'any';
                $lines[] = sprintf('%s: %s - %s', $label, $minStr, $maxStr);
            }
        }

        $cities = $profile['cities'] ?? [];
        if (is_array($cities) && $cities !== []) {
            $lines[] = 'Cities: ' . implode(', ', $cities);
        }

        $booleanFields = [
            'furnished' => 'Furnished Required',
            'balcony' => 'Balcony Required',
            'garden' => 'Garden Required',
            'elevator' => 'Elevator Required',
            'cellar' => 'Cellar Required',
        ];

        foreach ($booleanFields as $key => $label) {
            if (($profile[$key] ?? null) === true) {
                $lines[] = $label;
            }
        }

        return implode("\n", $lines);
    }
}
