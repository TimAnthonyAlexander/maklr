import { useState, useCallback, useMemo } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
} from "@mui/material";
import { X, ExternalLink } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import { usePatchWebsiteUpdateById, useDeleteWebsiteById } from "../../api/hooks";
import type { Website } from "../../api/types";

interface WebsiteSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  website: Website;
  onUpdated: (website: Website) => void;
  onDeleted: () => void;
}

export function WebsiteSettingsDrawer({
  open,
  onClose,
  website,
  onUpdated,
  onDeleted,
}: WebsiteSettingsDrawerProps) {
  const { t } = useTranslation();

  const initialState = useMemo(
    () => ({
      name: website.name,
      slug: website.slug,
      description: website.description ?? "",
      published: website.published,
    }),
    [website],
  );

  const [form, setForm] = useState(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateMutation = usePatchWebsiteUpdateById();
  const deleteMutation = useDeleteWebsiteById();

  const handleSave = useCallback(async () => {
    setSubmitError(null);
    try {
      const result = await updateMutation.mutate({
        path: { id: website.id },
        body: {
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          published: form.published,
        },
      });
      onUpdated(result);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    }
  }, [form, website.id, updateMutation, onUpdated]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteMutation.mutate({ path: { id: website.id } });
      onDeleted();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    }
  }, [website.id, deleteMutation, onDeleted]);

  const handleEntered = useCallback(() => {
    setForm({
      name: website.name,
      slug: website.slug,
      description: website.description ?? "",
      published: website.published,
    });
    setSubmitError(null);
    setConfirmDelete(false);
  }, [website]);

  const liveUrl = `/sites/${form.slug}`;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 420, maxWidth: "100vw" } } }}
      SlideProps={{ onEntered: handleEntered }}
    >
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">{t("websites.settings.title")}</Typography>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Box>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label={t("websites.field.name")}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            fullWidth
            size="small"
          />
          <TextField
            label={t("websites.field.slug")}
            value={form.slug}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
              }))
            }
            fullWidth
            size="small"
          />
          <TextField
            label={t("websites.field.description")}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            fullWidth
            multiline
            rows={3}
            size="small"
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.published}
                onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))}
              />
            }
            label={t("websites.settings.published")}
          />

          {form.published && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t("websites.settings.live_url")}:
              </Typography>
              <Typography
                component="a"
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                {liveUrl}
                <ExternalLink size={14} />
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {!confirmDelete ? (
            <Button color="error" variant="outlined" onClick={() => setConfirmDelete(true)}>
              {t("websites.settings.delete")}
            </Button>
          ) : (
            <Box>
              <Alert severity="warning" sx={{ mb: 1 }}>
                {t("websites.settings.delete_confirm")}
              </Alert>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button onClick={() => setConfirmDelete(false)} fullWidth>
                  {t("websites.form.cancel")}
                </Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={handleDelete}
                  disabled={deleteMutation.loading}
                  fullWidth
                >
                  {t("websites.settings.delete")}
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        <Box sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", gap: 1 }}>
          <Button onClick={onClose} fullWidth>
            {t("websites.form.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            fullWidth
            disabled={updateMutation.loading || !form.name || !form.slug}
          >
            {updateMutation.loading ? t("websites.form.saving") : t("websites.form.save")}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
