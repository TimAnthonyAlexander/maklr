import { Box } from "@mui/material";
import { ListTodo, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import { StatCard } from "./StatCard";
import type { DashboardTaskStats } from "../../api/types";

interface TaskStatsRowProps {
  tasks: DashboardTaskStats | undefined;
  loading: boolean;
}

export function TaskStatsRow({ tasks, loading }: TaskStatsRowProps) {
  const { t } = useTranslation();
  const completedCount = tasks?.by_status?.["done"] ?? 0;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
        gap: 2,
      }}
    >
      <StatCard
        icon={ListTodo}
        value={tasks?.open}
        label={t("dashboard.stats.open_tasks")}
        href="/tasks?status=open"
        loading={loading}
      />
      <StatCard
        icon={AlertTriangle}
        value={tasks?.overdue}
        label={t("dashboard.stats.overdue")}
        href="/tasks?status=overdue"
        loading={loading}
      />
      <StatCard
        icon={Clock}
        value={tasks?.due_soon}
        label={t("dashboard.stats.due_this_week")}
        loading={loading}
      />
      <StatCard
        icon={CheckCircle2}
        value={completedCount}
        label={t("dashboard.stats.completed")}
        href="/tasks?status=done"
        loading={loading}
      />
    </Box>
  );
}
