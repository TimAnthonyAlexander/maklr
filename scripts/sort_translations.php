#!/usr/bin/env php
<?php

declare(strict_types=1);

$root = getcwd();
$translationsDir = $root . DIRECTORY_SEPARATOR . 'translations';

if (!is_dir($translationsDir)) {
    fwrite(STDERR, sprintf('translations/ not found in: %s%s', $root, PHP_EOL));
    exit(1);
}

function isAssoc(array $arr): bool
{
    $i = 0;
    foreach (array_keys($arr) as $k) {
        if ($k !== $i) {
            return true;
        }

        $i++;
    }

    return false;
}

function sortDeep(mixed $v): mixed
{
    if (!is_array($v)) {
        return $v;
    }

    foreach ($v as $k => $child) {
        $v[$k] = sortDeep($child);
    }

    if (isAssoc($v)) {
        $keys = array_keys($v);
        natcasesort($keys);
        $sorted = [];
        foreach ($keys as $key) $sorted[$key] = $v[$key];

        return $sorted;
    }

    return $v;
}

$rii = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($translationsDir, FilesystemIterator::SKIP_DOTS)
);

$changed = 0;
$failed = 0;

foreach ($rii as $file) {
    if (!$file->isFile()) {
        continue;
    }

    if (strtolower((string) $file->getExtension()) !== 'json') {
        continue;
    }

    $path = $file->getPathname();
    $raw = file_get_contents($path);
    if ($raw === false) {
        fwrite(STDERR, sprintf('Read failed: %s%s', $path, PHP_EOL));
        $failed++;
        continue;
    }

    $data = json_decode($raw, true);
    if (!is_array($data) && $data !== null) {
        fwrite(STDERR, sprintf('Not a JSON object/array: %s%s', $path, PHP_EOL));
        $failed++;
        continue;
    }

    if (json_last_error() !== JSON_ERROR_NONE) {
        fwrite(STDERR, sprintf('JSON parse error in %s: ', $path) . json_last_error_msg() . "\n");
        $failed++;
        continue;
    }

    if (!is_array($data)) {
        continue;
    }

    $sorted = sortDeep($data);

    $encoded = json_encode(
        $sorted,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    if ($encoded === false) {
        fwrite(STDERR, sprintf('JSON encode error in %s: ', $path) . json_last_error_msg() . "\n");
        $failed++;
        continue;
    }

    $encoded .= "\n";

    if ($encoded !== $raw) {
        $ok = file_put_contents($path, $encoded);
        if ($ok === false) {
            fwrite(STDERR, sprintf('Write failed: %s%s', $path, PHP_EOL));
            $failed++;
            continue;
        }

        $changed++;
        echo sprintf('Sorted: %s%s', $path, PHP_EOL);
    }
}

echo sprintf('Done. Changed: %d, Failed: %d%s', $changed, $failed, PHP_EOL);
exit($failed > 0 ? 2 : 0);
