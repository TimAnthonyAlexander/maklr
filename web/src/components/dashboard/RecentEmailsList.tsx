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
import type { DashboardRecentEmail } from "../../api/types";

interface RecentEmailsListProps {
  emails: DashboardRecentEmail[] | undefined;
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

export function RecentEmailsList({
  emails,
  loading,
}: RecentEmailsListProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
      <Box sx={{ px: 3, pt: 3, pb: 1.5 }}>
        <Typography variant="h6">
          {t("dashboard.recent_emails.title")}
        </Typography>
      </Box>
      <TableContainer>
        <Table sx={{ "& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root": { borderBottom: "none" } }}>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3].map((j) => (
                    <TableCell key={j}>
                      <Skeleton width={80} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (emails ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography variant="body2">
                    {t("dashboard.recent_emails.empty")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              (emails ?? []).map((email) => (
                <TableRow
                  key={email.id}
                  hover
                  onClick={() => navigate("/email")}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: email.read ? 400 : 600 }}
                    >
                      {email.subject || "\u2014"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {email.from_address}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatRelativeTime(email.received_at, t)}
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
