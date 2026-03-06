<?php

namespace App\Controllers\Website;

use App\Models\Website;
use App\Models\WebsitePage;
use BaseApi\Controllers\Controller;
use BaseApi\Http\Response;

class WebsiteServeController extends Controller
{
    public string $slug = '';

    public string $pageSlug = '';

    public function get(): Response
    {
        $website = Website::where('slug', '=', $this->slug)
            ->where('published', '=', true)
            ->first();

        if (!$website instanceof Website) {
            return $this->htmlResponse($this->render404Page(), 404);
        }

        // Get all published pages for nav
        $pages = WebsitePage::where('website_id', '=', $website->id)
            ->where('published', '=', true)
            ->orderBy('sort_order', 'ASC')
            ->get();

        // Determine which page to show
        $targetSlug = $this->pageSlug !== '' ? $this->pageSlug : null;
        $activePage = null;

        if ($targetSlug !== null) {
            foreach ($pages as $page) {
                if ($page->slug === $targetSlug) {
                    $activePage = $page;
                    break;
                }
            }

            if (!$activePage instanceof WebsitePage) {
                return $this->htmlResponse($this->render404Page(), 404);
            }
        } else {
            // Show first page by default
            $activePage = $pages[0] ?? null;
        }

        $html = $this->renderPage($website, $pages, $activePage);

        return $this->htmlResponse($html, 200);
    }

    /**
     * @param WebsitePage[] $pages
     */
    private function renderPage(Website $website, array $pages, ?WebsitePage $websitePage): string
    {
        $siteName = htmlspecialchars($website->name, ENT_QUOTES, 'UTF-8');
        $pageTitle = $websitePage instanceof WebsitePage
            ? htmlspecialchars($websitePage->title, ENT_QUOTES, 'UTF-8') . ' — ' . $siteName
            : $siteName;

        $navHtml = $this->renderNav($website, $pages, $websitePage);
        $contentHtml = $websitePage instanceof WebsitePage
            ? ($websitePage->html_content ?? '')
            : '<div class="text-center py-20 text-gray-500"><p>No pages yet.</p></div>';

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$pageTitle}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-gray-900 min-h-screen">
    {$navHtml}
    <main>
        {$contentHtml}
    </main>
</body>
</html>
HTML;
    }

    /**
     * @param WebsitePage[] $pages
     */
    private function renderNav(Website $website, array $pages, ?WebsitePage $websitePage): string
    {
        if ($pages === []) {
            return '';
        }

        $siteName = htmlspecialchars($website->name, ENT_QUOTES, 'UTF-8');
        $baseUrl = '/sites/' . htmlspecialchars($website->slug, ENT_QUOTES, 'UTF-8');

        $links = '';
        foreach ($pages as $page) {
            $url = $baseUrl . '/' . htmlspecialchars($page->slug, ENT_QUOTES, 'UTF-8');
            $label = htmlspecialchars($page->title, ENT_QUOTES, 'UTF-8');
            $activeClass = ($websitePage instanceof WebsitePage && $websitePage->id === $page->id)
                ? 'text-gray-900 font-semibold'
                : 'text-gray-600 hover:text-gray-900';

            $links .= '<a href="' . $url . '" class="' . $activeClass . ' transition-colors">' . $label . '</a>' . "\n";
        }

        return <<<HTML
<nav class="border-b border-gray-200 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
            <a href="{$baseUrl}" class="text-xl font-bold text-gray-900">{$siteName}</a>
            <div class="flex items-center gap-6">
                {$links}
            </div>
        </div>
    </div>
</nav>
HTML;
    }

    private function render404Page(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-gray-900 min-h-screen flex items-center justify-center">
    <div class="text-center">
        <h1 class="text-6xl font-bold text-gray-300">404</h1>
        <p class="mt-4 text-xl text-gray-600">Page not found</p>
    </div>
</body>
</html>
HTML;
    }

    private function htmlResponse(string $html, int $status): Response
    {
        return new Response($status, ['Content-Type' => 'text/html; charset=UTF-8'], $html);
    }
}
