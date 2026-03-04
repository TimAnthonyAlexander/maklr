# Dashboard Sidebar Design

## Overview

Collapsible vertical sidebar for authenticated pages. Replaces the top Navbar on all dashboard routes. Public pages (landing, login, signup) keep the existing Navbar.

## Layout

**Public pages** (`/`, `/login`, `/signup`): Navbar only, no sidebar.

**Authenticated pages** (`/dashboard`, `/estates`, `/contacts`, etc.): DashboardLayout with sidebar + content area. No Navbar.

### Sidebar Dimensions

- Expanded: 240px width
- Collapsed: 64px width (icons only)
- Collapse state persisted in `localStorage`
- Smooth CSS transition on width change

### Sidebar Contents (top to bottom)

1. **Header** — "Maklr" text (collapses to logo/icon)
2. **Collapse toggle** — chevron button
3. **Navigation items:**
   - Dashboard (home overview)
   - Estates
   - Contacts
   - Activity Log
   - Calendar
   - Tasks
   - Email
   - Documents
4. **Bottom section (pinned):**
   - Users & Permissions (admin/manager only, role-gated)
   - User info: avatar + name + role chip
   - Logout button

### Behavior

- Active route highlighted via MuiListItemButton selected state
- Tooltips on icons when collapsed
- Follows existing theme: flat, no shadows, DM Sans, #1A1A1A primary

## Files

| Action | File | Purpose |
|--------|------|---------|
| Create | `web/src/components/Sidebar.tsx` | Sidebar component |
| Create | `web/src/components/DashboardLayout.tsx` | Layout wrapper (sidebar + Outlet) |
| Create | `web/src/pages/EstatesPage.tsx` | Stub page |
| Create | `web/src/pages/ContactsPage.tsx` | Stub page |
| Create | `web/src/pages/ActivityLogPage.tsx` | Stub page |
| Create | `web/src/pages/CalendarPage.tsx` | Stub page |
| Create | `web/src/pages/TasksPage.tsx` | Stub page |
| Create | `web/src/pages/EmailPage.tsx` | Stub page |
| Create | `web/src/pages/DocumentsPage.tsx` | Stub page |
| Create | `web/src/pages/UsersPage.tsx` | Stub page |
| Modify | `web/src/App.tsx` | Nest auth routes under DashboardLayout |

## Routing Structure

```
/                   → Landing (with Navbar)
/login              → LoginPage (with Navbar)
/signup             → SignupPage (with Navbar)

/dashboard          → DashboardLayout > DashboardPage
/estates            → DashboardLayout > EstatesPage
/contacts           → DashboardLayout > ContactsPage
/activity           → DashboardLayout > ActivityLogPage
/calendar           → DashboardLayout > CalendarPage
/tasks              → DashboardLayout > TasksPage
/email              → DashboardLayout > EmailPage
/documents          → DashboardLayout > DocumentsPage
/users              → DashboardLayout > UsersPage
```
