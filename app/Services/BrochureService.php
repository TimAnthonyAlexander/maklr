<?php

namespace App\Services;

use App\Models\Estate;
use App\Models\EstateImage;
use App\Models\Office;
use App\Models\User;
use BaseApi\Storage\Storage;
use Dompdf\Dompdf;
use Dompdf\Options;

class BrochureService
{
    private const string PRIMARY_COLOR = '#1A1A1A';

    private const string ACCENT_COLOR = '#555555';

    private const string FONT_FAMILY = 'Helvetica, Arial, sans-serif';

    private const int MAX_GALLERY_IMAGES = 6;

    /**
     * Generate a PDF brochure for an estate.
     *
     * @param array<EstateImage> $images
     * @return string Raw PDF bytes
     */
    public function generate(Estate $estate, array $images, ?User $user, ?Office $office): string
    {
        $html = $this->buildHtml($estate, $images, $user, $office);

        $options = new Options();
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'Helvetica');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output() ?: '';
    }

    /**
     * Generate a PDF brochure with custom AI-generated content.
     *
     * @param array<string, mixed> $content Brochure content (headline, description, highlights, location_summary, call_to_action)
     * @param array<EstateImage> $images
     * @return string Raw PDF bytes
     */
    public function generateWithContent(Estate $estate, array $content, array $images, ?User $user, ?Office $office): string
    {
        $html = $this->buildHtmlWithContent($estate, $content, $images, $user, $office);

        $options = new Options();
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'Helvetica');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output() ?: '';
    }

    /**
     * @param array<string, mixed> $content
     * @param array<EstateImage> $images
     */
    private function buildHtmlWithContent(Estate $estate, array $content, array $images, ?User $user, ?Office $office): string
    {
        $gallery = [];
        $floorPlans = [];

        foreach ($images as $image) {
            if ($image->category === 'floor_plan') {
                $floorPlans[] = $image;
            } else {
                $gallery[] = $image;
            }
        }

        usort($gallery, fn(EstateImage $a, EstateImage $b): int => $a->sort_order <=> $b->sort_order);
        usort($floorPlans, fn(EstateImage $a, EstateImage $b): int => $a->sort_order <=> $b->sort_order);

        $gallery = array_slice($gallery, 0, self::MAX_GALLERY_IMAGES);

        $heroImage = $gallery[0] ?? null;
        $gridImages = array_slice($gallery, 1, 5);

        $heroDataUri = $heroImage !== null ? $this->imageToDataUri($heroImage) : null;
        $gridDataUris = array_map(fn(EstateImage $estateImage): ?string => $this->imageToDataUri($estateImage), $gridImages);
        $floorPlanDataUris = array_map(fn(EstateImage $estateImage): ?string => $this->imageToDataUri($estateImage), $floorPlans);

        $hasFloorPlans = array_filter($floorPlanDataUris, fn($uri): bool => $uri !== null) !== [];
        $totalPages = $hasFloorPlans ? 3 : 2;

        $styles = $this->buildStyles();
        $page1 = $this->buildContentPage1($estate, $content, $heroDataUri, 1, $totalPages);
        $page2 = $this->buildContentPage2($estate, $content, $gridDataUris, $user, $office, 2, $totalPages);
        $page3 = $this->buildPage3($floorPlanDataUris, 3, $totalPages);

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>{$styles}</style>
        </head>
        <body>
            {$page1}
            {$page2}
            {$page3}
        </body>
        </html>
        HTML;
    }

    /**
     * @param array<string, mixed> $content
     */
    private function buildContentPage1(Estate $estate, array $content, ?string $heroDataUri, int $pageNum, int $totalPages): string
    {
        $address = $this->buildAddress($estate);
        $price = $this->formatPrice($estate->price, $estate->marketing_type);
        $headline = htmlspecialchars((string) ($content['headline'] ?? $estate->title), ENT_QUOTES, 'UTF-8');
        $addressHtml = htmlspecialchars($address, ENT_QUOTES, 'UTF-8');

        $heroHtml = '';
        if ($heroDataUri !== null) {
            $heroHtml = '<div class="hero-image"><img src="' . $heroDataUri . '" /></div>';
        } else {
            $heroHtml = '<div class="hero-placeholder"></div>';
        }

        $facts = $this->buildKeyFacts($estate);
        $footer = $this->buildFooter($estate, $pageNum, $totalPages);

        return <<<HTML
        <div class="page">
            <div class="header-bar"></div>
            {$heroHtml}
            <div class="title-block">
                <h1>{$headline}</h1>
                <p class="address">{$addressHtml}</p>
                <p class="price">{$price}</p>
            </div>
            <table class="facts-table">
                {$facts}
            </table>
            {$footer}
        </div>
        HTML;
    }

    /**
     * @param array<string, mixed> $content
     * @param array<string|null> $gridDataUris
     */
    private function buildContentPage2(Estate $estate, array $content, array $gridDataUris, ?User $user, ?Office $office, int $pageNum, int $totalPages): string
    {
        $description = '';
        $descText = (string) ($content['description'] ?? '');
        if ($descText !== '') {
            $descHtml = htmlspecialchars($descText, ENT_QUOTES, 'UTF-8');
            $description = '<div class="section"><h2>Description</h2><p>' . nl2br($descHtml) . '</p></div>';
        }

        /** @var array<string> $highlights */
        $highlights = $content['highlights'] ?? [];
        $highlightsHtml = '';
        if ($highlights !== []) {
            $items = array_map(
                fn(string $h): string => '<li>' . htmlspecialchars($h, ENT_QUOTES, 'UTF-8') . '</li>',
                $highlights,
            );
            $highlightsHtml = '<div class="section"><h2>Highlights</h2><ul class="features-list">' . implode('', $items) . '</ul></div>';
        }

        $locationSummary = (string) ($content['location_summary'] ?? '');
        $locationHtml = '';
        if ($locationSummary !== '') {
            $locText = htmlspecialchars($locationSummary, ENT_QUOTES, 'UTF-8');
            $locationHtml = '<div class="section"><h2>Location</h2><p>' . nl2br($locText) . '</p></div>';
        }

        $callToAction = (string) ($content['call_to_action'] ?? '');
        $ctaHtml = '';
        if ($callToAction !== '') {
            $ctaText = htmlspecialchars($callToAction, ENT_QUOTES, 'UTF-8');
            $ctaHtml = '<div class="section cta-block"><p>' . nl2br($ctaText) . '</p></div>';
        }

        $gridHtml = '';
        if ($gridDataUris !== []) {
            $gridHtml = '<div class="image-grid"><table class="grid-table"><tr>';
            $cellCount = 0;
            foreach ($gridDataUris as $gridDataUri) {
                if ($gridDataUri === null) {
                    continue;
                }

                if ($cellCount > 0 && $cellCount % 3 === 0) {
                    $gridHtml .= '</tr><tr>';
                }

                $gridHtml .= '<td class="grid-cell"><img src="' . $gridDataUri . '" /></td>';
                $cellCount++;
            }

            $gridHtml .= '</tr></table></div>';
        }

        $agentHtml = $this->buildAgentBlock($user, $office);
        $footer = $this->buildFooter($estate, $pageNum, $totalPages);

        return <<<HTML
        <div class="page">
            {$description}
            {$highlightsHtml}
            {$locationHtml}
            {$gridHtml}
            {$ctaHtml}
            {$agentHtml}
            {$footer}
        </div>
        HTML;
    }

    private function buildHtml(Estate $estate, array $images, ?User $user, ?Office $office): string
    {
        $gallery = [];
        $floorPlans = [];

        foreach ($images as $image) {
            if ($image->category === 'floor_plan') {
                $floorPlans[] = $image;
            } else {
                $gallery[] = $image;
            }
        }

        usort($gallery, fn(EstateImage $a, EstateImage $b): int => $a->sort_order <=> $b->sort_order);
        usort($floorPlans, fn(EstateImage $a, EstateImage $b): int => $a->sort_order <=> $b->sort_order);

        $gallery = array_slice($gallery, 0, self::MAX_GALLERY_IMAGES);

        $heroImage = $gallery[0] ?? null;
        $gridImages = array_slice($gallery, 1, 5);

        $heroDataUri = $heroImage !== null ? $this->imageToDataUri($heroImage) : null;
        $gridDataUris = array_map(fn(EstateImage $estateImage): ?string => $this->imageToDataUri($estateImage), $gridImages);
        $floorPlanDataUris = array_map(fn(EstateImage $estateImage): ?string => $this->imageToDataUri($estateImage), $floorPlans);

        $hasFloorPlans = array_filter($floorPlanDataUris, fn($uri): bool => $uri !== null) !== [];
        $totalPages = $hasFloorPlans ? 3 : 2;

        $styles = $this->buildStyles();
        $page1 = $this->buildPage1($estate, $heroDataUri, 1, $totalPages);
        $page2 = $this->buildPage2($estate, $gridDataUris, $user, $office, 2, $totalPages);
        $page3 = $this->buildPage3($floorPlanDataUris, 3, $totalPages);

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>{$styles}</style>
        </head>
        <body>
            {$page1}
            {$page2}
            {$page3}
        </body>
        </html>
        HTML;
    }

    private function buildPage1(Estate $estate, ?string $heroDataUri, int $pageNum, int $totalPages): string
    {
        $address = $this->buildAddress($estate);
        $price = $this->formatPrice($estate->price, $estate->marketing_type);
        $title = htmlspecialchars($estate->title, ENT_QUOTES, 'UTF-8');
        $addressHtml = htmlspecialchars($address, ENT_QUOTES, 'UTF-8');

        $heroHtml = '';
        if ($heroDataUri !== null) {
            $heroHtml = '<div class="hero-image"><img src="' . $heroDataUri . '" /></div>';
        } else {
            $heroHtml = '<div class="hero-placeholder"></div>';
        }

        $facts = $this->buildKeyFacts($estate);
        $footer = $this->buildFooter($estate, $pageNum, $totalPages);

        return <<<HTML
        <div class="page">
            <div class="header-bar"></div>
            {$heroHtml}
            <div class="title-block">
                <h1>{$title}</h1>
                <p class="address">{$addressHtml}</p>
                <p class="price">{$price}</p>
            </div>
            <table class="facts-table">
                {$facts}
            </table>
            {$footer}
        </div>
        HTML;
    }

    private function buildPage2(Estate $estate, array $gridDataUris, ?User $user, ?Office $office, int $pageNum, int $totalPages): string
    {
        $description = '';
        if ($estate->description !== null && $estate->description !== '') {
            $descText = htmlspecialchars($estate->description, ENT_QUOTES, 'UTF-8');
            $description = '<div class="section"><h2>Description</h2><p>' . nl2br($descText) . '</p></div>';
        }

        $features = $this->buildFeaturesList($estate);
        $featuresHtml = '';
        if ($features !== '') {
            $featuresHtml = '<div class="section"><h2>Features</h2>' . $features . '</div>';
        }

        $gridHtml = '';
        if ($gridDataUris !== []) {
            $gridHtml = '<div class="image-grid"><table class="grid-table"><tr>';
            $cellCount = 0;
            foreach ($gridDataUris as $gridDataUri) {
                if ($gridDataUri === null) {
                    continue;
                }

                if ($cellCount > 0 && $cellCount % 3 === 0) {
                    $gridHtml .= '</tr><tr>';
                }

                $gridHtml .= '<td class="grid-cell"><img src="' . $gridDataUri . '" /></td>';
                $cellCount++;
            }

            $gridHtml .= '</tr></table></div>';
        }

        $agentHtml = $this->buildAgentBlock($user, $office);
        $footer = $this->buildFooter($estate, $pageNum, $totalPages);

        return <<<HTML
        <div class="page">
            {$description}
            {$featuresHtml}
            {$gridHtml}
            {$agentHtml}
            {$footer}
        </div>
        HTML;
    }

    private function buildPage3(array $floorPlanDataUris, int $pageNum, int $totalPages): string
    {
        $validUris = array_filter($floorPlanDataUris, fn($uri): bool => $uri !== null);
        if ($validUris === []) {
            return '';
        }

        $imagesHtml = '';
        foreach ($validUris as $validUri) {
            $imagesHtml .= '<div class="floor-plan-image"><img src="' . $validUri . '" /></div>';
        }

        $footer = $this->buildFooter(null, $pageNum, $totalPages);

        return <<<HTML
        <div class="page">
            <h2>Floor Plans</h2>
            {$imagesHtml}
            {$footer}
        </div>
        HTML;
    }

    private function buildFooter(?Estate $estate, int $pageNum, int $totalPages): string
    {
        $ref = '';
        if ($estate instanceof Estate) {
            $id = $estate->external_id ?? $estate->id;
            $ref = htmlspecialchars($id, ENT_QUOTES, 'UTF-8');
        }

        $leftHtml = $ref !== '' ? '<span class="footer-ref">Ref: ' . $ref . '</span>' : '';

        return <<<HTML
        <div class="page-footer">
            <table class="footer-table">
                <tr>
                    <td class="footer-left">{$leftHtml}</td>
                    <td class="footer-right">Page {$pageNum} of {$totalPages}</td>
                </tr>
            </table>
        </div>
        HTML;
    }

    private function buildStyles(): string
    {
        $primary = self::PRIMARY_COLOR;
        $accent = self::ACCENT_COLOR;
        $font = self::FONT_FAMILY;

        return <<<CSS
        @page {
            margin: 40px 50px 60px 50px;
        }
        body {
            font-family: {$font};
            color: {$primary};
            font-size: 11pt;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        .page {
            page-break-after: always;
            position: relative;
        }
        .page:last-child {
            page-break-after: auto;
        }
        .header-bar {
            width: 100%;
            height: 6px;
            background-color: {$primary};
            margin-bottom: 20px;
        }
        h1 {
            font-size: 22pt;
            font-weight: 700;
            margin: 0 0 5px 0;
            color: {$primary};
        }
        h2 {
            font-size: 14pt;
            font-weight: 600;
            margin: 20px 0 10px 0;
            color: {$primary};
            border-bottom: 2px solid {$primary};
            padding-bottom: 5px;
        }
        p {
            margin: 0 0 10px 0;
        }
        .hero-image {
            width: 100%;
            max-height: 350px;
            overflow: hidden;
            margin-bottom: 20px;
        }
        .hero-image img {
            width: 100%;
            height: auto;
        }
        .hero-placeholder {
            width: 100%;
            height: 120px;
            background-color: #F0F0F0;
            border: 2px dashed #D0D0D0;
            margin-bottom: 20px;
        }
        .title-block {
            margin-bottom: 20px;
        }
        .address {
            font-size: 11pt;
            color: {$accent};
            margin: 0 0 5px 0;
        }
        .price {
            font-size: 16pt;
            font-weight: 700;
            color: {$primary};
            margin: 5px 0 15px 0;
        }
        .facts-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .facts-table td {
            padding: 6px 10px;
            border-bottom: 1px solid #E0E0E0;
            vertical-align: top;
            font-size: 10pt;
        }
        .facts-table .label {
            color: {$accent};
            width: 20%;
        }
        .facts-table .value {
            font-weight: 500;
            width: 30%;
        }
        .section {
            margin-bottom: 15px;
        }
        .section p {
            font-size: 10pt;
            color: #333333;
        }
        .features-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .features-list li {
            font-size: 10pt;
            padding: 3px 0;
        }
        .grid-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        .grid-cell {
            width: 33.33%;
            padding: 3px;
            vertical-align: top;
        }
        .grid-cell img {
            width: 100%;
            height: auto;
        }
        .agent-block {
            margin-top: 25px;
            padding: 15px 20px;
            background-color: #F5F5F5;
            border-top: 3px solid {$primary};
        }
        .agent-block .office-name {
            font-weight: 700;
            font-size: 12pt;
            margin: 0 0 8px 0;
            color: {$primary};
        }
        .agent-block .agent-divider {
            border: none;
            border-top: 1px solid #D0D0D0;
            margin: 8px 0;
        }
        .agent-block .agent-name {
            font-weight: 600;
            font-size: 11pt;
            margin: 0 0 3px 0;
        }
        .agent-block .agent-detail {
            font-size: 9pt;
            color: {$accent};
            margin: 0 0 2px 0;
        }
        .cta-block {
            margin-top: 15px;
            padding: 12px 15px;
            background-color: #F5F5F5;
            border-left: 3px solid {$primary};
        }
        .cta-block p {
            font-size: 10pt;
            font-style: italic;
            color: {$primary};
            margin: 0;
        }
        .floor-plan-image {
            margin: 15px 0;
            text-align: center;
        }
        .floor-plan-image img {
            max-width: 100%;
            height: auto;
        }
        .page-footer {
            position: fixed;
            bottom: -30px;
            left: 0;
            width: 100%;
        }
        .footer-table {
            width: 100%;
            border-collapse: collapse;
            border-top: 1px solid #E0E0E0;
        }
        .footer-table td {
            padding: 8px 0 0 0;
            font-size: 8pt;
            color: {$accent};
            vertical-align: top;
        }
        .footer-left {
            text-align: left;
        }
        .footer-right {
            text-align: right;
        }
        .footer-ref {
            font-size: 8pt;
            color: {$accent};
        }
        CSS;
    }

    private function buildKeyFacts(Estate $estate): string
    {
        $rows = [];

        $typeLabels = [
            'apartment' => 'Apartment',
            'house' => 'House',
            'commercial' => 'Commercial',
            'land' => 'Land',
            'garage' => 'Garage',
        ];
        $rows[] = ['Property Type', $typeLabels[$estate->property_type] ?? ucfirst($estate->property_type)];
        $rows[] = ['Marketing Type', ucfirst($estate->marketing_type)];

        if ($estate->rooms !== null) {
            $rows[] = ['Rooms', (string) $estate->rooms];
        }

        if ($estate->bedrooms !== null) {
            $rows[] = ['Bedrooms', (string) $estate->bedrooms];
        }

        if ($estate->bathrooms !== null) {
            $rows[] = ['Bathrooms', (string) $estate->bathrooms];
        }

        if ($estate->area_living !== null) {
            $rows[] = ['Living Area', $this->formatArea($estate->area_living)];
        }

        if ($estate->area_total !== null) {
            $rows[] = ['Total Area', $this->formatArea($estate->area_total)];
        }

        if ($estate->area_plot !== null) {
            $rows[] = ['Plot Area', $this->formatArea($estate->area_plot)];
        }

        if ($estate->floor !== null) {
            $floor = $estate->floor === 0 ? 'Ground Floor' : (string) $estate->floor;
            if ($estate->floors_total !== null) {
                $floor .= ' / ' . $estate->floors_total . ' Floors';
            }

            $rows[] = ['Floor', $floor];
        }

        if ($estate->year_built !== null) {
            $rows[] = ['Year Built', (string) $estate->year_built];
        }

        if ($estate->parking_spaces !== null) {
            $rows[] = ['Parking', $estate->parking_spaces . ' space(s)'];
        }

        if ($estate->heating_type !== null) {
            $rows[] = ['Heating', ucfirst(str_replace('_', ' ', $estate->heating_type))];
        }

        if ($estate->energy_rating !== null) {
            $rows[] = ['Energy Rating', strtoupper($estate->energy_rating)];
        }

        if ($estate->condition !== null) {
            $rows[] = ['Condition', ucfirst(str_replace('_', ' ', $estate->condition))];
        }

        // Build 4-column layout: two label-value pairs per row
        $html = '';
        $counter = count($rows);
        for ($i = 0; $i < $counter; $i += 2) {
            $label1 = htmlspecialchars($rows[$i][0], ENT_QUOTES, 'UTF-8');
            $value1 = htmlspecialchars($rows[$i][1], ENT_QUOTES, 'UTF-8');

            if (isset($rows[$i + 1])) {
                $label2 = htmlspecialchars($rows[$i + 1][0], ENT_QUOTES, 'UTF-8');
                $value2 = htmlspecialchars($rows[$i + 1][1], ENT_QUOTES, 'UTF-8');
            } else {
                $label2 = '';
                $value2 = '';
            }

            $html .= '<tr>'
                . '<td class="label">' . $label1 . '</td>'
                . '<td class="value">' . $value1 . '</td>'
                . '<td class="label">' . $label2 . '</td>'
                . '<td class="value">' . $value2 . '</td>'
                . '</tr>';
        }

        return $html;
    }

    private function buildFeaturesList(Estate $estate): string
    {
        $features = [];

        if ($estate->furnished) {
            $features[] = 'Furnished';
        }

        if ($estate->balcony) {
            $features[] = 'Balcony';
        }

        if ($estate->garden) {
            $features[] = 'Garden';
        }

        if ($estate->elevator) {
            $features[] = 'Elevator';
        }

        if ($estate->cellar) {
            $features[] = 'Cellar';
        }

        if ($features === []) {
            return '';
        }

        $items = array_map(
            fn(string $f): string => '<li>• ' . htmlspecialchars($f, ENT_QUOTES, 'UTF-8') . '</li>',
            $features,
        );

        return '<ul class="features-list">' . implode('', $items) . '</ul>';
    }

    private function buildAgentBlock(?User $user, ?Office $office): string
    {
        if (!$user instanceof User && !$office instanceof Office) {
            return '';
        }

        $lines = [];

        // Office name as bold header
        if ($office instanceof Office) {
            $lines[] = '<p class="office-name">' . htmlspecialchars($office->name, ENT_QUOTES, 'UTF-8') . '</p>';
        }

        // Divider between office header and agent details
        if ($office instanceof Office && $user instanceof User) {
            $lines[] = '<hr class="agent-divider" />';
        }

        if ($user instanceof User) {
            $lines[] = '<p class="agent-name">' . htmlspecialchars($user->name, ENT_QUOTES, 'UTF-8') . '</p>';
            if ($user->email !== '') {
                $lines[] = '<p class="agent-detail">' . htmlspecialchars($user->email, ENT_QUOTES, 'UTF-8') . '</p>';
            }

            if ($user->phone !== null && $user->phone !== '') {
                $lines[] = '<p class="agent-detail">' . htmlspecialchars($user->phone, ENT_QUOTES, 'UTF-8') . '</p>';
            }
        }

        // Office contact details below agent
        if ($office instanceof Office) {
            if ($office->phone !== null && $office->phone !== '') {
                $lines[] = '<p class="agent-detail">' . htmlspecialchars($office->phone, ENT_QUOTES, 'UTF-8') . '</p>';
            }

            if ($office->email !== null && $office->email !== '') {
                $lines[] = '<p class="agent-detail">' . htmlspecialchars($office->email, ENT_QUOTES, 'UTF-8') . '</p>';
            }
        }

        return '<div class="agent-block">' . implode('', $lines) . '</div>';
    }

    private function imageToDataUri(EstateImage $estateImage): ?string
    {
        if (!Storage::exists($estateImage->file_path)) {
            return null;
        }

        $content = Storage::get($estateImage->file_path);
        if ($content === '') {
            return null;
        }

        $base64 = base64_encode($content);
        $mime = $estateImage->mime_type !== '' ? $estateImage->mime_type : 'image/jpeg';

        return 'data:' . $mime . ';base64,' . $base64;
    }

    private function formatPrice(?float $price, string $marketingType): string
    {
        if ($price === null) {
            return 'Price on request';
        }

        $formatted = number_format($price, 0, ',', '.');

        return match ($marketingType) {
            'rent' => '€ ' . $formatted . ' /month',
            default => '€ ' . $formatted,
        };
    }

    private function formatArea(?float $area): string
    {
        if ($area === null) {
            return '—';
        }

        return number_format($area, 1, ',', '.') . ' m²';
    }

    private function buildAddress(Estate $estate): string
    {
        $parts = [];

        $street = trim(($estate->street ?? '') . ' ' . ($estate->house_number ?? ''));
        if ($street !== '') {
            $parts[] = $street;
        }

        $cityLine = trim(($estate->zip ?? '') . ' ' . ($estate->city ?? ''));
        if ($cityLine !== '') {
            $parts[] = $cityLine;
        }

        if ($estate->country !== null && $estate->country !== '') {
            $parts[] = $estate->country;
        }

        return implode(', ', $parts);
    }
}
