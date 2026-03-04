#!/usr/bin/env php
<?php

use BaseApi\App;
use BaseApi\Cache\Cache;
use Dotenv\Dotenv;

require_once __DIR__ . '/../vendor/autoload.php';

App::boot(__DIR__ . '/..');

if (class_exists(Dotenv::class)) {
    Dotenv::createImmutable(__DIR__ . '/../')->safeLoad();
}

echo "Flushing all caches...\n";

try {
    $stats = Cache::stats();
    if ($stats !== []) {
        echo sprintf("Memory before: %s\n", $stats['used_memory_human'] ?? 'unknown');
    }

    // Flush via Cache facade (respects configured driver)
    Cache::flush();

    // Also flush the raw Redis DB to catch any orphaned/double-prefixed keys
    $redis = new Redis();
    $host = $_ENV['REDIS_HOST'] ?? '127.0.0.1';
    $port = (int) ($_ENV['REDIS_PORT'] ?? 6379);
    $db = (int) ($_ENV['REDIS_CACHE_DB'] ?? 1);
    $redis->connect($host, $port);

    if (!empty($_ENV['REDIS_PASSWORD'])) {
        $redis->auth($_ENV['REDIS_PASSWORD']);
    }

    $redis->select($db);
    $remaining = (int) $redis->dbSize();
    if ($remaining > 0) {
        $redis->flushDB();
        echo sprintf("Flushed %d remaining Redis keys via FLUSHDB.\n", $remaining);
    }

    echo "Cache flushed successfully.\n";

    $stats = Cache::stats();
    if ($stats !== []) {
        echo sprintf("Memory after: %s\n", $stats['used_memory_human'] ?? 'unknown');
    }
} catch (Throwable $throwable) {
    echo sprintf("ERROR: %s\n", $throwable->getMessage());
    exit(1);
}
