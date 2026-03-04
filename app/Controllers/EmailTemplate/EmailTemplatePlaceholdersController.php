<?php

namespace App\Controllers\EmailTemplate;

use App\Services\EmailTemplateService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class EmailTemplatePlaceholdersController extends Controller
{
    public function get(): JsonResponse
    {
        /** @var EmailTemplateService $service */
        $service = $this->make(EmailTemplateService::class);

        return JsonResponse::ok($service->availablePlaceholders());
    }
}
