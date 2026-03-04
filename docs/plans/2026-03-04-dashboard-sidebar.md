# Dashboard Sidebar Implementation Plan

**Goal:** Add a collapsible vertical sidebar to all authenticated pages, replacing the top Navbar. Public pages keep the Navbar.

**Architecture:** A `DashboardLayout` component wraps all authenticated routes, rendering a `Sidebar` on the left and an `<Outlet />` for page content on the right. The Navbar is only rendered on public routes (`/`, `/login`, `/signup`). Sidebar collapse state is persisted in `localStorage`.

**Tech Stack:** React 19, MUI v7 (`sx` prop styling), React Router 7, TypeScript

---

### Task 1: Create Stub Pages

Create 8 stub page components — one per MVP module. Each is a simple placeholder with a title.

**Files:**
- Create: `web/src/pages/EstatesPage.tsx`
- Create: `web/src/pages/ContactsPage.tsx`
- Create: `web/src/pages/ActivityLogPage.tsx`
- Create: `web/src/pages/CalendarPage.tsx`
- Create: `web/src/pages/TasksPage.tsx`
- Create: `web/src/pages/EmailPage.tsx`
- Create: `web/src/pages/DocumentsPage.tsx`
- Create: `web/src/pages/UsersPage.tsx`

**Step 1: Create all 8 stub pages**

Each follows this pattern (example for EstatesPage):

```tsx
import { Box, Typography } from '@mui/material'

export function EstatesPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Estates</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        Coming soon.
      </Typography>
    </Box>
  )
}
```

Repeat for all 8 pages with appropriate titles:
- `EstatesPage` → "Estates"
- `ContactsPage` → "Contacts"
- `ActivityLogPage` → "Activity Log"
- `CalendarPage` → "Calendar"
- `TasksPage` → "Tasks"
- `EmailPage` → "Email"
- `DocumentsPage` → "Documents"
- `UsersPage` → "Users"

**Step 2: Verify no lint errors**

Run: `cd /Users/tim.alexander/maklr/web && bun run lint`
Expected: No errors from new files.

**Step 3: Commit**

```bash
git add web/src/pages/EstatesPage.tsx web/src/pages/ContactsPage.tsx web/src/pages/ActivityLogPage.tsx web/src/pages/CalendarPage.tsx web/src/pages/TasksPage.tsx web/src/pages/EmailPage.tsx web/src/pages/DocumentsPage.tsx web/src/pages/UsersPage.tsx
git commit -m "feat: add stub pages for all MVP modules"
```

---

### Task 2: Create Sidebar Component

The main sidebar navigation component with collapsible behavior.

**Files:**
- Create: `web/src/components/Sidebar.tsx`

**Reference files:**
- Theme: `web/src/theme.ts` — uses `MuiListItemButton` (borderRadius 8, selected state `rgba(0,0,0,0.04)`), `MuiListItemIcon` (minWidth 36, color `#8A8A8A`)
- Auth: `web/src/contexts/AuthContext.tsx` — `useAuth()` returns `{ user, logout }`, user has `role`, `name`, `email`, `avatar_url`
- Design: flat (elevation 0), no shadows, DM Sans font, primary `#1A1A1A`, divider `rgba(0,0,0,0.06)`

**Step 1: Create Sidebar.tsx**

