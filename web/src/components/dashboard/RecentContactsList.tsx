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
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router";
import { useTranslation } from "../../contexts/LanguageContext";
import type { Contact } from "../../api/types";
import { colors } from "../../theme/colors";

interface RecentContactsListProps {
  contacts: Contact[] | undefined;
  loading: boolean;
}

const STAGE_COLORS: Record<string, string> = {
  cold: colors.status.neutral.text,
  warm: colors.status.warning.text,
  hot: colors.status.error.text,
  customer: colors.status.success.text,
  lost: "#BDBDBD",
};

function formatContactName(contact: Contact): string {
  if (contact.entity_type === "company") {
    return contact.company_name || "\u2014";
  }
  const parts = [contact.first_name, contact.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "\u2014";
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

export function RecentContactsList({
  contacts,
  loading,
}: RecentContactsListProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
      <Box sx={{ px: 3, pt: 3, pb: 1.5 }}>
        <Typography variant="h6">
          {t("dashboard.recent_contacts.title")}
        </Typography>
      </Box>
      <TableContainer>
        <Table sx={{ "& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root": { borderBottom: "none" } }}>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4].map((j) => (
                    <TableCell key={j}>
                      <Skeleton width={80} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (contacts ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2">
                    {t("dashboard.recent_contacts.empty")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              (contacts ?? []).map((contact) => (
                <TableRow
                  key={contact.id}
                  hover
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatContactName(contact)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ textTransform: "capitalize" }}
                    >
                      {contact.type ?? "\u2014"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={contact.stage ?? "cold"}
                      size="small"
                      sx={{
                        bgcolor:
                          STAGE_COLORS[contact.stage ?? "cold"] ?? "#9E9E9E",
                        color: "#fff",
                        fontWeight: 500,
                        fontSize: "0.75rem",
                        textTransform: "capitalize",
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatRelativeTime(contact.created_at, t)}
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
