<?php

namespace App\Services;

use RuntimeException;
use Webklex\PHPIMAP\Address;
use App\Models\Contact;
use App\Models\Email;
use App\Models\EmailAccount;
use BaseApi\Logger;
use Throwable;
use Webklex\PHPIMAP\Client;
use Webklex\PHPIMAP\ClientManager;

class ImapService
{
    private const array INBOX_FOLDERS = ['INBOX'];

    private const array SENT_FOLDERS = [
        'Sent',
        'INBOX.Sent',
        'Sent Messages',
        '[Gmail]/Sent Mail',
        'Gesendete Objekte',
    ];

    private const array TRASH_FOLDERS = [
        'Trash',
        'INBOX.Trash',
        'Deleted Messages',
        '[Gmail]/Trash',
        'Papierkorb',
        'Gelöschte Objekte',
        'Gelöschte Elemente',
    ];

    private const array SPAM_FOLDERS = [
        'Spam',
        'Junk',
        'INBOX.Spam',
        'INBOX.Junk',
        'Junk E-mail',
        '[Gmail]/Spam',
        'Junk-E-Mail',
    ];

    private const array DRAFTS_FOLDERS = [
        'Drafts',
        'INBOX.Drafts',
        '[Gmail]/Drafts',
        'Entwürfe',
    ];

    public function __construct(
        private readonly EncryptionService $encryptionService,
        private readonly Logger $logger,
    ) {}

    /**
     * Test IMAP connection for an email account.
     * Returns true on success, throws on failure.
     *
     * @throws RuntimeException
     */
    public function testConnection(EmailAccount $emailAccount): bool
    {
        $client = $this->createClient($emailAccount);

        try {
            $client->connect();
            $client->getFolders();
            $client->disconnect();
        } catch (Throwable $throwable) {
            throw new RuntimeException('IMAP connection failed: ' . $throwable->getMessage(), $throwable->getCode(), $throwable);
        }

        return true;
    }

    /**
     * Sync emails from an IMAP account.
     * Returns the count of newly synced emails.
     */
    public function syncAccount(EmailAccount $emailAccount, int $limit = 50): int
    {
        ini_set('memory_limit', '512M');

        $client = $this->createClient($emailAccount);

        try {
            $client->connect();
        } catch (Throwable $throwable) {
            throw new RuntimeException('IMAP connection failed: ' . $throwable->getMessage(), $throwable->getCode(), $throwable);
        }

        $synced = 0;

        try {
            $folders = $client->getFolders();
            $folderNames = [];
            foreach ($folders as $folder) {
                $folderNames[] = $folder->path;
            }

            $foldersToSync = $this->resolveFolders($folderNames);

            foreach ($foldersToSync as $folderPath => $folderMeta) {
                $direction = $folderMeta['direction'];
                $folderType = $folderMeta['folder'];
                $folder = null;
                foreach ($folders as $f) {
                    if ($f->path === $folderPath) {
                        $folder = $f;
                        break;
                    }
                }

                if ($folder === null) {
                    continue;
                }

                $query = $folder->messages()->all();

                if ($emailAccount->last_sync_at !== null && $emailAccount->last_sync_at !== '') {
                    $since = date('Y-m-d', strtotime($emailAccount->last_sync_at) - 3600);
                    $query = $query->since($since);
                }

                $messages = $query->limit($limit)->get();

                foreach ($messages as $message) {
                    $messageId = $message->getMessageId()?->toString() ?? null;

                    if ($messageId !== null && $messageId !== '') {
                        $exists = Email::where('message_id', '=', $messageId)
                            ->where('email_account_id', '=', $emailAccount->id)
                            ->exists();

                        if ($exists) {
                            continue;
                        }
                    }

                    $fromAddress = '';
                    $fromName = '';
                    $from = $message->getFrom();
                    if ($from !== null) {
                        $fromItems = $from->toArray();
                        if (!empty($fromItems)) {
                            $first = $fromItems[0];
                            $fromAddress = $first instanceof Address ? $first->mail : ($first['mail'] ?? '');
                            $personal = $first instanceof Address ? ($first->personal ?? '') : ($first['personal'] ?? '');
                            $fromName = trim((string) $personal) !== $fromAddress ? trim((string) $personal) : '';
                        }
                    }

                    $toAddresses = [];
                    $toNames = [];
                    $to = $message->getTo();
                    if ($to !== null) {
                        foreach ($to->toArray() as $addr) {
                            $mail = $addr instanceof Address ? $addr->mail : ($addr['mail'] ?? '');
                            $personal = $addr instanceof Address ? ($addr->personal ?? '') : ($addr['personal'] ?? '');
                            $toAddresses[] = $mail;
                            $name = trim((string) $personal) !== $mail ? trim((string) $personal) : '';
                            $toNames[] = $name;
                        }
                    }

                    $ccAddresses = [];
                    $ccNames = [];
                    $cc = $message->getCc();
                    if ($cc !== null) {
                        foreach ($cc->toArray() as $addr) {
                            $mail = $addr instanceof Address ? $addr->mail : ($addr['mail'] ?? '');
                            $personal = $addr instanceof Address ? ($addr->personal ?? '') : ($addr['personal'] ?? '');
                            $ccAddresses[] = $mail;
                            $name = trim((string) $personal) !== $mail ? trim((string) $personal) : '';
                            $ccNames[] = $name;
                        }
                    }

                    $email = new Email();
                    $email->email_account_id = $emailAccount->id;
                    $email->office_id = $emailAccount->office_id;
                    $email->direction = $direction;
                    $email->folder = $folderType;
                    $email->status = 'received';
                    $email->message_id = $messageId;
                    $email->in_reply_to = $message->getInReplyTo()?->toString() ?? null;
                    $email->from_address = $fromAddress;
                    $email->from_name = $fromName !== '' ? $fromName : null;
                    $email->to_addresses = implode(', ', $toAddresses);
                    $email->to_names = $toNames !== [] ? implode(', ', $toNames) : null;
                    $email->cc_addresses = $ccAddresses === [] ? null : implode(', ', $ccAddresses);
                    $email->cc_names = $ccNames !== [] ? implode(', ', $ccNames) : null;
                    $email->subject = $message->getSubject()?->toString() ?? '(No Subject)';
                    $email->body_html = $message->getHTMLBody() ?: null;
                    $email->body_text = $message->getTextBody() ?: null;

                    $date = $message->getDate()?->toDate();
                    $dateStr = $date !== null ? $date->format('Y-m-d H:i:s') : date('Y-m-d H:i:s');
                    $email->received_at = $dateStr;
                    $email->sent_at = $direction === 'outgoing' ? $dateStr : null;

                    $email->contact_id = $this->matchContact(
                        $direction === 'outgoing' ? implode(', ', $toAddresses) : $fromAddress,
                        $emailAccount->office_id,
                    );

                    $email->save();
                    $synced++;
                }
            }
        } catch (Throwable $throwable) {
            $this->logger->error('IMAP sync error: ' . $throwable->getMessage());
            throw $throwable;
        } finally {
            try {
                $client->disconnect();
            } catch (Throwable) {
                // ignore disconnect errors
            }
        }

        return $synced;
    }