```tsx
import { useNavigate, useLocation } from 'react-router'
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Tooltip,
  Divider,
} from '@mui/material'
import {
  HomeOutlined,
  ApartmentOutlined,
  PeopleOutlined,
  TimelineOutlined,
  CalendarMonthOutlined,
  ChecklistOutlined,
  EmailOutlined,
  DescriptionOutlined,
  AdminPanelSettingsOutlined,
  ChevronLeft,
  ChevronRight,
  LogoutOutlined,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

const EXPANDED_WIDTH = 240
const COLLAPSED_WIDTH = 64
const STORAGE_KEY = 'maklr_sidebar_collapsed'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  roles?: string[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <HomeOutlined /> },
  { label: 'Estates', path: '/estates', icon: <ApartmentOutlined /> },
  { label: 'Contacts', path: '/contacts', icon: <PeopleOutlined /> },
  { label: 'Activity Log', path: '/activity', icon: <TimelineOutlined /> },
  { label: 'Calendar', path: '/calendar', icon: <CalendarMonthOutlined /> },
  { label: 'Tasks', path: '/tasks', icon: <ChecklistOutlined /> },
  { label: 'Email', path: '/email', icon: <EmailOutlined /> },
  { label: 'Documents', path: '/documents', icon: <DescriptionOutlined /> },
]

const adminItems: NavItem[] = [
  { label: 'Users', path: '/users', icon: <AdminPanelSettingsOutlined />, roles: ['admin', 'manager'] },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  const visibleAdminItems = adminItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  )

  const renderNavItem = (item: NavItem) => (
    <Tooltip title={collapsed ? item.label : ''} placement="right" key={item.path}>
      <ListItemButton
        selected={isActive(item.path)}
        onClick={() => navigate(item.path)}
        sx={{
          minHeight: 44,
          px: 1.5,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <ListItemIcon
          sx={{
            justifyContent: 'center',
            color: isActive(item.path) ? 'text.primary' : 'text.secondary',
          }}
        >
          {item.icon}
        </ListItemIcon>
        {!collapsed && <ListItemText primary={item.label} />}
      </ListItemButton>
    </Tooltip>
  )

  return (
    <Box
      component="nav"
      sx={{
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        minWidth: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 0 : 2,
        }}
      >
        {!collapsed && (
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '1.1rem',
              letterSpacing: '-0.03em',
              color: 'text.primary',
              whiteSpace: 'nowrap',
            }}
          >
            Maklr
          </Typography>
        )}
        <IconButton onClick={onToggle} size="small">
          {collapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
        </IconButton>
      </Box>

      <Divider />

      {/* Main nav */}
      <List sx={{ flex: 1, px: 1, py: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {navItems.map(renderNavItem)}
      </List>

      {/* Bottom section */}
      <Box sx={{ px: 1, pb: 1 }}>
        {visibleAdminItems.length > 0 && (
          <>
            <Divider sx={{ mb: 1 }} />
            <List sx={{ py: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              {visibleAdminItems.map(renderNavItem)}
            </List>
          </>
        )}

        <Divider sx={{ my: 1 }} />

        {/* User info */}
        {user && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.5,
              py: 1,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'text.primary',
                fontSize: '0.85rem',
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            {!collapsed && (
              <Box sx={{ overflow: 'hidden', flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.name}
                </Typography>
                <Chip label={user.role} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
              </Box>
            )}
          </Box>
        )}

        {/* Logout */}
        <Tooltip title={collapsed ? 'Log out' : ''} placement="right">
          <ListItemButton
            onClick={handleLogout}
            sx={{
              minHeight: 44,
              px: 1.5,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <ListItemIcon sx={{ justifyContent: 'center' }}>
              <LogoutOutlined />
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Log out" />}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  )
}
```

**Step 2: Verify no lint errors**

Run: `cd /Users/tim.alexander/maklr/web && bun run lint`
Expected: No errors.

**Step 3: Commit**

```bash
git add web/src/components/Sidebar.tsx
git commit -m "feat: add collapsible sidebar component"
```

---

### Task 3: Create DashboardLayout Component

Layout wrapper that renders Sidebar + content area with `<Outlet />`.

**Files:**
- Create: `web/src/components/DashboardLayout.tsx`

**Step 1: Create DashboardLayout.tsx**

```tsx
import { useState } from 'react'
import { Outlet } from 'react-router'
import { Box } from '@mui/material'
import { Sidebar } from './Sidebar'

const STORAGE_KEY = 'maklr_sidebar_collapsed'

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // localStorage unavailable
      }
      return next
    })
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          bgcolor: 'background.default',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
```

**Step 2: Verify no lint errors**

Run: `cd /Users/tim.alexander/maklr/web && bun run lint`
Expected: No errors.

**Step 3: Commit**

