<?php

namespace App\Controllers\EmailTemplate;

use App\Services\EmailTemplateService;
use App\Services\OpenAIService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use RuntimeException;

class EmailTemplateGenerateController extends Controller
{
    public string $description = '';

    public string $tone = 'professional';

    public ?string $category = null;

    public function post(): JsonResponse
    {
        $this->validate([
            'description' => 'required|string|min:10|max:500',
            'tone' => 'string|in:professional,friendly,casual,formal',
        ]);

        $userId = $this->request->user['id'] ?? null;
        if ($userId === null) {
            return JsonResponse::error('Unauthorized', 401);
        }

        /** @var EmailTemplateService $templateService */
        $templateService = $this->make(EmailTemplateService::class);
        $placeholders = $templateService->availablePlaceholders();

        $placeholderList = $this->formatPlaceholders($placeholders);

        $systemPrompt = <<<PROMPT
You are a real estate email template writer. Generate professional email templates for a real estate CRM.

Rules:
- Write in a {$this->tone} tone
- Use HTML formatting for body_html (paragraphs, line breaks, bold for emphasis)
- Use plain text for body_text (no HTML tags)
- You may use these placeholders in the template — they will be replaced with actual values when sent:
{$placeholderList}
- Only use placeholders from the list above
- Keep the subject line concise (under 100 characters)
- The email should be ready to use with minimal editing
PROMPT;

        $userPrompt = $this->description;
        if ($this->category !== null && $this->category !== '') {
            $userPrompt .= '

Category: ' . $this->category;
        }

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

        try {
            /** @var OpenAIService $openai */
            $openai = $this->make(OpenAIService::class);

            $response = $openai
                ->model('gpt-4.1-mini')
                ->withInstructions($systemPrompt)
                ->withSampling(0.7)
                ->withResponseFormatJsonSchema('email_template', $schema)
                ->withService('email_template_generate', $userId)
                ->withLimits(2000)
                ->create($userPrompt);

            $text = OpenAIService::extractText($response);
            $parsed = json_decode($text, true);

            if (!is_array($parsed) || !isset($parsed['subject'], $parsed['body_html'], $parsed['body_text'])) {
                return JsonResponse::error('Failed to parse AI response', 502);
            }

            return JsonResponse::ok([
                'subject' => $parsed['subject'],
                'body_html' => $parsed['body_html'],
                'body_text' => $parsed['body_text'],
            ]);
        } catch (RuntimeException $runtimeException) {
            return JsonResponse::error('AI generation failed: ' . $runtimeException->getMessage(), 502);
        }
    }

    /**
     * @param array<string, array<int, array{key: string, label: string}>> $placeholders
     */
    private function formatPlaceholders(array $placeholders): string
    {
        $lines = [];
        foreach ($placeholders as $group => $items) {
            $lines[] = ucfirst($group) . ':';
            foreach ($items as $item) {
                $lines[] = sprintf('  %s — %s', $item['key'], $item['label']);
            }
        }

        return implode("\n", $lines);
    }
}
