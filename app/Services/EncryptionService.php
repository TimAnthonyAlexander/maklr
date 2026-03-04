<?php

namespace App\Services;

use RuntimeException;

class EncryptionService
{
    private readonly string $key;

    public function __construct()
    {
        $hexKey = $_ENV['APP_ENCRYPTION_KEY'] ?? '';

        if ($hexKey === '') {
            throw new RuntimeException('APP_ENCRYPTION_KEY is not set');
        }

        $decoded = sodium_hex2bin((string) $hexKey);

        if (strlen($decoded) !== SODIUM_CRYPTO_SECRETBOX_KEYBYTES) {
            throw new RuntimeException(
                'APP_ENCRYPTION_KEY must be exactly ' . (SODIUM_CRYPTO_SECRETBOX_KEYBYTES * 2) . ' hex characters'
            );
        }

        $this->key = $decoded;
    }

    public function encrypt(string $plaintext): string
    {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $ciphertext = sodium_crypto_secretbox($plaintext, $nonce, $this->key);

        return base64_encode($nonce . $ciphertext);
    }

    public function decrypt(string $encoded): string
    {
        $decoded = base64_decode($encoded, true);

        if ($decoded === false) {
            throw new RuntimeException('Invalid encrypted data: base64 decode failed');
        }

        $nonceLength = SODIUM_CRYPTO_SECRETBOX_NONCEBYTES;

        if (strlen($decoded) < $nonceLength) {
            throw new RuntimeException('Invalid encrypted data: too short');
        }

        $nonce = substr($decoded, 0, $nonceLength);
        $ciphertext = substr($decoded, $nonceLength);

        $plaintext = sodium_crypto_secretbox_open($ciphertext, $nonce, $this->key);

        if ($plaintext === false) {
            throw new RuntimeException('Decryption failed: invalid key or corrupted data');
        }

        return $plaintext;
    }
}
