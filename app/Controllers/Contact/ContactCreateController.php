<?php

namespace App\Controllers\Contact;

use App\Models\Contact;
use App\Services\ActivityService;
use App\Services\AuditLogService;
use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;
use BaseApi\Support\ClientIp;

class ContactCreateController extends Controller
{
    // Identity
    public string $entity_type = 'person';

    public string $type = 'misc';

    public ?string $company_name = null;

    public ?string $salutation = null;

    public ?string $first_name = null;

    public ?string $last_name = null;

    // Communication
    public ?string $email = null;

    public ?string $phone = null;

    public ?string $mobile = null;

    // Address
    public ?string $street = null;

    public ?string $zip = null;

    public ?string $city = null;

    public ?string $country = null;

    // CRM
    public string $stage = 'cold';

    // GDPR
    public bool $gdpr_consent = false;

    public ?string $gdpr_consent_date = null;

    // Notes
    public ?string $notes = null;

    private const array ENTITY_TYPES = ['person', 'company'];

    private const array CONTACT_TYPES = ['buyer', 'seller', 'tenant', 'landlord', 'misc'];

    private const array STAGES = ['cold', 'warm', 'hot', 'customer', 'lost'];

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'entity_type' => 'required|string|in:' . implode(',', self::ENTITY_TYPES),
                'type' => 'required|string|in:' . implode(',', self::CONTACT_TYPES),
                'stage' => 'string|in:' . implode(',', self::STAGES),
                'email' => 'string|email',
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $contact = new Contact();
        $contact->entity_type = $this->entity_type;
        $contact->type = $this->type;
        $contact->stage = $this->stage;

        // Assign to current user and office
        $contact->assigned_user_id = $this->request->user['id'];
        $contact->office_id = $this->request->user['office_id'] ?? null;

        // Optional fields
        $contact->company_name = $this->company_name;
        $contact->salutation = $this->salutation;
        $contact->first_name = $this->first_name;
        $contact->last_name = $this->last_name;
        $contact->email = $this->email;
        $contact->phone = $this->phone;
        $contact->mobile = $this->mobile;
        $contact->street = $this->street;
        $contact->zip = $this->zip;
        $contact->city = $this->city;
        $contact->country = $this->country;
        $contact->gdpr_consent = $this->gdpr_consent;
        $contact->gdpr_consent_date = $this->gdpr_consent_date;
        $contact->notes = $this->notes;

        $contact->save();

        /** @var AuditLogService $auditLog */
        $auditLog = $this->make(AuditLogService::class);
        $auditLog->log(
            $this->request->user['id'],
            'created',
            'contact',
            $contact->id,
            [],
            ClientIp::from($this->request, true),
            $this->request->user['office_id'] ?? null,
        );

        /** @var ActivityService $activityService */
        $activityService = $this->make(ActivityService::class);
        $contactName = trim(($contact->first_name ?? '') . ' ' . ($contact->last_name ?? '')) ?: ($contact->company_name ?? 'Unnamed');
        $activityService->log(
            type: 'contact_created',
            subject: 'Contact created: ' . $contactName,
            userId: $this->request->user['id'],
            officeId: $contact->office_id,
            contactId: $contact->id,
        );

        CacheHelper::forget('dashboard', $contact->office_id ?? 'none');

        return JsonResponse::created($contact->toArray());
    }
}
