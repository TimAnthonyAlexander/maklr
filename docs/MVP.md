# OpenEstate - Feature Spec

Open-source real estate CRM. BaseAPI + React

**Stack**: BaseAPI (PHP 8.4), React, MySQL, Redis

---

## Priority Labels

- **[MVP]** ships in v0.1
- **[P2]** ships after MVP is stable
- **[P3]** nice-to-have, community contributions welcome

---

## 1. Estates [MVP]

The core entity. Everything revolves around properties.

- [x] Full CRUD
- [x] Property types: apartment, house, commercial, land, garage
- [x] Marketing types: sale, rent, lease
- [x] Status lifecycle: draft > active > reserved > sold/rented > archived
- [x] Image/floor plan/video uploads with reordering
- [ ] Virtual tour URL field
- [ ] Geo data with map pin (Leaflet/OSM)
- [x] Owner link (contact reference)
- [ ] Agent assignment
- [ ] Custom fields (user-defined, per property type)
- [x] Filters and saved views ("working lists")
- [ ] Quick search (address, owner name, external ID)
- [ ] Bulk actions (status change, assign, delete)
- [x] Activity log tab (auto-populated from all modules)

**[P2] Multi-Property**
- [ ] Master property with child units (for complexes, new builds)
- [ ] Unit list overview with individual status per unit
- [ ] Inherit shared data from master, override per unit

**[P2] Portal Syndication**
- [ ] OpenImmo XML export
- [ ] Per-portal publish toggle per property
- [ ] FTP/API push with sync status and error log
- [ ] Portal enquiry import (email parsing)

**[P3]**
- [ ] Estate tracking portal (read-only owner view with marketing stats)
- [ ] Selling price offer management
- [ ] Duplicate detection

---

## 2. Contacts [MVP]

Second core entity. Buyers, sellers, tenants, landlords, service providers.

- [x] Full CRUD (persons + companies)
- [x] Contact types: buyer, seller, tenant, landlord, notary, agent, misc
- [ ] Custom fields per type
- [ ] Relationship links between contacts (e.g. spouse, employer, referral)
- [ ] Search profiles: what is this contact looking for? (type, price range, area, rooms, location radius)
- [ ] Matching engine: run a contact's search profile against active estates, or run an estate against all search profiles
- [x] Pipeline / qualification stages (cold > warm > hot > deal > lost)
- [x] GDPR: consent flag, consent date, data deletion request handling
- [ ] File attachments
- [x] Filters and saved views
- [x] Activity log tab
- [ ] Merge duplicates

**[P2]**
- [ ] Address completion: send a link, contact fills in their own data via public form
- [ ] Newsletter opt-in/opt-out sync
- [ ] Bulk email to filtered contact lists
- [ ] Import/export (CSV, vCard)
- [ ] WhatsApp click-to-chat
- [ ] Birthday/anniversary reminders

---

## 3. Activity Log [MVP]

Unified timeline. The agent's logbook. Every interaction documented.

- [x] Per-estate and per-contact timeline views
- [x] Auto-logged: emails, status changes, file uploads, appointments, task completions
- [x] Manual entries: phone call, meeting, note, viewing
- [x] Each activity links to: user, estate (optional), contact (optional)
- [x] Type filter and date range filter

**[P2]**
- [ ] Call duration field
- [ ] GoBD-compliant export
- [ ] Activity templates (pre-filled subjects/descriptions)

---

## 4. Calendar [MVP]

- [x] Appointment CRUD
- [x] Link to estate, contacts, users
- [x] Day/week/month view in React
- [ ] Conflict detection per user
- [x] Types: viewing, meeting, handover, internal, other

**[P2]**
- [ ] Email confirmation to attendees
- [ ] iCal export/import
- [ ] Recurring appointments
- [ ] Resource management (rooms, vehicles)
- [ ] Viewing check-in with timestamp logging
- [ ] File attachments

---

## 5. Tasks [MVP]

- [x] CRUD with title, description, due date, priority
- [x] Assign to user(s)
- [x] Link to estate/contact
- [x] Status: open > in_progress > done / cancelled
- [x] List view + kanban board toggle

**[P2]**
- [ ] Task templates
- [ ] Recurring tasks
- [ ] Subtasks
- [ ] Notifications on assignment and overdue

---

## 6. Email [MVP]

- [x] Connect external mailbox via IMAP/SMTP
- [x] Send and receive within the app
- [x] Auto-match incoming/outgoing emails to contacts (by email address)
- [x] Auto-archive matched emails to activity log
- [ ] Email templates with placeholder variables (estate fields, contact fields)
- [x] File attachments

**[P2]**
- [ ] Microsoft Graph API + Gmail API as alternative connectors
- [ ] Shared team mailboxes
- [ ] Bulk send to contact lists (with unsubscribe handling)
- [ ] Signature management per user
- [ ] Open/click tracking (where legally permitted)

