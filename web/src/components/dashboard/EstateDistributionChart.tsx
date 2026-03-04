import { Paper, Typography, Box, Skeleton } from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";
import { colors } from "../../theme/colors";

const DEFAULT_COLORS = colors.chart.default;

interface EstateDistributionChartProps {
  title: string;
  data: Record<string, number> | undefined;
  loading: boolean;
  accentColor?: string;
}

export function EstateDistributionChart({
  title,
  data,
  loading,
  accentColor,
}: EstateDistributionChartProps) {
  const barColors = accentColor
    ? [accentColor, ...DEFAULT_COLORS.slice(1)]
    : [...DEFAULT_COLORS];
  const { t } = useTranslation();
  const entries = Object.entries(data ?? {}).sort((a, b) => b[1] - a[1]);
  const maxValue =
    entries.length > 0 ? Math.max(...entries.map(([, v]) => v)) : 1;

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 1 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={28} />
          ))}
        </Box>
      ) : entries.length === 0 ? (
        <Typography variant="body2">{t("dashboard.charts.no_data")}</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {entries.map(([label, count], index) => (
            <Box key={label}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ textTransform: "capitalize" }}
                >
                  {label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {count}
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 8,
                  borderRadius: 1,
                  bgcolor: "divider",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    width: `${(count / maxValue) * 100}%`,
                    bgcolor: barColors[index % barColors.length],
                    borderRadius: 1,
                    transition: "width 0.3s ease",
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
