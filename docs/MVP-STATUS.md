# MVP Implementation Status

Last updated: 2026-03-06

---

## Not Done (needs full build)

| Feature | Scope |
|---|---|
| **Estate bulk actions** | Checkboxes, bulk status change/assign/delete |
| **PDF brochure generation** | Pick a PDF engine, template, controller |
| **Record ownership scope** | own/team/all filter on all tenant queries |
| **Contact merge duplicates** | Duplicate detection + merge logic |

---

## Partial (backend exists, needs wiring/UI)

| Feature | What's missing |
|---|---|
| **Custom fields** (estates + contacts) | Not in `PATCHABLE_FIELDS` for either controller + no dynamic form UI |
| **Quick search** | Estate search missing street/zip/owner name (JOIN required) |

---

## Done

| Feature | Notes |
|---|---|
| **Contact matching engine** | `MatchingService` scores profiles vs estates; match tabs on both detail pages |
| **Contact search profiles** | JSON column + PATCH support + `SearchProfilesTab` on contact detail |
| **Contact relationships** | Create/delete controllers + `ContactRelationshipsTab` on contact detail |
| **Email templates** | Full CRUD + placeholder substitution (`{{contact.*}}`, etc.) + preview + frontend page |
| **Audit log** | Persists to DB via `AuditLogService` + list endpoint with filters + `AuditLogPage` |
| **Calendar conflict detection** | `findConflicts()` wired into create/update controllers; returns soft warnings |
| **Geo data / map pin** | `react-leaflet` map on estate detail with OpenStreetMap tiles |
| **Estate: virtual tour URL** | Full backend + UI |
| **Estate: agent assignment** | Auto-assign + patchable + filter |
| **Estate: quick search** (title/external_id/city) | Works; owner name not yet included |
| **Contact: file attachments** | Via document system |

---

## Detailed Notes

### Contact Matching Engine — DONE
`MatchingService` scores contact search profiles against estates across property_type, marketing_type, price/area/rooms/bedrooms ranges, cities, and boolean features. `ContactMatchController` and `EstateMatchController` expose results. `ContactDetailPage` and `EstateDetailPage` each have a "Matches" tab.

### Contact Search Profiles — DONE
`ContactUpdateController` accepts `search_profiles` via PATCH and persists via `setSearchProfiles()`. `ContactDetailPage` renders `SearchProfilesTab`. Minor gap: `ContactCreateController` does not accept `search_profiles` on creation — must be set post-creation via PATCH.

### Contact Relationships — DONE
`ContactRelationshipCreateController` creates relationships (8 types, idempotent, prevents self-links). `ContactRelationshipDeleteController` handles deletion. `ContactDetailPage` renders `ContactRelationshipsTab` as the default tab.

### Contact Merge Duplicates — NOT DONE
No merge controller, service, or route exists.

### Estate Geo Data / Map Pin — DONE
`EstateDetailPage` renders `EstateLocationMap` (react-leaflet with `MapContainer`, `TileLayer`, `Marker`, `Popup`) when lat/lng are present. Uses OpenStreetMap tiles.

### Estate Custom Fields — PARTIAL
Both `Estate` and `Contact` models have `custom_fields` JSON columns with getter/setter methods. Neither `EstateUpdateController` nor `ContactUpdateController` include `custom_fields` in `PATCHABLE_FIELDS`. No frontend UI to view or edit custom fields.

### Estate Bulk Actions — NOT DONE
No bulk action endpoints or UI. No row checkboxes in the table.

### PDF Brochure Generation — NOT DONE
No PDF generation endpoint, controller, service, or library exists. `DocumentService` only handles file storage paths.

### Email Templates — DONE
Full CRUD controllers in `app/Controllers/EmailTemplate/`. `EmailTemplateService` handles placeholder substitution (`{{contact.*}}`, `{{estate.*}}`, `{{user.*}}`). `EmailTemplatePlaceholdersController` exposes the placeholder catalogue. `EmailTemplatePreviewController` resolves templates with optional contact/estate context. Frontend: `EmailTemplatesPage` with search, scope tabs, create/edit drawer, and delete confirmation.

### Record Ownership Scope — NOT DONE
No scope filter field exists on User. All list controllers scope by `office_id` only — no `?scope=own|team|all` filter parameter. The `assigned_user_id` filter exists as a direct equality filter but there is no convenience shorthand.

### Audit Log — DONE
`AuditLogService` persists to the `AuditLog` model (calls `$auditLog->save()`) and also logs to the application logger. Called from create/update controllers across estates, contacts, appointments, email templates, etc. `AuditLogListController` provides paginated list with entity_type, action, user_id, and date range filters. `AuditLogPage` renders a full table with filter controls.

### Calendar Conflict Detection — DONE
`AppointmentCreateController` and `AppointmentUpdateController` both call `$appointmentService->findConflicts()` after save (skipping all-day appointments). Conflicts are returned as a `conflicts` array in the response — soft warning, non-blocking.

---

## Suggested Priority Order (remaining items)

1. **Estate bulk actions** — productivity feature for managing large portfolios
2. **PDF brochure** — needs engine decision first (dompdf, wkhtmltopdf, etc.)
3. **Custom fields UI** — model layer exists, needs controller + UI wiring
4. **Quick search improvements** — add street/zip/owner name to estate search
5. **Record ownership scope** — architectural, affects all list queries
6. **Merge duplicates** — nice-to-have, can ship without
