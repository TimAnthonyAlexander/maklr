<?php

namespace App\Services\OpenImmo;

use FTP\Connection;
use App\Models\Portal;
use App\Services\EncryptionService;
use BaseApi\Logger;
use Throwable;

class FtpSyncService
{
    public function __construct(
        private readonly EncryptionService $encryptionService,
        private readonly Logger $logger,
    ) {}

    /**
     * Upload XML content and image files to a portal via FTP.
     *
     * @param array<string> $imageFilePaths Local paths to image files
     * @return array{success: bool, error: ?string, bytes_transferred: int}
     */
    public function upload(Portal $portal, string $xmlContent, array $imageFilePaths = []): array
    {
        $connection = null;

        try {
            $connection = $this->connect($portal);
            if (!$connection instanceof Connection) {
                return ['success' => false, 'error' => 'FTP connection failed', 'bytes_transferred' => 0];
            }

            $bytesTransferred = 0;

            $remotePath = rtrim($portal->ftp_path ?? '', '/');
            $xmlFilename = $remotePath . '/openimmo_' . date('Y-m-d_His') . '.xml';

            $tempFile = $this->writeToTempFile($xmlContent);
            if ($tempFile === null) {
                return ['success' => false, 'error' => 'Failed to create temp file', 'bytes_transferred' => 0];
            }

            try {
                $uploaded = ftp_put($connection, $xmlFilename, $tempFile, FTP_BINARY);
                if (!$uploaded) {
                    return ['success' => false, 'error' => 'Failed to upload XML file', 'bytes_transferred' => 0];
                }

                $bytesTransferred += strlen($xmlContent);
            } finally {
                unlink($tempFile);
            }

            foreach ($imageFilePaths as $imageFilePath) {
                $result = $this->uploadFile($connection, $imageFilePath, $remotePath);
                if ($result > 0) {
                    $bytesTransferred += $result;
                }
            }

            return ['success' => true, 'error' => null, 'bytes_transferred' => $bytesTransferred];
        } catch (Throwable $throwable) {
            $this->logger->error('ftp_sync_failed', [
                'portal_id' => $portal->id,
                'error' => $throwable->getMessage(),
            ]);

            return ['success' => false, 'error' => $throwable->getMessage(), 'bytes_transferred' => 0];
        } finally {
            if ($connection instanceof Connection) {
                @ftp_close($connection);
            }
        }
    }

    /**
     * Test FTP connection to a portal.
     *
     * @return array{success: bool, error: ?string}
     */
    public function testConnection(Portal $portal): array
    {
        $connection = null;

        try {
            $connection = $this->connect($portal);
            if (!$connection instanceof Connection) {
                return ['success' => false, 'error' => 'FTP connection failed'];
            }

            return ['success' => true, 'error' => null];
        } catch (Throwable $throwable) {
            return ['success' => false, 'error' => $throwable->getMessage()];
        } finally {
            if ($connection instanceof Connection) {
                @ftp_close($connection);
            }
        }
    }

    private function connect(Portal $portal): ?Connection
    {
        $host = $portal->ftp_host;
        $port = $portal->ftp_port ?? 21;

        if ($host === null || $host === '') {
            return null;
        }

        $connection = $portal->ftp_ssl
            ? @ftp_ssl_connect($host, $port, 30)
            : @ftp_connect($host, $port, 30);

        if ($connection === false) {
            return null;
        }

        $password = '';
        if ($portal->ftp_password_encrypted !== null && $portal->ftp_password_encrypted !== '') {
            $password = $this->encryptionService->decrypt($portal->ftp_password_encrypted);
        }

        $loggedIn = @ftp_login($connection, $portal->ftp_username ?? '', $password);
        if (!$loggedIn) {
            @ftp_close($connection);
            return null;
        }

        if ($portal->ftp_passive) {
            ftp_pasv($connection, true);
        }

        return $connection;
    }

    private function writeToTempFile(string $content): ?string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'openimmo_');
        if ($tempFile === false) {
            return null;
        }

        file_put_contents($tempFile, $content);

        return $tempFile;
    }

    private function uploadFile(Connection $connection, string $localPath, string $remotePath): int
    {
        if (!file_exists($localPath)) {
            return 0;
        }

        $filename = basename($localPath);
        $remoteFile = $remotePath . '/' . $filename;

        $uploaded = @ftp_put($connection, $remoteFile, $localPath, FTP_BINARY);
        if (!$uploaded) {
            $this->logger->error('ftp_file_upload_failed', [
                'local_path' => $localPath,
                'remote_file' => $remoteFile,
            ]);
            return 0;
        }

        return (int) filesize($localPath);
    }
}
