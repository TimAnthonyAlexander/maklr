<?php

namespace App\Controllers\EmailTemplate;

use App\Models\EmailTemplate;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class EmailTemplateShowController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $template = $this->findAccessibleTemplate($this->id);

        if (!$template instanceof EmailTemplate) {
            return JsonResponse::notFound('Email template not found');
        }

        return JsonResponse::ok($template->toArray(true));
    }

    private function findAccessibleTemplate(string $id): ?EmailTemplate
    {
        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;

        $template = EmailTemplate::with(['createdByUser'])
            ->where('id', '=', $id)
            ->first();

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
