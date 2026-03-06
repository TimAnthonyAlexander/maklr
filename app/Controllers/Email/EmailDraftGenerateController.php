<?php

namespace App\Controllers\Email;

use App\Services\EmailDraftService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use RuntimeException;

class EmailDraftGenerateController extends Controller
{
    public string $intent = '';

    public ?string $contact_id = null;

    public ?string $estate_id = null;

    public ?string $context_notes = null;

    public function post(): JsonResponse
    {
        $this->validate([
            'intent' => 'required|string|in:follow_up_viewing,price_update,new_listing_match,document_request,viewing_invitation,general_follow_up,custom',
            'contact_id' => 'string',
            'estate_id' => 'string',
            'context_notes' => 'string|max:500',
        ]);

        $userId = $this->request->user['id'] ?? null;
        $officeId = $this->request->user['office_id'] ?? null;
        if ($userId === null || $officeId === null) {
            return JsonResponse::error('Unauthorized', 401);
        }

        $contactId = $this->contact_id !== null && $this->contact_id !== '' ? $this->contact_id : null;
        $estateId = $this->estate_id !== null && $this->estate_id !== '' ? $this->estate_id : null;

        if ($contactId === null && $estateId === null) {
            return JsonResponse::badRequest('At least one of contact_id or estate_id is required');
        }

        try {
            /** @var EmailDraftService $draftService */
            $draftService = $this->make(EmailDraftService::class);

            $result = $draftService->generate(
                $this->intent,
                $contactId,
                $estateId,
                $this->context_notes,
                $userId,
                $officeId,
            );

            return JsonResponse::ok($result);
        } catch (RuntimeException $runtimeException) {
            return JsonResponse::error('AI generation failed: ' . $runtimeException->getMessage(), 502);
        }
    }
}
