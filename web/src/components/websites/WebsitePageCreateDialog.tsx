import { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";
import { usePostWebsitePageCreate } from "../../api/hooks";

interface WebsitePageCreateDialogProps {
  open: boolean;
  onClose: () => void;
  websiteId: string;
  onSuccess: () => void;
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function WebsitePageCreateDialog({
  open,
  onClose,
  websiteId,
  onSuccess,
}: WebsitePageCreateDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = usePostWebsitePageCreate();

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (!slugManuallyEdited) {
        setSlug(titleToSlug(value));
      }
    },
    [slugManuallyEdited],
  );

  const handleSlugChange = useCallback((value: string) => {
    setSlugManuallyEdited(true);
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    try {
      await createMutation.mutate({
        path: { websiteId },
        body: { title, slug },
      });
      setTitle("");
      setSlug("");
      setSlugManuallyEdited(false);
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    }
  }, [title, slug, websiteId, createMutation, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    setTitle("");
    setSlug("");
    setSlugManuallyEdited(false);
    setSubmitError(null);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("websites.page_create.title")}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <TextField
          label={t("websites.page_create.page_title")}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          fullWidth
          size="small"
          autoFocus
        />
        <TextField
          label={t("websites.page_create.page_slug")}
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          fullWidth
          size="small"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("websites.page_create.cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={createMutation.loading || !title || !slug}
        >
          {createMutation.loading
            ? t("websites.page_create.creating")
            : t("websites.page_create.create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
