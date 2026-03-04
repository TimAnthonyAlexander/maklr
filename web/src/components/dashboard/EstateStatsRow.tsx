import { Box } from "@mui/material";
import { Building2, CircleDot, Clock, CheckCircle } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import { StatCard } from "./StatCard";
import type { DashboardStatsResponse } from "../../api/types";

interface EstateStatsRowProps {
  stats: DashboardStatsResponse | null;
  loading: boolean;
}

export function EstateStatsRow({ stats, loading }: EstateStatsRowProps) {
  const { t } = useTranslation();
  const byStatus = stats?.estates_by_status ?? {};
  const sold = (byStatus["sold"] ?? 0) + (byStatus["rented"] ?? 0);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
        gap: 2,
      }}
    >
      <StatCard
        icon={Building2}
        value={stats?.total_estates}
        label={t("dashboard.stats.total_estates")}
        href="/estates"
        loading={loading}
      />
      <StatCard
        icon={CircleDot}
        value={byStatus["active"]}
        label={t("dashboard.stats.active")}
        href="/estates?status=active"
        loading={loading}
      />
      <StatCard
        icon={Clock}
        value={byStatus["reserved"]}
        label={t("dashboard.stats.reserved")}
        href="/estates?status=reserved"
        loading={loading}
      />
      <StatCard
        icon={CheckCircle}
        value={sold}
        label={t("dashboard.stats.sold_rented")}
        loading={loading}
      />
    </Box>
  );
}
