<?php

namespace App\Controllers\Estate;

use App\Services\OpenAIService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use RuntimeException;

class EstateDescriptionGenerateController extends Controller
{
    /** @var array<string, mixed> */
    public array $estate_data = [];

    public string $tone = 'neutral';

    public string $additional_notes = '';

    public function post(): JsonResponse
    {
        $this->validate([
            'tone' => 'required|string|in:luxurious,neutral,factual,playful',
            'additional_notes' => 'string|max:300',
        ]);

        $userId = $this->request->user['id'] ?? null;
        if ($userId === null) {
            return JsonResponse::error('Unauthorized', 401);
        }

        if (!is_array($this->estate_data) || empty($this->estate_data)) {
            return JsonResponse::badRequest('estate_data is required');
        }

        $propertyType = $this->estate_data['property_type'] ?? '';
        $rooms = $this->estate_data['rooms'] ?? null;
        $areaTotal = $this->estate_data['area_total'] ?? null;
        $areaLiving = $this->estate_data['area_living'] ?? null;

        if ($propertyType === '') {
            return JsonResponse::badRequest('estate_data.property_type is required');
        }

        if ($rooms === null || $rooms === '') {
            return JsonResponse::badRequest('estate_data.rooms is required');
        }

        if (empty($areaTotal) && empty($areaLiving)) {
            return JsonResponse::badRequest('estate_data must include at least area_total or area_living');
        }

        $estateContext = $this->buildEstateContext($this->estate_data);

        $toneInstructions = [
            'luxurious' => 'Write in a luxurious, aspirational tone. Use elegant language, highlight premium features, and paint a picture of an exclusive lifestyle.',
            'neutral' => 'Write in a balanced, professional tone. Present facts clearly while remaining engaging and approachable.',
            'factual' => 'Write in a strictly factual, concise tone. Focus on specifications and key data points. Avoid embellishment.',
            'playful' => 'Write in a warm, playful tone. Be conversational and inviting, making the reader feel excited about the property.',
        ];

        $toneInstruction = $toneInstructions[$this->tone] ?? $toneInstructions['neutral'];

        $systemPrompt = <<<PROMPT
You are a real estate copywriter for a professional CRM. Generate a compelling property description based on the structured data provided.

Tone: {$toneInstruction}

Rules:
- Write 2-4 paragraphs
- Highlight the most attractive features
- Include relevant details like location, size, and amenities
- Do not invent features not present in the data
- Write in the language that matches the location (e.g., German for properties in Germany/Austria/Switzerland, French for France, etc.). If the location is unclear, write in English.
- Do not include the price in the description
- Return plain text (no HTML, no markdown)
PROMPT;

        $userPrompt = "Property data:\n{$estateContext}";

        if ($this->additional_notes !== '') {
            $userPrompt .= "\n\nAdditional notes from the agent:\n{$this->additional_notes}";
        }

        $schema = [
            'type' => 'object',
            'properties' => [
                'description' => ['type' => 'string'],
            ],
            'required' => ['description'],
            'additionalProperties' => false,
        ];

        try {
            /** @var OpenAIService $openai */
            $openai = $this->make(OpenAIService::class);

            $response = $openai
                ->model('gpt-4.1-mini')
                ->withInstructions($systemPrompt)
                ->withSampling(0.7)
                ->withResponseFormatJsonSchema('estate_description', $schema)
                ->withService('estate_description_generate', $userId)
                ->withLimits(2000)
                ->create($userPrompt);

            $text = OpenAIService::extractText($response);
            $parsed = json_decode($text, true);

            if (!is_array($parsed) || !isset($parsed['description'])) {
                return JsonResponse::error('Failed to parse AI response', 502);
            }

            return JsonResponse::ok([
                'description' => $parsed['description'],
            ]);
        } catch (RuntimeException $e) {
            return JsonResponse::error('AI generation failed: ' . $e->getMessage(), 502);
        }
    }

    /**
     * @param array<string, mixed> $data
     */
    private function buildEstateContext(array $data): string
    {
        $lines = [];

        $fields = [
            'property_type' => 'Property Type',
            'marketing_type' => 'Marketing Type',
            'title' => 'Title',
            'rooms' => 'Rooms',
            'bedrooms' => 'Bedrooms',
            'bathrooms' => 'Bathrooms',
            'area_total' => 'Total Area (m²)',
            'area_living' => 'Living Area (m²)',
            'area_plot' => 'Plot Area (m²)',
            'floor' => 'Floor',
            'floors_total' => 'Total Floors',
            'year_built' => 'Year Built',
            'parking_spaces' => 'Parking Spaces',
            'heating_type' => 'Heating Type',
            'energy_rating' => 'Energy Rating',
            'condition' => 'Condition',
            'street' => 'Street',
            'house_number' => 'House Number',
            'zip' => 'ZIP',
            'city' => 'City',
            'country' => 'Country',
        ];

        foreach ($fields as $key => $label) {
            $value = $data[$key] ?? null;
            if ($value !== null && $value !== '') {
                $lines[] = "{$label}: {$value}";
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
}
