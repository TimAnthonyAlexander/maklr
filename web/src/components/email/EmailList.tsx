import {
  Box,
  Typography,
  TextField,
  Skeleton,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import { MailOpen, Search, ArrowUpRight, ArrowDownLeft, Mail } from "lucide-react";
import type { EmailMessage } from "../../api/types";
import { useTranslation } from "../../contexts/LanguageContext";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  return dateFormatter.format(new Date(dateStr));
}

function getDisplayName(email: EmailMessage): string {
  if (email.direction === "outgoing") {
    const names = email.to_names?.split(",");
    const firstName = names?.[0]?.trim();
    if (firstName) return firstName;
    return email.to_addresses?.split(",")[0]?.trim() ?? "";
  }
  return email.from_name || email.from_address || "";
}

function getPreviewText(email: EmailMessage): string {
  if (email.body_text) {
    return email.body_text.slice(0, 120).replace(/\s+/g, " ");
  }
  if (email.body_html) {
    const div = document.createElement("div");
    div.innerHTML = email.body_html;
    return (div.textContent ?? "").slice(0, 120).replace(/\s+/g, " ");
  }
  return "";
}

interface EmailListProps {
  emails: EmailMessage[];
  loading: boolean;
  selectedId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (id: string) => void;
  unreadOnly: boolean;
  onToggleUnreadOnly: () => void;
}

export function EmailList({
  emails,
  loading,
  selectedId,
  searchQuery,
  onSearchChange,
  onSelect,
  unreadOnly,
  onToggleUnreadOnly,
}: EmailListProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        width: 380,
        minWidth: 380,
        borderRight: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Search + Filter */}
      <Box sx={{ p: 1.5, display: "flex", gap: 0.5, alignItems: "center" }}>
        <TextField
          size="small"
          fullWidth
          placeholder={t("email.search_placeholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: "background.default",
            },
          }}
        />
        <Tooltip title={t("email.filter_unread")}>
          <IconButton
            size="small"
            onClick={onToggleUnreadOnly}
            sx={{
              color: unreadOnly ? "primary.main" : "text.secondary",
              bgcolor: unreadOnly ? "rgba(0,0,0,0.05)" : "transparent",
              borderRadius: 2,
              flexShrink: 0,
            }}
          >
            <MailOpen size={20} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* List */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Box
              key={i}
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          ))}

        {!loading && emails.length === 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 8,
              color: "text.secondary",
            }}
          >
            <Mail size={48} style={{ marginBottom: 8, opacity: 0.3 }} />
            <Typography variant="body2">{t("email.no_emails_found")}</Typography>
          </Box>
        )}

        {!loading &&
          emails.map((email) => (
            <Box
              key={email.id}
              onClick={() => email.id && onSelect(email.id)}
              sx={{
                px: 2,
                py: 1.5,
                cursor: "pointer",
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor:
                  selectedId === email.id ? "rgba(0,0,0,0.04)" : "transparent",
                "&:hover": {
                  bgcolor:
                    selectedId === email.id
                      ? "rgba(0,0,0,0.06)"
                      : "rgba(0,0,0,0.02)",
                },
                transition: "background-color 0.15s",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 0.25,
                }}
              >
                {email.direction === "outgoing" ? (
                  <ArrowUpRight
                    size={14}
                  />
                ) : (
                  <ArrowDownLeft
                    size={14}
                  />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: email.read === false ? 600 : 400,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "text.primary",
                  }}
                >
                  {getDisplayName(email)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", flexShrink: 0 }}
                >
                  {formatDate(email.received_at)}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: email.read === false ? 600 : 400,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "text.primary",
                  fontSize: "0.8125rem",
                }}
              >
                {email.subject || t("email.no_subject")}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "block",
                }}
              >
                {getPreviewText(email)}
              </Typography>
            </Box>
          ))}
      </Box>
    </Box>
  );
}
