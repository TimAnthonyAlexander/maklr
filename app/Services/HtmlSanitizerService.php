<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Sanitizes HTML content for website builder output.
 * Removes scripts, event handlers, and dangerous elements while preserving
 * semantic HTML, Tailwind classes, styles, images, links, and media.
 */
final class HtmlSanitizerService
{
    /** Elements to completely remove (tag and all content) */
    private const array BLOCKED_ELEMENTS = [
        'script', 'object', 'embed', 'applet',
        'form', 'input', 'button', 'textarea', 'select',
    ];

    /** URI schemes considered dangerous */
    private const array DANGEROUS_SCHEMES = ['javascript:', 'vbscript:'];

    public function sanitize(string $html): string
    {
        if (trim($html) === '') {
            return '';
        }

        $dom = new \DOMDocument('1.0', 'UTF-8');

        // Suppress warnings from malformed HTML
        libxml_use_internal_errors(true);
        $dom->loadHTML(
            '<?xml encoding="UTF-8">' . $html,
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD,
        );
        libxml_clear_errors();

        $this->sanitizeNode($dom, $dom);

        $output = $dom->saveHTML();
        if ($output === false) {
            return '';
        }

        // Remove the XML encoding declaration we added
        $output = str_replace('<?xml encoding="UTF-8">', '', $output);

        return trim($output);
    }

    private function sanitizeNode(\DOMDocument $dom, \DOMNode $node): void
    {
        $nodesToRemove = [];

        foreach ($node->childNodes as $child) {
            if (!$child instanceof \DOMElement) {
                continue;
            }

            $tagName = strtolower($child->tagName);

            // Remove blocked elements entirely
            if (in_array($tagName, self::BLOCKED_ELEMENTS, true)) {
                $nodesToRemove[] = $child;
                continue;
            }

            // Remove iframes (unless we add widget pattern matching later)
            if ($tagName === 'iframe') {
                $nodesToRemove[] = $child;
                continue;
            }

            // Clean attributes on this element
            $this->sanitizeAttributes($child);

            // Recurse into children
            $this->sanitizeNode($dom, $child);
        }

        foreach ($nodesToRemove as $nodeToRemove) {
            $nodeToRemove->parentNode?->removeChild($nodeToRemove);
        }
    }

    private function sanitizeAttributes(\DOMElement $element): void
    {
        $attributesToRemove = [];

        /** @var \DOMAttr $attr */
        foreach ($element->attributes as $attr) {
            $attrName = strtolower($attr->name);

            // Remove all on* event handlers
            if (str_starts_with($attrName, 'on')) {
                $attributesToRemove[] = $attr->name;
                continue;
            }

            // Check href and src for dangerous URIs
            if (in_array($attrName, ['href', 'src', 'action'], true)) {
                if ($this->isDangerousUri($attr->value)) {
                    $attributesToRemove[] = $attr->name;
                }
            }
        }

        foreach ($attributesToRemove as $attrName) {
            $element->removeAttribute($attrName);
        }
    }

    private function isDangerousUri(string $uri): bool
    {
        $trimmed = trim($uri);
        $lower = strtolower($trimmed);

        foreach (self::DANGEROUS_SCHEMES as $scheme) {
            if (str_starts_with($lower, $scheme)) {
                return true;
            }
        }

        // Allow data: URIs only for images
        if (str_starts_with($lower, 'data:') && !str_starts_with($lower, 'data:image/')) {
            return true;
        }

        return false;
    }
}