    private function createClient(EmailAccount $emailAccount): Client
    {
        $password = $this->decryptPassword($emailAccount);

        $clientManager = new ClientManager();

        return $clientManager->make([
            'host' => $emailAccount->imap_host,
            'port' => $emailAccount->imap_port,
            'encryption' => $emailAccount->imap_encryption === 'none' ? false : $emailAccount->imap_encryption,
            'validate_cert' => true,
            'username' => $emailAccount->username,
            'password' => $password,
            'protocol' => 'imap',
        ]);
    }

    private function decryptPassword(EmailAccount $emailAccount): string
    {
        if ($emailAccount->password_encrypted === null || $emailAccount->password_encrypted === '') {
            throw new RuntimeException('No password configured for this email account');
        }

        return $this->encryptionService->decrypt($emailAccount->password_encrypted);
    }

    /**
     * Resolve which IMAP folders to sync and their direction/folder type.
     *
     * @param string[] $availableFolders
     * @return array<string, array{direction: string, folder: string}> folder path => meta
     */
    private function resolveFolders(array $availableFolders): array
    {
        $result = [];

        foreach (self::INBOX_FOLDERS as $name) {
            if (in_array($name, $availableFolders, true)) {
                $result[$name] = ['direction' => 'incoming', 'folder' => 'inbox'];
            }
        }

        $specialFolders = [
            ['candidates' => self::SENT_FOLDERS, 'direction' => 'outgoing', 'folder' => 'sent'],
            ['candidates' => self::TRASH_FOLDERS, 'direction' => 'incoming', 'folder' => 'trash'],
            ['candidates' => self::SPAM_FOLDERS, 'direction' => 'incoming', 'folder' => 'spam'],
            ['candidates' => self::DRAFTS_FOLDERS, 'direction' => 'outgoing', 'folder' => 'drafts'],
        ];

        foreach ($specialFolders as $specialFolder) {
            foreach ($specialFolder['candidates'] as $name) {
                if (in_array($name, $availableFolders, true)) {
                    $result[$name] = ['direction' => $specialFolder['direction'], 'folder' => $specialFolder['folder']];
                    break; // only use first matching folder per type
                }
            }
        }

        return $result;
    }

    /**
     * Try to match an email address to a Contact in the same office.
     */
    private function matchContact(string $emailAddress, ?string $officeId): ?string
    {
        if ($emailAddress === '' || $officeId === null) {
            return null;
        }

        // Handle comma-separated addresses; try each one
        $addresses = array_map('trim', explode(',', $emailAddress));

        foreach ($addresses as $address) {
            if ($address === '') {
                continue;
            }

            $contact = Contact::where('email', '=', $address)
                ->where('office_id', '=', $officeId)
                ->first();

            if ($contact instanceof Contact) {
                return $contact->id;
            }
        }

        return null;
    }
}
