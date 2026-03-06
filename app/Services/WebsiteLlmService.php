<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\WebsiteChatMessage;
use RuntimeException;

/**
 * AI-powered website HTML generation and editing service.
 * Uses OpenAI to generate/edit HTML with Tailwind CSS styling.
 */
final readonly class WebsiteLlmService
{
    private const int DAILY_EDIT_LIMIT = 50;

    private const string SYSTEM_PROMPT = <<<'PROMPT'
You are a professional website builder AI for a real estate company. You generate and edit HTML content for website pages.

DESIGN PHILOSOPHY:
Quiet, confident minimalism. The design trusts the content to do the work.
- Flat — no shadows, no gradients, no decorative elements
- Depth comes from subtle borders (border-gray-200) and slight background shifts between sections (alternate white and gray-50/gray-100)
- Palette is essentially monochrome — near-black (#1a1a1a / gray-900) on off-white (#fafafa / gray-50), warm grays for secondary surfaces
- No brand colors or accent hues unless the user explicitly requests them
- Typography is tight and understated: headings use tracking-tight, body text stays text-sm or text-base. Hierarchy through font-weight and opacity, not size
- Interactions: subtle hover states only — slight opacity change, border darkening, small translate-y. Quick transitions (duration-150). Nothing bounces or pulses
- Buttons don't shout: no uppercase, no bold weights, generous px-6 py-3 padding. Primary action is a solid dark button (bg-gray-900 text-white); secondary actions are ghost/text style
- Layouts are spacious with generous padding (py-20 to py-32 between sections) and breathing room
- Cards and containers use rounded-xl corners but no embellishment inside
- Overall feel: Linear or Notion — premium, restrained, professional

PAGE STRUCTURE:
The navbar is already rendered by the application — do NOT generate a navbar or navigation.
Every page must have a clear, well-structured layout with distinct sections:
- Start with a hero section: a bold, full-width area with a headline, subtitle, and a call-to-action button
- Follow with clearly separated content sections (services, featured listings, testimonials, about, contact, etc.)
- Each section should be its own <section> element with consistent vertical padding (py-20 to py-32)
- Alternate section backgrounds (white / gray-50) to create visual separation
- End with a footer-style section (contact info or CTA) — the page should feel complete, not cut off

RULES:
- Use Tailwind CSS classes exclusively for styling (loaded via CDN)
- Do NOT include any JavaScript — no <script> tags, no inline event handlers
- Create responsive, mobile-first designs
- Use semantic HTML elements (section, article, header, etc.)
- Use placeholder images from https://placehold.co/ when images are needed
- Output only the HTML content for the <main> area — do NOT include <html>, <head>, <body>, or <nav> tags
- When editing existing HTML, preserve the overall structure unless asked to change it
- Keep the design consistent across edits

RESPONSE FORMAT:
You must respond with valid JSON containing these fields:
- html: The complete HTML content for the page's main area
- summary: A brief one-line summary of what was changed (max 100 chars)
- message: A friendly response to the user explaining what you did
PROMPT;

    public function __construct(
        private OpenAIService $openAIService,
        private HtmlSanitizerService $htmlSanitizerService,
    ) {}

    /**
     * Process a user's edit request for an existing page.
     *
     * @param string $userMessage The user's instruction
     * @param string|null $currentHtml Current page HTML content
     * @param string $pageTitle Page title for context
     * @param string $websiteName Website name for context
     * @param array<array{role: string, content: string}> $chatHistory Recent chat messages
     * @param string $userId For cost tracking
     * @param string|null $officeId For rate limiting
     * @return array{html: string, summary: string, message: string}
     */
    public function processEdit(
        string $userMessage,
        ?string $currentHtml,
        string $pageTitle,
        string $websiteName,
        array $chatHistory,
        string $userId,
        ?string $officeId,
    ): array {
        $this->checkDailyLimit($officeId);

        $contextPrompt = "Website: {$websiteName}\nPage: {$pageTitle}";
        if ($currentHtml !== null && $currentHtml !== '') {
            $contextPrompt .= "\n\nCurrent HTML content:\n```html\n{$currentHtml}\n```";
        } else {
            $contextPrompt .= "\n\nThe page is currently empty.";
        }

        // Build input messages with chat history for context
        $input = [];
        $input[] = ['role' => 'user', 'content' => $contextPrompt];

        foreach ($chatHistory as $msg) {
            $input[] = [
                'role' => $msg['role'] === 'assistant' ? 'assistant' : 'user',
                'content' => $msg['content'],
            ];
        }

        $input[] = ['role' => 'user', 'content' => $userMessage];

        return $this->callLlm($input, $userId);
    }

    /**
     * Generate initial HTML for a new page based on a description.
     *
     * @return array{html: string, summary: string, message: string}
     */
    public function generateInitialPage(
        string $description,
        string $pageTitle,
        string $websiteName,
        string $userId,
    ): array {
        $prompt = "Website: {$websiteName}\nPage: {$pageTitle}\n\n"
            . ('Create the initial HTML content for this page based on this description:
' . $description);

        $input = [['role' => 'user', 'content' => $prompt]];

        return $this->callLlm($input, $userId);
    }

    /**
     * @param array<array{role: string, content: string}> $input
     * @return array{html: string, summary: string, message: string}
     */
    private function callLlm(array $input, string $userId): array
    {
        $schema = [
            'type' => 'object',
            'properties' => [
                'html' => ['type' => 'string'],
                'summary' => ['type' => 'string'],
                'message' => ['type' => 'string'],
            ],
            'required' => ['html', 'summary', 'message'],
            'additionalProperties' => false,
        ];

        $response = $this->openAIService
            ->model('gpt-5-mini')
            ->withInstructions(self::SYSTEM_PROMPT)
            ->withSampling(0.7)
            ->withResponseFormatJsonSchema('website_edit', $schema)
            ->withService('website_builder', $userId)
            ->withLimits(8000)
            ->create($input);

        $text = OpenAIService::extractText($response);
        $parsed = json_decode($text, true);

        if (!is_array($parsed) || !isset($parsed['html'], $parsed['summary'], $parsed['message'])) {
            throw new RuntimeException('Failed to parse AI response for website builder');
        }

        // Sanitize the generated HTML
        $sanitizedHtml = $this->htmlSanitizerService->sanitize($parsed['html']);

        return [
            'html' => $sanitizedHtml,
            'summary' => mb_substr((string) $parsed['summary'], 0, 500),
            'message' => $parsed['message'],
        ];
    }

    private function checkDailyLimit(?string $officeId): void
    {
        if ($officeId === null) {
            return;
        }

        $todayStart = date('Y-m-d 00:00:00');

        $count = WebsiteChatMessage::query()
            ->qb()
            ->select([])
            ->selectRaw('COUNT(*)', 'cnt')
            ->join('website', 'website_chat_message.website_id', '=', 'website.id')
            ->where('website.office_id', '=', $officeId)
            ->where('website_chat_message.role', '=', 'user')
            ->where('website_chat_message.created_at', '>=', $todayStart)
            ->get();

        $total = (int) ($count[0]['cnt'] ?? 0);

        if ($total >= self::DAILY_EDIT_LIMIT) {
            throw new RuntimeException('Daily AI edit limit of ' . self::DAILY_EDIT_LIMIT . ' reached. Try again tomorrow.');
        }
    }
}
