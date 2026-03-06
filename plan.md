# PDF Brochure Generation — Implementation Plan

## Overview

Generate a 2–3 page PDF brochure from estate data using dompdf. On-the-fly rendering, no storage. Triggered via action toolbar button on estate detail page.

---

## Phase 1: Backend Setup

### 1.1 Install dompdf

```bash
composer require dompdf/dompdf
```

### 1.2 Create `BrochureService`

**File:** `app/Services/BrochureService.php`

Responsibilities:
- Accept `Estate` (with images eager-loaded), `User` (assigned agent), `Office`
- Build HTML string from template using PHP interpolation
- Render HTML → PDF via dompdf
- Return raw PDF bytes as `string`

Key methods:
- `generate(Estate $estate, User $agent, Office $office): string` — orchestrator, returns PDF bytes
- `buildHtml(Estate $estate, User $agent, Office $office, array $images): string` — builds the HTML
- `getImageDataUri(string $filePath, string $mimeType): string` — reads image via `Storage::get()`, base64-encodes for inline `<img src="data:...">`
- `formatPrice(float $price): string` — formats price with thousand separators
- `formatArea(float $area): string` — formats area in m²

Template constraints (dompdf compatibility):
- CSS 2.1 only — `<table>`, `float`, `position: absolute/relative`
- No flexbox, no grid, no CSS3 transforms
- Images must be base64 data URIs (dompdf can't fetch from local storage paths)
- Page size: A4 portrait

### 1.3 Register service

**File:** `app/Providers/AppServiceProvider.php`

```php
$container->singleton(BrochureService::class);
```

---

## Phase 2: Controller + Route

### 2.1 Create `EstateBrochureController`

**File:** `app/Controllers/Estate/EstateBrochureController.php`

- Auto-bound: `public string $id = ''`, `public string $download = ''` (query param)
- `get()` method:
  1. Get `$officeId` from `$this->request->user['office_id']`
  2. Load estate with office scoping: `Estate::with(['images', 'assignedUser', 'office'])->where('id', '=', $this->id)->where('office_id', '=', $officeId)->first()`
  3. Guard: `if (!$estate instanceof Estate)` → 404
  4. Resolve agent: `$estate->assignedUser()->first()` or fall back to current user
  5. Resolve office: `$estate->office()->first()`
  6. Call `$brochureService->generate($estate, $agent, $office)`
  7. Return `new Response(200, headers, $pdfBytes)`
- Content-Disposition: `inline` by default, `attachment` if `?download=1`
- Filename: `brochure-{estate-title-slugified}.pdf`

### 2.2 Add route

**File:** `routes/api.php`

```php
$router->get('/estates/{id}/brochure', [
    RateLimitMiddleware::class => ['limit' => '10/1m'],
    CombinedAuthMiddleware::class,
    RoleMiddleware::class => ['roles' => ['agent']],
    EstateBrochureController::class,
]);
```

Place after the existing `/estates/{id}` routes.

---

## Phase 3: HTML Template

### 3.1 Template structure

The HTML is built inline in `BrochureService::buildHtml()` using heredoc/string concatenation. No separate template file for MVP (KISS — single service file contains everything).

**Page 1:**
- Hero image (first image, full-width, ~45% page height)
- Property title + full address below hero
- Price (large, prominent)
- Key facts grid as `<table>`: property type, marketing type, rooms, bedrooms, bathrooms, living area, plot area, year built, floor, energy rating

**Page 2:**
- Description text (full width)
- Features list (boolean amenities: furnished, balcony, garden, elevator, cellar + heating type, condition)
- Image grid: up to 5 remaining images in a 2-column table layout
- Agent contact block: name, email, phone
- Office info: name, address, phone, email

**Page 3 (conditional):**
- Only rendered if estate has images with `category = 'floor_plan'`
- Full-page floor plan image(s)

### 3.2 Styling

- Font: Helvetica (dompdf built-in, no custom font needed)
- Primary color: `#1A1A1A` (matching frontend theme)
- Accent color: `#333333` for secondary text
- Light gray: `#F5F5F5` for key facts background
- Clean, minimal design with adequate whitespace
- No shadows, no gradients (matches frontend design philosophy + dompdf limitations)

### 3.3 Data included (public-facing only)

**Include:** title, address (street, house_number, zip, city, country), price, property_type, marketing_type, rooms, bedrooms, bathrooms, area_living, area_plot, year_built, floor, floors_total, energy_rating, heating_type, condition, description, furnished/balcony/garden/elevator/cellar, parking_spaces

**Exclude:** owner_contact_id, owner name, internal notes, commission, status, custom_fields, external_id, virtual_tour_url, latitude/longitude

---

## Phase 4: Frontend

### 4.1 Add brochure URL helper

**File:** `web/src/api/client.ts`

```typescript
export function getEstateBrochureUrl(estateId: string): string {
  return `http://127.0.0.1:7273/estates/${encodeURIComponent(estateId)}/brochure`;
}
```

Following the existing `getEstateImageUrl` pattern.

### 4.2 Add button to estate detail page

**File:** `web/src/pages/EstateDetailPage.tsx`

Add a "Brochure" button in the action toolbar `<Box>`, before the Edit button:

```tsx
<Button
  variant="outlined"
  size="small"
  startIcon={<PictureAsPdfIcon />}
  component="a"
  href={getEstateBrochureUrl(estate.id)}
  target="_blank"
  rel="noopener noreferrer"
>
  Brochure
</Button>
```

Uses MUI's `component="a"` pattern — renders as an anchor tag, opens PDF in new tab. No JS click handler needed. Auth cookie sent automatically since it's same-origin.

---

## File Summary

| Action | File |
|--------|------|
| Create | `app/Services/BrochureService.php` |
| Create | `app/Controllers/Estate/EstateBrochureController.php` |
| Edit | `app/Providers/AppServiceProvider.php` (register service) |
| Edit | `routes/api.php` (add route) |
| Edit | `web/src/api/client.ts` (add URL helper) |
| Edit | `web/src/pages/EstateDetailPage.tsx` (add button) |

No migrations. No new models. No new frontend hooks.

---

## Implementation Order

1. `composer require dompdf/dompdf`
2. `BrochureService` — build HTML template + render via dompdf
3. `EstateBrochureController` — wire up endpoint
4. Register in `AppServiceProvider`
5. Add route in `routes/api.php`
6. Test backend: `curl http://127.0.0.1:7273/estates/{id}/brochure -H "Authorization: Bearer {token}" -o test.pdf`
7. Frontend: add URL helper + button
8. Manual test: open estate detail → click Brochure → verify PDF opens in new tab