```bash
git add web/src/components/DashboardLayout.tsx
git commit -m "feat: add dashboard layout with sidebar and content area"
```

---

### Task 4: Update App Router and Navbar

Restructure routing so authenticated pages use `DashboardLayout` (no Navbar), while public pages keep the Navbar.

**Files:**
- Modify: `web/src/App.tsx`
- Modify: `web/src/components/Navbar.tsx` (minor — no functional changes needed since it won't render on sidebar pages)

**Step 1: Rewrite App.tsx**

Replace the entire contents of `web/src/App.tsx`:

```tsx
import { Routes, Route } from 'react-router'
import { Box } from '@mui/material'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardLayout } from './components/DashboardLayout'
import { Landing } from './pages/Landing'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { DashboardPage } from './pages/DashboardPage'
import { EstatesPage } from './pages/EstatesPage'
import { ContactsPage } from './pages/ContactsPage'
import { ActivityLogPage } from './pages/ActivityLogPage'
import { CalendarPage } from './pages/CalendarPage'
import { TasksPage } from './pages/TasksPage'
import { EmailPage } from './pages/EmailPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { UsersPage } from './pages/UsersPage'

export default function App() {
  return (
    <Routes>
      {/* Public routes — with Navbar */}
      <Route
        element={
          <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Navbar />
            <ProtectedRoute publicRoute />
          </Box>
        }
      >
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Authenticated routes — with Sidebar, no Navbar */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/estates" element={<EstatesPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/activity" element={<ActivityLogPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/email" element={<EmailPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/users" element={<UsersPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
```

**Step 2: Update ProtectedRoute to support public routes**

Modify `web/src/components/ProtectedRoute.tsx` to accept a `publicRoute` prop so it can wrap public routes as a layout without redirecting:

```tsx
import { Navigate, Outlet } from 'react-router'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  publicRoute?: boolean
}

export function ProtectedRoute({ publicRoute }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (publicRoute) {
    return <Outlet />
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
```

**Step 3: Verify no lint errors**

Run: `cd /Users/tim.alexander/maklr/web && bun run lint`
Expected: No errors.

**Step 4: Manual smoke test**

Run: `cd /Users/tim.alexander/maklr/web && bun run dev`

Verify:
- `/` shows Navbar + Landing page (no sidebar)
- `/login` shows Navbar + login form (no sidebar)
- `/dashboard` shows Sidebar + dashboard content (no Navbar)
- `/estates` shows Sidebar + stub page
- Clicking sidebar items navigates to correct pages
- Collapse toggle works, persists on refresh
- Admin items only visible for admin/manager roles
- Logout navigates to landing

**Step 5: Commit**

```bash
git add web/src/App.tsx web/src/components/ProtectedRoute.tsx
git commit -m "feat: restructure routing with sidebar layout for authenticated pages"
```

---

### Task 5: Update DashboardPage

Update the existing DashboardPage to work nicely within the sidebar layout (remove the max-width container since the layout handles that now).

**Files:**
- Modify: `web/src/pages/DashboardPage.tsx`

**Step 1: Update DashboardPage**

```tsx
import { Box, Typography, Paper, Chip } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

export function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h4">
            Welcome, {user.name}
          </Typography>
          <Chip label={user.role} size="small" />
        </Box>
        <Typography variant="body2">
          {user.email}
        </Typography>
      </Paper>
    </Box>
  )
}
```

**Step 2: Commit**

```bash
git add web/src/pages/DashboardPage.tsx
git commit -m "refactor: update dashboard page for sidebar layout"
```

---

### Task 6: Final Lint + Format + Build Verification

**Step 1: Run lint and format**

Run: `cd /Users/tim.alexander/maklr/web && bun run fix`
Expected: No errors, auto-fixes applied.

**Step 2: Run build**

Run: `cd /Users/tim.alexander/maklr/web && bun run build`
Expected: Build succeeds with no errors.

**Step 3: Commit any formatting fixes**

```bash
git add -A web/src/
git commit -m "chore: apply lint and format fixes"
```
