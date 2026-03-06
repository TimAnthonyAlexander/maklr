import { useCallback } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Alert,
  Divider,
} from "@mui/material";
import { X, RotateCcw } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import {
  useGetWebsitePageVersionList,
  usePostWebsitePageVersionRestore,
} from "../../api/hooks";

interface WebsiteVersionHistoryProps {
  open: boolean;
  onClose: () => void;
  websiteId: string;
  pageId: string;
  onRestored: () => void;
}

export function WebsiteVersionHistory({
  open,
  onClose,
  websiteId,
  pageId,
  onRestored,
}: WebsiteVersionHistoryProps) {
  const { t } = useTranslation();

  const { data, loading, error, refetch } = useGetWebsitePageVersionList(
    { websiteId, pageId },
    { enabled: open && !!pageId },
    [open],
  );

  const restoreMutation = usePostWebsitePageVersionRestore();

  const versions = data?.items ?? [];

  const handleRestore = useCallback(
    async (versionId: string) => {
      try {
        await restoreMutation.mutate({
          path: { websiteId, pageId, versionId },
        });
        refetch();
        onRestored();
      } catch {
        // Error handled by mutation hook
      }
    },
    [websiteId, pageId, restoreMutation, refetch, onRestored],
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 400, maxWidth: "100vw" } } }}
    >
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">{t("websites.versions.title")}</Typography>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}

        <Box sx={{ flex: 1, overflow: "auto" }}>
          {!loading && versions.length === 0 && (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              {t("websites.versions.empty")}
            </Typography>
          )}

          {versions.map((version, index) => (
            <Box key={version.id}>
              {index > 0 && <Divider />}
              <Box sx={{ py: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography fontWeight={500} fontSize="0.9rem">
                    {t("websites.versions.version")} {version.version_number}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<RotateCcw size={14} />}
                    onClick={() => handleRestore(version.id)}
                    disabled={restoreMutation.loading}
                  >
                    {restoreMutation.loading
                      ? t("websites.versions.restoring")
                      : t("websites.versions.restore")}
                  </Button>
                </Box>
                {version.change_summary && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {version.change_summary}
                  </Typography>
                )}
                <Typography variant="caption" color="text.disabled">
                  {version.created_at
                    ? new Date(version.created_at).toLocaleString()
                    : "\u2014"}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Drawer>
  );
}
