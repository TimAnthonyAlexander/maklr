<?php

namespace App\Controllers\EmailTemplate;

use App\Models\Contact;
use App\Models\EmailTemplate;
use App\Models\User;
use App\Models\Estate;
use App\Services\EmailTemplateService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class EmailTemplatePreviewController extends Controller
{
    public string $id = '';

    public ?string $contact_id = null;

    public ?string $estate_id = null;

    public function post(): JsonResponse
    {
        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;

        $template = $this->findAccessibleTemplate($this->id, $userId, $officeId);

        if (!$template instanceof EmailTemplate) {
            return JsonResponse::notFound('Email template not found');
        }

        $contact = null;
        if ($this->contact_id !== null) {
            $contact = Contact::where('id', '=', $this->contact_id)
                ->where('office_id', '=', $officeId)
                ->first();
        }

        $estate = null;
        if ($this->estate_id !== null) {
            $estate = Estate::where('id', '=', $this->estate_id)
                ->where('office_id', '=', $officeId)
                ->first();
        }

        $user = User::find($userId);
        if (!$user instanceof User) {
            return JsonResponse::error('Unauthorized', 401);
        }

        /** @var EmailTemplateService $service */
        $service = $this->make(EmailTemplateService::class);
        $resolved = $service->resolve($template, $contact, $estate, $user);

        return JsonResponse::ok($resolved);
    }

    private function findAccessibleTemplate(string $id, string $userId, ?string $officeId): ?EmailTemplate
    {
        $template = EmailTemplate::where('id', '=', $id)->first();

        if (!$template instanceof EmailTemplate) {
            return null;
        }

        if ($template->scope === 'office' && $template->office_id === $officeId) {
            return $template;
        }

        if ($template->scope === 'personal' && $template->created_by_user_id === $userId) {
            return $template;
        }

        return null;
    }
}
