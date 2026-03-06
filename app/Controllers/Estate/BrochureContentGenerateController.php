<?php

namespace App\Controllers\Estate;

use App\Models\Estate;
use App\Models\Office;
use App\Models\User;
use App\Services\OpenAIService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use RuntimeException;

class BrochureContentGenerateController extends Controller
{
    use EstateContextTrait;

    public string $id = '';

    public string $tone = 'neutral';

    public function post(): JsonResponse
    {
        $this->validate([
            'tone' => 'required|string|in:luxurious,neutral,factual,playful',
        ]);

        $userId = $this->request->user['id'] ?? null;
        $officeId = $this->request->user['office_id'] ?? null;

        if ($userId === null || $officeId === null) {
            return JsonResponse::error('Unauthorized', 401);
        }

        $estate = Estate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }

        $estateContext = $this->buildEstateContextFromModel($estate);

        $agent = $estate->assignedUser()->first();
        if (!$agent instanceof User) {
            $agent = User::find($userId);
        }

        $office = $estate->office()->first();

        $agentInfo = '';
        if ($agent instanceof User) {
            $agentInfo .= '
Agent: ' . $agent->name;
            if ($agent->email !== '') {
                $agentInfo .= ', Email: ' . $agent->email;
            }

            if ($agent->phone !== null && $agent->phone !== '') {
                $agentInfo .= ', Phone: ' . $agent->phone;
            }
        }

        if ($office instanceof Office) {
            $agentInfo .= '
Office: ' . $office->name;
            if ($office->phone !== null && $office->phone !== '') {
                $agentInfo .= ', Phone: ' . $office->phone;
            }
        }

        $toneInstructions = [
            'luxurious' => 'Write in a luxurious, aspirational tone. Use elegant language, highlight premium features, and paint a picture of an exclusive lifestyle.',
            'neutral' => 'Write in a balanced, professional tone. Present facts clearly while remaining engaging and approachable.',
            'factual' => 'Write in a strictly factual, concise tone. Focus on specifications and key data points. Avoid embellishment.',
            'playful' => 'Write in a warm, playful tone. Be conversational and inviting, making the reader feel excited about the property.',
        ];

        $toneInstruction = $toneInstructions[$this->tone] ?? $toneInstructions['neutral'];

        $systemPrompt = <<<PROMPT
You are a real estate marketing copywriter generating brochure content for a professional CRM.

Tone: {$toneInstruction}

Rules:
- Write in the language that matches the location (e.g., German for Germany/Austria/Switzerland, French for France, etc.). If the location is unclear, write in English.
- Do not invent features not present in the data
- Do not include the price in the description
- Return plain text (no HTML, no markdown)
- The headline should be short and compelling (max 10 words)
- The description should be 2-3 paragraphs highlighting the most attractive features
- Highlights should be 4-6 short bullet points about key selling points
- Location summary should describe the neighborhood and surroundings (1-2 sentences)
- Call to action should encourage the reader to schedule a viewing, personalized with agent/office info if available
PROMPT;

        $userPrompt = 'Property data:
' . $estateContext;
        if ($agentInfo !== '') {
            $userPrompt .= PHP_EOL . $agentInfo;
        }

        $schema = [
            'type' => 'object',
            'properties' => [
                'headline' => ['type' => 'string'],
                'description' => ['type' => 'string'],
                'highlights' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
                'location_summary' => ['type' => 'string'],
                'call_to_action' => ['type' => 'string'],
            ],
            'required' => ['headline', 'description', 'highlights', 'location_summary', 'call_to_action'],
            'additionalProperties' => false,
        ];

        try {
            /** @var OpenAIService $openai */
            $openai = $this->make(OpenAIService::class);

            $response = $openai
                ->model('gpt-4.1-mini')
                ->withInstructions($systemPrompt)
                ->withSampling(0.7)
                ->withResponseFormatJsonSchema('brochure_content', $schema)
                ->withService('brochure_content_generate', $userId)
                ->withLimits(3000)
                ->create($userPrompt);

            $text = OpenAIService::extractText($response);
            $parsed = json_decode($text, true);

            if (!is_array($parsed) || !isset($parsed['headline'])) {
                return JsonResponse::error('Failed to parse AI response', 502);
            }

            // If estate already has a description, use it instead of the AI-generated one
            if ($estate->description !== null && $estate->description !== '') {
                $parsed['description'] = $estate->description;
            }

            return JsonResponse::ok([
                'headline' => $parsed['headline'],
                'description' => $parsed['description'],
                'highlights' => $parsed['highlights'],
                'location_summary' => $parsed['location_summary'],
                'call_to_action' => $parsed['call_to_action'],
            ]);
        } catch (RuntimeException $runtimeException) {
            return JsonResponse::error('AI generation failed: ' . $runtimeException->getMessage(), 502);
        }
    }
}
