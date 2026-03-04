<p align="center">
  <h1 align="center">Maklr</h1>
  <p align="center">
    Open-source real estate CRM for modern brokerages.
    <br />
    Built with PHP 8.4 &amp; React 19.
  </p>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="docs/MVP.md">Roadmap</a> &middot;
  <a href="#contributing">Contributing</a>
</p>

---

## Why Maklr?

Commercial real estate CRMs are expensive, closed-source, and lock you in. Maklr gives brokerages a self-hosted alternative with the features that actually matter — property management, contact matching, activity tracking, and workflow automation — without the vendor lock-in.

---

## Quick Start

**Prerequisites:** PHP 8.4+, MySQL, Redis, Bun, Composer

```bash
git clone https://github.com/timanthonyalexander/maklr.git && cd maklr

# Install & configure
composer install
cp .env.example .env        # then edit with your DB & mail credentials

# Database
./mason migrate:generate && ./mason migrate:apply -y

# Start backend (http://localhost:7272)
./mason serve

# Start frontend (http://localhost:7273)
cd web && bun install && bun run dev
```

---

## Features

> `[x]` Shipped — `[-]` In progress — `[ ]` Planned

### Core Modules

**Estates** `[-]`
Full property CRUD — apartments, houses, commercial, land, garage. Sale, rent, and lease marketing types. Status lifecycle (draft, active, reserved, sold/rented, archived), image and floor plan uploads, geo data with map pins, owner linking, agent assignment, custom fields, saved filters, bulk actions.

**Contacts** `[-]`
Buyers, sellers, tenants, landlords, service providers. Search profiles with a matching engine — run a contact's criteria against active estates, or run an estate against all search profiles. Pipeline stages, GDPR consent handling, duplicate merging.

**Activity Log** `[-]`
Unified timeline per estate and contact. Auto-logged emails, status changes, uploads, appointments, and task completions. Manual entries for calls, meetings, notes, and viewings.

**Calendar** `[-]`
Appointments linked to estates, contacts, and users. Day, week, and month views. Conflict detection. Types: viewing, meeting, handover, internal.

**Tasks** `[-]`
Task management with title, description, due date, priority, and assignees. Linked to estates and contacts. List view and kanban board toggle.

**Email** `[-]`
Connect external mailboxes via IMAP/SMTP. Send and receive in-app. Auto-match emails to contacts, archive to activity log. Template system with placeholder variables.

**Documents** `[-]`
File storage per entity. Upload, download, and delete with permission checks. PDF brochure generation from estate data and images.

**Users & Auth** `[x]`
Roles (admin, manager, agent, readonly, api_user). Per-module RBAC, record ownership scopes, multi-office support, API token auth, audit log.

### Roadmap

**Multi-Property** `[ ]`
Master properties with child units for complexes and new builds.

**Portal Syndication** `[ ]`
OpenImmo XML export, per-portal publish toggles, FTP/API push with sync status.

**Workflow Automation** `[ ]`
Step-based workflow builder with triggers, conditions, and actions. Automate acquisition, lead nurturing, and after-sales sequences.

**Invoicing** `[ ]`
Invoice CRUD, commission calculation, PDF generation, time tracking.

**Dashboards & Stats** `[ ]`
Configurable widgets — inventory, pipeline, conversion funnel, agent performance.

**Public API** `[ ]`
Read-only endpoints for published estates, lead capture, prospect finder, webhooks.

**Phone / CTI** `[ ]`
Click-to-call, SIP/WebRTC browser calling, caller ID lookup.

**Internal Messaging** `[ ]`
User-to-user messages, company announcements, notification center.

**Mobile App** `[ ]`
Property browsing, contact lookup, appointments with navigation, offline checklists, photo capture.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | PHP 8.4, [BaseAPI](https://github.com/timanthonyalexander/base-api), MySQL, Redis |
| **Frontend** | React 19, TypeScript, MUI v7, Vite 7 |
| **Package Managers** | Bun (frontend), Composer (backend) |
| **Testing** | PHPUnit, SQLite in-memory isolation |

---

## Development

### Backend

```bash
./mason serve                    # Dev server
./mason serve --screen           # In screen session

./mason migrate:generate         # Generate migrations from model changes
./mason migrate:apply -y         # Apply migrations

composer phpunit                 # Run tests
composer phpstan                 # Static analysis
composer rector                  # Code quality (dry run)
composer rector:fix              # Apply fixes
```

### Frontend

```bash
cd web
bun run dev                      # Dev server
bun run build                    # Production build
bun run lint                     # Lint check
bun run fix                      # Lint + format fix
```

### Testing

```bash
composer phpunit                        # All tests
composer phpunit -- tests/Unit          # Unit only
composer phpunit -- tests/Feature       # Integration only
```

### Git Hooks

Pre-commit hooks run automatically — PHP syntax, PHPStan, PHPUnit, debug function detection, large file warnings. Reinstall with `composer setup-hooks`.

---

## Contributing

Contributions are welcome, especially for planned modules. Please open an issue to discuss larger changes before submitting a PR.

---

## License

TBD
