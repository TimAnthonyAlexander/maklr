<?php

namespace App\Controllers\Email;

use Throwable;
use App\Models\Contact;
use App\Models\EmailAccount;
use App\Models\EmailTemplate;
use App\Models\Estate;
use App\Models\User;
use App\Services\EmailTemplateService;
use App\Services\SmtpSendService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class EmailSendController extends Controller
{
    public string $email_account_id = '';

    public string $to = '';

    public ?string $cc = null;

    public ?string $bcc = null;

    public string $subject = '';

    public string $body_html = '';

    public ?string $body_text = null;

    public ?string $in_reply_to = null;

    public ?string $contact_id = null;

    public ?string $estate_id = null;

    public ?string $email_template_id = null;

    public function __construct(
        private readonly SmtpSendService $smtpSendService,
        private readonly EmailTemplateService $emailTemplateService,
    ) {}

    public function post(): JsonResponse
    {
        $this->validate([
            'email_account_id' => 'required|string',
            'to' => 'required|string',
            'subject' => 'required|string|max:500',
            'body_html' => 'required|string',
        ]);

        $account = $this->findAccessibleAccount($this->email_account_id);

        if (!$account instanceof EmailAccount) {
            return JsonResponse::notFound('Email account not found');
        }

        $subject = $this->subject;
        $bodyHtml = $this->body_html;
        $bodyText = $this->body_text;
        $emailTemplateId = null;

        // Resolve placeholders in the submitted text when a template is specified
        if ($this->email_template_id !== null && $this->email_template_id !== '') {
            $templateCheck = EmailTemplate::where('id', '=', $this->email_template_id)->first();
            if (!$templateCheck instanceof EmailTemplate) {
                return JsonResponse::notFound('Email template not found');
            }

            $emailTemplateId = $this->email_template_id;

            $userId = $this->request->user['id'];
            $officeId = $this->request->user['office_id'] ?? null;

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
            if ($user instanceof User) {
                $resolved = $this->emailTemplateService->resolveText(
                    $subject,
                    $bodyHtml,
                    $bodyText,
                    $contact,
                    $estate,
                    $user,
                );
                $subject = $resolved['subject'];
                $bodyHtml = $resolved['body_html'];
                $bodyText = $resolved['body_text'];
            }
        }

        $toAddresses = array_map('trim', explode(',', $this->to));
        $ccAddresses = $this->cc !== null && $this->cc !== ''
            ? array_map('trim', explode(',', $this->cc))
            : [];
        $bccAddresses = $this->bcc !== null && $this->bcc !== ''
            ? array_map('trim', explode(',', $this->bcc))
            : [];

        $bodyText ??= strip_tags($bodyHtml);

        try {
            $email = $this->smtpSendService->send(
                emailAccount: $account,
                to: $toAddresses,
                cc: $ccAddresses,
                bcc: $bccAddresses,
                subject: $subject,
                bodyHtml: $bodyHtml,
                bodyText: $bodyText,
                inReplyTo: $this->in_reply_to,
                contactId: $this->contact_id,
                estateId: $this->estate_id,
                emailTemplateId: $emailTemplateId,
            );

            return JsonResponse::created($email->toArray());
        } catch (Throwable $throwable) {
            return JsonResponse::error('Failed to send email: ' . $throwable->getMessage(), 500);
        }
    }

    private function findAccessibleAccount(string $id): ?EmailAccount
    {
        $userId = $this->request->user['id'];
        $officeId = $this->request->user['office_id'] ?? null;

        $account = EmailAccount::where('id', '=', $id)
            ->where('user_id', '=', $userId)
            ->where('scope', '=', 'personal')
            ->where('active', '=', true)
            ->first();

        if ($account instanceof EmailAccount) {
            return $account;
        }

        if ($officeId !== null) {
            $account = EmailAccount::where('id', '=', $id)
                ->where('office_id', '=', $officeId)
                ->where('scope', '=', 'office')
                ->where('active', '=', true)
                ->first();

            if ($account instanceof EmailAccount) {
                return $account;
            }
        }

        return null;
    }
}
