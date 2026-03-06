# Maklr — Next 5 Big Projects

Post-MVP roadmap. Ordered by business impact and dependency chain.

---

## 1. Portal Syndication (OpenImmo XML)

**Priority:** P2 — High demand from German real estate market

Export property listings to real estate portals (ImmobilienScout24, Immowelt, etc.) via the OpenImmo XML standard.

### Scope

- **OpenImmo XML export** — Generate valid OpenImmo XML from estate data + images
- **Per-portal publish toggle** — Each estate gets a portal-specific publish flag (e.g. publish to ImmobilienScout24 but not Immowelt)
- **FTP/API push** — Configurable per-portal delivery (FTP credentials, API keys)
- **Sync status + error log** — Track last sync time, success/failure, error details per estate per portal
- **Portal enquiry import** — Parse incoming email enquiries from portals, auto-create contacts + activities

### Key Decisions

- OpenImmo schema version (latest is 1.2.7)
- Image delivery: inline base64 vs separate FTP upload
- Sync frequency: manual trigger, cron, or on-status-change
- Queue system for background processing (Redis-based job queue)

### Dependencies

- Estate model already has all required fields (type, marketing_type, price, geo data, images)
- Need a `Portal` model (name, type, credentials, FTP config)
- Need an `EstateSyndication` pivot model (estate_id, portal_id, status, last_synced, error_log)

---

## 2. Workflow Automation (Process Manager)

**Priority:** P2 — Described as "the killer feature" in the spec

Automate repetitive agent workflows: lead nurturing sequences, after-sales checklists, status-change triggers.

### Scope

- **Workflow model** — Name, description, trigger type, active/inactive, steps as JSON
- **Step-based workflow builder** — React UI for creating sequences of actions
- **Triggers:** manual, on record create, on status change, on field change, cron schedule
- **Actions:** send email (from template), create task, change field/status, assign user, wait (delay), condition branch
- **If/else branching** — Branch on field values, contact stage, estate status
- **Pre-built templates** — Acquisition, lead nurturing, after-sales, data maintenance
- **Execution log** — Per-run log with step-by-step status, timestamps, errors

### Key Decisions

- Execution engine: synchronous in-request vs background job queue
- Step storage format: flat array with pointers vs tree structure
- Wait/delay implementation: cron polling vs scheduled jobs
- Max workflow complexity (step limit, nesting depth)

### Dependencies

- Email templates (already implemented)
- Task creation (already implemented)
- Need a background job/queue system (shared with Portal Syndication)

---

## 3. Statistics & Dashboards

**Priority:** P2 — Critical for management visibility

Configurable dashboard with widgets and reporting. The current `DashboardStatsController` returns basic counts — this project adds visual dashboards, date-range filtering, and exportable reports.

### Scope

- **Configurable dashboard** — User-customizable widget layout (drag-and-drop grid)
- **Property stats:** inventory by status, avg days on market, revenue pipeline
- **Contact stats:** new leads over time, conversion funnel visualization, pipeline value
- **Agent stats:** activity count, deals closed, commission earned, response times
- **Date range + office filters** — Compare periods, filter by office/agent
- **CSV/PDF export** — Download any report as CSV or PDF
- **Widget types:** KPI card, bar chart, line chart, pie chart, funnel, table

### Key Decisions

- Charting library (Recharts vs Chart.js vs Nivo)
- Dashboard layout persistence (per-user JSON config)
- Pre-aggregation vs live queries for performance
- Report scheduling (email weekly summary)

### Dependencies

- Current dashboard endpoint provides raw data — extend with time-series queries
- Need date-range grouping helpers (daily, weekly, monthly aggregation)

---

## 4. Invoicing & Commission Tracking

**Priority:** P2 — Revenue tracking for agencies

Track deals, calculate commissions, generate invoices.

### Scope

- **Invoice CRUD** — With line items, tax rates, discounts
- **Link to estate deal + contact** — Invoice tied to a closed deal
- **Commission calculation** — Percentage-based, fixed, or tiered per agent/deal
- **Status lifecycle:** draft → sent → paid → overdue → cancelled
- **PDF generation** — Professional invoice PDF with agency branding
- **Basic time tracking** — Per user, linkable to invoices
- **Payment reminders** — Auto-flag overdue invoices, optional email reminders

### Key Decisions

- Tax handling (VAT rates, reverse charge for cross-border)
- Invoice numbering scheme (sequential, per-year, per-office)
- Currency support (EUR only for MVP, multi-currency later?)
- DATEV export format (P3, but design schema with it in mind)

### Dependencies

- Estate status "sold/rented" triggers commission eligibility
- Contact model (buyer/seller linked to invoice)
- PDF generation engine (already in place via DOMPDF for brochures)

---

## 5. Public API & Website Integration

**Priority:** P2 — Enables agent websites to display listings

Public-facing API for embedding property listings on external websites, plus lead capture.

### Scope

- **Public read-only endpoints** — Published estates with filtering (type, price range, location, rooms)
- **Lead capture endpoint** — Public form submission creates contact + activity + optional task
- **Prospect finder** — Property owner submits criteria, returns count of matching buyers (no PII exposed)
- **Webhooks** — Notify external systems on property create/update/status change
- **API key scoping** — Public API keys with read-only access, separate from internal API tokens
- **Rate limiting** — Stricter limits for public endpoints
- **CORS configuration** — Allow embedding from configured domains

### Key Decisions

- Authentication: API key in header vs query param
- Response format: full estate object vs slimmed-down public view (hide internal fields)
- Image serving: direct URLs vs signed URLs with expiry
- Webhook delivery: synchronous vs async with retry queue

### Dependencies

- Estate model + image serving (already implemented)
- Contact creation (already implemented)
- Matching engine (already implemented)
- Need a `Webhook` model (url, events, secret, active)
- Need a `PublicApiKey` model (key, office_id, allowed_origins, rate_limit)

---

## Honorable Mentions (Not in Top 5)

These are important but smaller in scope or lower priority:

| Project | Priority | Notes |
|---------|----------|-------|
| **Contact merge/dedup** | MVP gap | Detect and merge duplicate contacts |
| **Record ownership scope** | MVP gap | Own / team / all visibility per record |
| **Estate quick search expansion** | MVP gap | Add street, zip, owner name search |
| **iCal export/import** | P2 | Calendar sync with external tools |
| **Import/export (CSV, vCard)** | P2 | Bulk data import for contacts |
| **i18n (German)** | P2 | First non-English language |
| **Mobile app** | P3 | React Native or PWA |
