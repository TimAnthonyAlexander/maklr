import { Box, Typography, Badge } from "@mui/material";
import { Inbox, Send, AlertTriangle, Trash2, Archive } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

export type EmailFolder = "inbox" | "sent" | "spam" | "trash" | "archived";

interface EmailFolderNavProps {
  selectedFolder: EmailFolder;
  onSelectFolder: (folder: EmailFolder) => void;
  unreadInboxCount: number;
}

const FOLDER_ICONS: Record<EmailFolder, React.ElementType> = {
  inbox: Inbox,
  sent: Send,
  archived: Archive,
  spam: AlertTriangle,
  trash: Trash2,
};

const MAIN_FOLDERS: {
  id: EmailFolder;
  icon: React.ElementType;
  translationKey: string;
}[] = [
  { id: "inbox", icon: FOLDER_ICONS.inbox, translationKey: "email.folder_inbox" },
  { id: "sent", icon: FOLDER_ICONS.sent, translationKey: "email.folder_sent" },
];

const SECONDARY_FOLDERS: {
  id: EmailFolder;
  icon: React.ElementType;
  translationKey: string;
}[] = [
  { id: "archived", icon: FOLDER_ICONS.archived, translationKey: "email.folder_archived" },
  { id: "spam", icon: FOLDER_ICONS.spam, translationKey: "email.folder_spam" },
  { id: "trash", icon: FOLDER_ICONS.trash, translationKey: "email.folder_trash" },
];

export function EmailFolderNav({
  selectedFolder,
  onSelectFolder,
  unreadInboxCount,
}: EmailFolderNavProps) {
  const { t } = useTranslation();

  const renderItem = ({ id, icon: Icon, translationKey }: typeof MAIN_FOLDERS[number]) => {
    const isSelected = selectedFolder === id;
    const showBadge = id === "inbox" && unreadInboxCount > 0;

    return (
      <Box
        key={id}
        onClick={() => onSelectFolder(id)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 1.5,
          py: 0.75,
          cursor: "pointer",
          borderRadius: 1.5,
          bgcolor: isSelected ? "rgba(0,0,0,0.05)" : "transparent",
          color: isSelected ? "text.primary" : "text.secondary",
          transition: "all 0.15s ease",
          "&:hover": {
            bgcolor: isSelected ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.02)",
          },
        }}
      >
        {showBadge ? (
          <Badge badgeContent={unreadInboxCount} color="primary" max={99}>
            <Icon size={18} />
          </Badge>
        ) : (
          <Icon size={18} />
        )}
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            fontWeight: isSelected ? 600 : 400,
            color: "inherit",
            fontSize: "0.8125rem",
          }}
        >
          {t(translationKey)}
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        width: 148,
        minWidth: 148,
        borderRight: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        gap: 0.25,
        p: 1,
        pt: 1.5,
      }}
    >
      {MAIN_FOLDERS.map(renderItem)}

      <Box sx={{ my: 1 }} />

      {SECONDARY_FOLDERS.map(renderItem)}
    </Box>
  );
}
