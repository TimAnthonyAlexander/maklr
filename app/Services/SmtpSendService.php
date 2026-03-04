<?php

namespace App\Services;

use RuntimeException;
use App\Models\Email;
use App\Models\EmailAccount;
use BaseApi\Logger;
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mime\Email as MimeEmail;
use Symfony\Component\Mime\Address;

class SmtpSendService
{
    public function __construct(
        private readonly EncryptionService $encryptionService,
        private readonly Logger $logger,
    ) {}

    /**
     * Send an email via SMTP and store it in the database.
     *
     * @param string[] $to
     * @param string[] $cc
     * @param string[] $bcc
     */
    public function send(
        EmailAccount $emailAccount,
        array $to,
        array $cc,
        array $bcc,
        string $subject,
        string $bodyHtml,
        string $bodyText,
        ?string $inReplyTo = null,
        ?string $contactId = null,
        ?string $estateId = null,
        ?string $emailTemplateId = null,
    ): Email {
        $password = $this->decryptPassword($emailAccount);

        $dsn = $this->buildDsn($emailAccount, $password);
        $transport = Transport::fromDsn($dsn);

        $mimeEmail = (new MimeEmail())
            ->from(new Address($emailAccount->email_address, $emailAccount->name))
            ->subject($subject)
            ->html($bodyHtml)
            ->text($bodyText);

        foreach ($to as $addr) {
            $mimeEmail->addTo(trim($addr));
        }

        foreach ($cc as $addr) {
            $mimeEmail->addCc(trim($addr));
        }

        foreach ($bcc as $addr) {
            $mimeEmail->addBcc(trim($addr));
        }

        if ($inReplyTo !== null && $inReplyTo !== '') {
            $mimeEmail->getHeaders()->addTextHeader('In-Reply-To', $inReplyTo);
            $mimeEmail->getHeaders()->addTextHeader('References', $inReplyTo);
        }

        $sentMessage = $transport->send($mimeEmail);

        $messageId = $sentMessage->getMessageId();

        $email = new Email();
        $email->email_account_id = $emailAccount->id;
        $email->office_id = $emailAccount->office_id;
        $email->direction = 'outgoing';
        $email->status = 'sent';
        $email->message_id = $messageId;
        $email->in_reply_to = $inReplyTo;
        $email->from_address = $emailAccount->email_address;
        $email->to_addresses = implode(', ', $to);
        $email->cc_addresses = $cc === [] ? null : implode(', ', $cc);
        $email->bcc_addresses = $bcc === [] ? null : implode(', ', $bcc);
        $email->subject = $subject;
        $email->body_html = $bodyHtml;
        $email->body_text = $bodyText;
        $email->sent_at = date('Y-m-d H:i:s');
        $email->received_at = date('Y-m-d H:i:s');
        $email->contact_id = $contactId;
        $email->estate_id = $estateId;
        $email->email_template_id = $emailTemplateId;
        $email->save();

        $this->logger->info('Email sent via ' . $emailAccount->email_address . ' to ' . implode(', ', $to));

        return $email;
    }

    private function buildDsn(EmailAccount $emailAccount, string $password): string
    {
        $scheme = match ($emailAccount->smtp_encryption) {
            'ssl' => 'smtps',
            'tls' => 'smtp',
            default => 'smtp',
        };

        $user = rawurlencode($emailAccount->username);
        $pass = rawurlencode($password);
        $host = $emailAccount->smtp_host;
        $port = $emailAccount->smtp_port;

        return sprintf('%s://%s:%s@%s:%d', $scheme, $user, $pass, $host, $port);
    }

    private function decryptPassword(EmailAccount $emailAccount): string
    {
        if ($emailAccount->password_encrypted === null || $emailAccount->password_encrypted === '') {
            throw new RuntimeException('No password configured for this email account');
        }

        return $this->encryptionService->decrypt($emailAccount->password_encrypted);
    }
}
