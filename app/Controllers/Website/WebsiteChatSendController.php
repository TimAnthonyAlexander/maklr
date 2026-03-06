<?php

namespace App\Controllers\Website;

use App\Models\Website;
use App\Models\WebsiteChatMessage;
use App\Models\WebsitePage;
use App\Models\WebsitePageVersion;
use App\Services\WebsiteLlmService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use RuntimeException;

class WebsiteChatSendController extends Controller
{
    public string $websiteId = '';

    public string $message = '';

    public ?string $page_id = null;

    public function __construct(
        private readonly WebsiteLlmService $websiteLlmService,
    ) {}

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'message' => 'required|string|max:2000',
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $officeId = $this->request->user['office_id'] ?? null;
        $userId = $this->request->user['id'];

        // Verify website belongs to office
        $website = Website::where('id', '=', $this->websiteId)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$website instanceof Website) {
            return JsonResponse::notFound('Website not found');
        }

        // Load page if specified
        $page = null;
        if ($this->page_id !== null && $this->page_id !== '') {
            $page = WebsitePage::where('id', '=', $this->page_id)
                ->where('website_id', '=', $this->websiteId)
                ->first();

            if (!$page instanceof WebsitePage) {
                return JsonResponse::notFound('Page not found');
            }
        }

        // Load recent chat history for context (last 20 messages)
        $recentMessages = WebsiteChatMessage::where('website_id', '=', $this->websiteId)
            ->orderBy('created_at', 'ASC')
            ->limit(20)
            ->get();

        $chatHistory = array_map(
            fn (WebsiteChatMessage $websiteChatMessage): array => [
                'role' => $websiteChatMessage->role,
                'content' => $websiteChatMessage->content ?? '',
            ],
            $recentMessages,
        );

        // Call LLM
        try {
            $result = $this->websiteLlmService->processEdit(
                userMessage: $this->message,
                currentHtml: $page instanceof WebsitePage ? $page->html_content : null,
                pageTitle: $page instanceof WebsitePage ? $page->title : 'Untitled',
                websiteName: $website->name,
                chatHistory: $chatHistory,
                userId: $userId,
                officeId: $officeId,
            );
        } catch (RuntimeException $runtimeException) {
            return JsonResponse::badRequest($runtimeException->getMessage());
        }

        // Save user message
        $userMsg = new WebsiteChatMessage();
        $userMsg->role = 'user';
        $userMsg->content = $this->message;
        $userMsg->website_id = $this->websiteId;
        $userMsg->page_id = $this->page_id;
        $userMsg->user_id = $userId;
        $userMsg->save();

        // Save assistant message
        $assistantMsg = new WebsiteChatMessage();
        $assistantMsg->role = 'assistant';
        $assistantMsg->content = $result['message'];
        $assistantMsg->website_id = $this->websiteId;
        $assistantMsg->page_id = $this->page_id;
        $assistantMsg->user_id = $userId;
        $assistantMsg->save();

        // If we have a page, snapshot current HTML as a version, then update
        if ($page instanceof WebsitePage) {
            // Get next version number
            $lastVersion = WebsitePageVersion::where('page_id', '=', $page->id)
                ->orderBy('version_number', 'DESC')
                ->first();

            $nextVersion = $lastVersion instanceof WebsitePageVersion
                ? $lastVersion->version_number + 1
                : 1;

            // Snapshot current content
            $websitePageVersion = new WebsitePageVersion();
            $websitePageVersion->page_id = $page->id;
            $websitePageVersion->html_content = $page->html_content;
            $websitePageVersion->version_number = $nextVersion;
            $websitePageVersion->change_summary = $result['summary'];
            $websitePageVersion->created_by_user_id = $userId;
            $websitePageVersion->save();

            // Update page with new HTML
            $page->html_content = $result['html'];
            $page->save();
        }

        return JsonResponse::ok([
            'message' => $result['message'],
            'html' => $result['html'],
            'summary' => $result['summary'],
            'page' => $page instanceof WebsitePage ? $page->toArray() : null,
        ]);
    }
}
