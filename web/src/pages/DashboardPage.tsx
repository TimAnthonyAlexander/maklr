import { Box, Typography } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/LanguageContext";
import { useGetDashboardStats } from "../api/hooks";
import { DashboardGreeting } from "../components/dashboard/DashboardGreeting";
import { QuickActions } from "../components/dashboard/QuickActions";
import { DashboardPulse } from "../components/dashboard/DashboardPulse";
import { EstateDistributionChart } from "../components/dashboard/EstateDistributionChart";
import { RecentEstatesList } from "../components/dashboard/RecentEstatesList";
import { RecentContactsList } from "../components/dashboard/RecentContactsList";
import { UpcomingTasksList } from "../components/dashboard/UpcomingTasksList";
import { RecentEmailsList } from "../components/dashboard/RecentEmailsList";
import { TopMatchesList } from "../components/dashboard/TopMatchesList";

export function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: stats, loading } = useGetDashboardStats();

  if (!user) return null;

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <DashboardGreeting userName={user.name} />
        <QuickActions />
      </Box>

      <DashboardPulse stats={stats} loading={loading} />

      {/* Distribution charts */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t("dashboard.overview")}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          <EstateDistributionChart
            title={t("dashboard.charts.estates_by_status")}
            data={stats?.estates_by_status}
            loading={loading}
            accentColor="#9E8B76"
          />
          <EstateDistributionChart
            title={t("dashboard.charts.contacts_by_stage")}
            data={stats?.contacts?.by_stage}
            loading={loading}
            accentColor="#6B8F60"
          />
          <EstateDistributionChart
            title={t("dashboard.charts.tasks_by_priority")}
            data={stats?.tasks?.by_priority}
            loading={loading}
            accentColor="#B89B4A"
          />
        </Box>
      </Box>

      {/* Recent lists */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 2,
        }}
      >
        <RecentEstatesList estates={stats?.recent_estates} loading={loading} />
        <RecentContactsList
          contacts={stats?.contacts?.recent}
          loading={loading}
        />
        <UpcomingTasksList tasks={stats?.tasks?.upcoming} loading={loading} />
        <RecentEmailsList
          emails={stats?.emails?.recent}
          loading={loading}
        />
        <TopMatchesList
          matches={stats?.matching?.top_matches}
          loading={loading}
        />
      </Box>
    </Box>
  );
}