---

## 7. Documents [MVP]

- [x] File storage per entity (estate, contact, appointment)
- [x] Upload, download, delete with permission checks
- [ ] Basic PDF brochure generation from estate data + images using a template

**[P2]**
- [ ] Brochure template designer (WYSIWYG or config-based)
- [ ] Web brochure: public link requiring consent/brokerage agreement before download
- [ ] Auto-send matching brochures to contacts with fitting search profiles
- [ ] Contract/form template library
- [ ] Digital signature capture

**[P3]**
- [ ] GoBD-compliant archiving
- [ ] OCR for scanned uploads

---

## 8. Users & Permissions [MVP]

- [x] User CRUD
- [x] Roles: admin, manager, agent, readonly, api_user
- [x] Per-module RBAC (read, write, delete)
- [ ] Record ownership scope: own / team / all
- [x] Multi-office support (user belongs to office)
  - **Rule:** All tenant-owned data (estates, contacts, tasks, calendar, etc.) MUST be scoped by `office_id` in every query. Never use `Model::find($id)` alone — always add `->where('office_id', '=', $officeId)`. On create, set `office_id` from the authenticated user. Never allow `office_id` to be patched.
- [x] API key auth for external consumers
- [ ] Audit log (who changed what, when)

---

## 9. Workflow Automation (Process Manager) [P2]

The killer feature of maklr. Automates repetitive sequences.

- [ ] Step-based workflow builder in React
- [ ] Triggers: manual, on record create, on status change, on field change, cron
- [ ] Actions: send email, create task, change field/status, assign user, wait, condition branch
- [ ] If/else branching on field values
- [ ] Pre-built templates: acquisition, lead nurturing, after-sales, data maintenance
- [ ] Execution log per run

**[P3]**
- [ ] Webhook triggers
- [ ] Custom action plugins
- [ ] SLA timers with escalation

---

## 10. Invoicing [P2]

- [ ] Invoice CRUD with line items
- [ ] Link to estate deal + contact
- [ ] Commission calculation (percentage, fixed, tiered)
- [ ] Status: draft > sent > paid > overdue > cancelled
- [ ] PDF generation
- [ ] Basic time tracking per user

**[P3]**
- [ ] Recurring invoices
- [ ] DATEV export
- [ ] Payment integration

---

## 11. Statistics & Dashboards [P2]

- [ ] Configurable dashboard with widgets
- [ ] Property stats: inventory by status, avg days on market, revenue
- [ ] Contact stats: new leads, conversion funnel, pipeline value
- [ ] Agent stats: activity count, deals closed, commission earned
- [ ] Date range + office filters
- [ ] CSV/PDF export

**[P3]**
- [ ] Custom report builder
- [ ] Monthly target tracking

---

## 12. Website / Public API [P2]

For embedding property listings on agent websites.

- [ ] Public read-only endpoints for published estates
- [ ] Lead capture endpoint (creates contact + activity)
- [ ] Prospect finder: owner submits property params, returns matching buyer count
- [ ] Webhooks on property create/update/status change

**[P3]**
- [ ] Embeddable React search widget
- [ ] WordPress plugin

---

## 13. Phone / CTI [P3]

- [ ] Click-to-call (tel: URI baseline)
- [ ] SIP/WebRTC browser calling
- [ ] Caller ID lookup on incoming
- [ ] Call log with duration to activity log

---

## 14. Internal Messaging [P3]

- [ ] User-to-user messages
- [ ] Company-wide announcements
- [ ] In-app notification center

---

## 15. Mobile App [P3]

- [ ] Property browsing + gallery
- [ ] Contact lookup + quick actions
- [ ] Appointments with map navigation
- [ ] Tasks
- [ ] Checklist forms (offline-capable)
- [ ] Photo capture + upload
- [ ] Digital signature

---

## MVP Scope (v0.1)

Ship this. Nothing else.

- [x] Estates
- [ ] Contacts + matching
- [x] Activity Log
- [x] Calendar
- [x] Tasks
- [x] Email (IMAP/SMTP)
- [ ] Documents + basic PDF brochure
- [x] Users & Auth (RBAC, audit log)
- [x] React frontend for all of the above

### Explicitly NOT in MVP

- No portal syndication
- No workflow automation
- No invoicing
- No dashboards
- No mobile app
- No CTI
- No public API
- No i18n (English only, German in P2)

---

## Open Decisions

- [ ] License: AGPL-3.0 vs MIT?
- [x] UI kit? → MUI v7
- [ ] Search: MySQL fulltext for MVP, Meilisearch later?
- [ ] PDF engine?
- [ ] File storage: local only for MVP, S3 adapter later?
- [x] Project name? → Maklr
