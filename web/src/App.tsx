import { Routes, Route } from "react-router";
import { Box } from "@mui/material";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";
import { Landing } from "./pages/Landing";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EstatesPage } from "./pages/EstatesPage";
import { EstateDetailPage } from "./pages/EstateDetailPage";
import { ContactsPage } from "./pages/ContactsPage";
import { ContactDetailPage } from "./pages/ContactDetailPage";
import { ActivityLogPage } from "./pages/ActivityLogPage";
import { CalendarPage } from "./pages/CalendarPage";
import { TasksPage } from "./pages/TasksPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { EmailPage } from "./pages/EmailPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { UsersPage } from "./pages/UsersPage";
import { UserDetailPage } from "./pages/UserDetailPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { AcceptInvitePage } from "./pages/AcceptInvitePage";
import { EmailTemplatesPage } from "./pages/EmailTemplatesPage";
import { AuditLogPage } from "./pages/AuditLogPage";

export default function App() {
  return (
    <Routes>
      {/* Public routes — with Navbar */}
      <Route
        element={
          <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <Navbar />
            <ProtectedRoute publicRoute />
          </Box>
        }
      >
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/invite/:token" element={<AcceptInvitePage />} />
      </Route>

      {/* Onboarding — authenticated, no sidebar */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      {/* Authenticated routes — with Sidebar, no Navbar */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/estates" element={<EstatesPage />} />
          <Route path="/estates/:id" element={<EstateDetailPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/:id" element={<ContactDetailPage />} />
          <Route path="/activity" element={<ActivityLogPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/email" element={<EmailPage />} />
          <Route path="/email-templates" element={<EmailTemplatesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
