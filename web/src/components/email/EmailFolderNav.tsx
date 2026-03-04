import { Box, Typography, Badge } from "@mui/material";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import ReportOutlinedIcon from "@mui/icons-material/ReportOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import { useTranslation } from "../../contexts/LanguageContext";

export type EmailFolder = "inbox" | "sent" | "spam" | "trash" | "archived";

interface EmailFolderNavProps {
  selectedFolder: EmailFolder;
  onSelectFolder: (folder: EmailFolder) => void;
  unreadInboxCount: number;
}

const MAIN_FOLDERS: {
  id: EmailFolder;
  icon: React.ElementType;
  translationKey: string;
}[] = [
  { id: "inbox", icon: InboxOutlinedIcon, translationKey: "email.folder_inbox" },
  { id: "sent", icon: SendOutlinedIcon, translationKey: "email.folder_sent" },
];

const SECONDARY_FOLDERS: {
  id: EmailFolder;
  icon: React.ElementType;
  translationKey: string;
}[] = [
  { id: "archived", icon: ArchiveOutlinedIcon, translationKey: "email.folder_archived" },
  { id: "spam", icon: ReportOutlinedIcon, translationKey: "email.folder_spam" },
  { id: "trash", icon: DeleteOutlinedIcon, translationKey: "email.folder_trash" },
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
            <Icon sx={{ fontSize: 18 }} />
          </Badge>
        ) : (
          <Icon sx={{ fontSize: 18 }} />
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
