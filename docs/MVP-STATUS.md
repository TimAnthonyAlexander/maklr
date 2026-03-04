# MVP Implementation Status

Last updated: 2026-03-05

---

## Not Done (needs full build)

| Feature | Scope |
|---|---|
| **Contact matching engine** | Search profiles UI + matching algorithm + results page |
| **Estate bulk actions** | Checkboxes, bulk status change/assign/delete |
| **PDF brochure generation** | Pick a PDF engine, template, controller |
| **Email templates** | CRUD routes + placeholder substitution + UI |
| **Record ownership scope** | own/team/all filter on all tenant queries |
| **Contact merge duplicates** | Duplicate detection + merge logic |

---

## Partial (backend exists, needs wiring/UI)

| Feature | What's missing |
|---|---|
| **Contact search profiles** | API exposure + frontend UI for defining search criteria |
| **Contact relationships** | Write routes + UI tab on contact detail |
| **Geo data / map pin** | Leaflet map component on estate detail (lat/lng already stored) |
| **Audit log** | Persist to DB (currently logs to file only) + read endpoint + UI |
| **Calendar conflict detection** | Wire `findConflicts()` into create/update controllers + show warnings in UI |
| **Custom fields** (estates + contacts) | API exposure + dynamic form UI |
| **Quick search** | Add owner name + street/zip to search query |

---

## Done

| Feature | Notes |
|---|---|
| **Estate: virtual tour URL** | Full backend + UI |
| **Estate: agent assignment** | Auto-assign + patchable + filter |
| **Estate: quick search** (title/external_id/city) | Works; owner name not yet included |
| **Contact: file attachments** | Via document system |

---

## Detailed Notes

### Contact Matching Engine — NOT DONE
No matching controller, service, or route exists. The `Contact` model has a `search_profiles` JSON column with getter/setter methods, but it is not exposed via any API endpoint or frontend UI. The matching engine itself is completely absent.

### Contact Search Profiles — PARTIAL
The `Contact` model has `public ?string $search_profiles = null` (JSON column) with `getSearchProfiles()`/`setSearchProfiles()` methods. The `types.ts` API type includes `search_profiles`. However, neither `ContactCreateController` nor `ContactUpdateController` accept it as input. No frontend UI exists.

### Contact Relationships — PARTIAL
`ContactRelationship` model exists with `contact_id`, `related_contact_id`, `type`, `notes`. `ContactShowController` eager-loads relationships. No routes exist to create, update, or delete relationships. `ContactDetailPage.tsx` does not render a relationships tab.

### Contact Merge Duplicates — NOT DONE
No merge controller, service, or route exists.

### Estate Geo Data / Map Pin — PARTIAL
The `Estate` model has `latitude` and `longitude` float columns, accepted in create/update controllers. `EstateDetailPage.tsx` renders a plain text placeholder only. No Leaflet or OSM map is integrated.

### Estate Custom Fields — PARTIAL
The `Estate` model has `custom_fields` JSON column with getter/setter. Not in `PATCHABLE_FIELDS` of `EstateUpdateController`. No UI for user-defined custom fields.

### Estate Bulk Actions — NOT DONE
No bulk action endpoints or UI. No row checkboxes in the table.

### PDF Brochure Generation — NOT DONE
No PDF generation endpoint, controller, service, or library exists. `DocumentService` only handles file storage paths.

### Email Templates — NOT DONE
`EmailTemplate` model exists with `name`, `subject`, `body_html`, `body_text`, `category` fields but there is no controller, no route, and no frontend page. `EmailSendController` takes a direct `body_html` string with no template substitution logic.

### Record Ownership Scope — NOT DONE
No scope filter field exists on User. All list controllers scope by `office_id` only — no "own records only" vs "all office records" filter.

### Audit Log — PARTIAL
`AuditLog` model is fully defined. `AuditLogService` is wired up and called in every create/update/delete controller. However, `AuditLogService.log()` only calls `$this->logger->info()` — it does NOT persist to the `AuditLog` database model. No read endpoint or frontend UI exists.

### Calendar Conflict Detection — PARTIAL
`AppointmentService::findConflicts()` is fully implemented with correct overlapping interval SQL. However, `AppointmentCreateController` and `AppointmentUpdateController` never call it. Conflicts are not checked on create/update, not returned in API responses, and not shown in the frontend.

---

## Suggested Priority Order

1. **Contact search profiles + matching engine** — core CRM differentiator
2. **Audit log persistence + read endpoint** — infrastructure is 90% there
3. **Calendar conflict detection** — service exists, just needs wiring
4. **Email templates** — high agent productivity value
5. **Contact relationships** — model exists, needs routes + UI
6. **Leaflet map** — visual impact, data already stored
7. **Estate bulk actions** — productivity feature
8. **PDF brochure** — needs engine decision first
9. **Custom fields UI** — complex, can defer
10. **Record ownership scope** — architectural, affects all queries
11. **Merge duplicates** — nice-to-have, can ship without
