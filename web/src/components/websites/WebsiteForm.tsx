import { useState, useCallback, useMemo } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Alert,
} from "@mui/material";
import { X } from "lucide-react";
import { usePostWebsiteCreate, usePatchWebsiteUpdateById } from "../../api/hooks";
import { useTranslation } from "../../contexts/LanguageContext";
import type { Website } from "../../api/types";

interface WebsiteFormProps {
  open: boolean;
  onClose: () => void;
  website?: Website | null;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
}

function websiteToFormState(website?: Website | null): FormState {
  return {
    name: website?.name ?? "",
    slug: website?.slug ?? "",
    description: website?.description ?? "",
  };
}

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function WebsiteForm({ open, onClose, website, onSuccess }: WebsiteFormProps) {
  const { t } = useTranslation();
  const isEdit = website != null;

  const initialState = useMemo(() => websiteToFormState(website), [website]);
  const [form, setForm] = useState<FormState>(initialState);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = usePostWebsiteCreate();
  const updateMutation = usePatchWebsiteUpdateById();

  const loading = createMutation.loading || updateMutation.loading;

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleNameChange = useCallback(
    (value: string) => {
      updateField("name", value);
      if (!isEdit && !slugManuallyEdited) {
        updateField("slug", nameToSlug(value));
      }
    },
    [isEdit, slugManuallyEdited, updateField],
  );

  const handleSlugChange = useCallback(
    (value: string) => {
      setSlugManuallyEdited(true);
      updateField("slug", value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
    },
    [updateField],
  );

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    try {
      if (isEdit) {
        await updateMutation.mutate({
          path: { id: website.id },
          body: {
            name: form.name,
            slug: form.slug,
            description: form.description || null,
          },
        });
      } else {
        await createMutation.mutate({
          body: {
            name: form.name,
            slug: form.slug,
            description: form.description || null,
          },
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    }
  }, [form, isEdit, website, createMutation, updateMutation, onSuccess, onClose]);

  const handleEntered = useCallback(() => {
    setForm(websiteToFormState(website));
    setSubmitError(null);
    setSlugManuallyEdited(false);
  }, [website]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 480, maxWidth: "100vw" } } }}
      SlideProps={{ onEntered: handleEntered }}
    >
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">
            {isEdit ? t("websites.form.edit_title") : t("websites.form.create_title")}
          </Typography>
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
            onChange={(e) => handleNameChange(e.target.value)}
            fullWidth
            required
            size="small"
          />
          <TextField
            label={t("websites.field.slug")}
            value={form.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            fullWidth
            required
            size="small"
            helperText={form.slug ? `/sites/${form.slug}` : ""}
          />
          <TextField
            label={t("websites.field.description")}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            fullWidth
            multiline
            rows={3}
            size="small"
          />
        </Box>

        <Box sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", gap: 1 }}>
          <Button onClick={onClose} fullWidth disabled={loading}>
            {t("websites.form.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth
            disabled={loading || !form.name || !form.slug}
          >
            {loading
              ? t("websites.form.saving")
              : isEdit
                ? t("websites.form.save")
                : t("websites.form.create")}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
