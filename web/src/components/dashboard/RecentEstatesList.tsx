import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Skeleton,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router";
import { useTranslation } from "../../contexts/LanguageContext";
import { EstateStatusChip } from "../estates/EstateStatusChip";
import type { Estate } from "../../api/types";

interface RecentEstatesListProps {
  estates: Estate[] | undefined;
  loading: boolean;
}

function formatRelativeTime(
  dateStr: string | null | undefined,
  t: (key: string, params?: Record<string, string>) => string,
): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("dashboard.time.just_now");
  if (diffMins < 60)
    return t("dashboard.time.minutes_ago", { count: String(diffMins) });
  if (diffHours < 24)
    return t("dashboard.time.hours_ago", { count: String(diffHours) });
  if (diffDays < 30)
    return t("dashboard.time.days_ago", { count: String(diffDays) });
  return date.toLocaleDateString();
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return "-";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function RecentEstatesList({
  estates,
  loading,
}: RecentEstatesListProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
      <Box sx={{ px: 3, pt: 3, pb: 1.5 }}>
        <Typography variant="h6">
          {t("dashboard.recent_estates.title")}
        </Typography>
      </Box>
      <TableContainer>
        <Table sx={{ "& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root": { borderBottom: "none" } }}>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <TableCell key={j}>
                      <Skeleton width={80} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (estates ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2">
                    {t("dashboard.recent_estates.empty")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              (estates ?? []).map((estate) => (
                <TableRow
                  key={estate.id}
                  hover
                  onClick={() => navigate(`/estates/${estate.id}`)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {estate.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <EstateStatusChip status={estate.status ?? "draft"} />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ textTransform: "capitalize" }}
                    >
                      {estate.property_type}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatPrice(estate.price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatRelativeTime(estate.created_at, t)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
