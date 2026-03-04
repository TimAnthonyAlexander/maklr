<?php

namespace App\Controllers\Contact;

use App\Models\Contact;
use App\Services\MatchingService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class ContactMatchController extends Controller
{
    public string $id = '';

    public function __construct(
        private readonly MatchingService $matchingService,
    ) {}

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $contact = Contact::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$contact instanceof Contact) {
            return JsonResponse::notFound('Contact not found');
        }

        $result = $this->matchingService->matchContactToEstates($contact, $officeId);

        return JsonResponse::ok($result);
    }
}
