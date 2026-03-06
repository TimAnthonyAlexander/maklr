import { useState, useCallback, useMemo } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Alert,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { X } from "lucide-react";
import { usePostPortalCreate, usePatchPortalUpdateById } from "../../api/hooks";
import type { Portal } from "../../api/types";
import { useTranslation } from "../../contexts/LanguageContext";

interface PortalFormProps {
  open: boolean;
  onClose: () => void;
  portal?: Portal | null;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  ftp_host: string;
  ftp_port: string;
  ftp_username: string;
  ftp_password: string;
  ftp_path: string;
  ftp_passive: boolean;
  ftp_ssl: boolean;
  provider_id: string;
}

function portalToFormState(portal?: Portal | null): FormState {
  return {
    name: portal?.name ?? "",
    ftp_host: portal?.ftp_host ?? "",
    ftp_port: portal?.ftp_port != null ? String(portal.ftp_port) : "21",
    ftp_username: portal?.ftp_username ?? "",
    ftp_password: "",
    ftp_path: portal?.ftp_path ?? "/",
    ftp_passive: portal?.ftp_passive ?? true,
    ftp_ssl: portal?.ftp_ssl ?? true,
    provider_id: portal?.provider_id ?? "",
  };
}

export function PortalForm({ open, onClose, portal, onSuccess }: PortalFormProps) {
  const { t } = useTranslation();
  const isEdit = portal != null;
  const initialState = useMemo(() => portalToFormState(portal), [portal]);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = usePostPortalCreate();
  const updateMutation = usePatchPortalUpdateById();
  const loading = createMutation.loading || updateMutation.loading;

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        portal_type: "ftp",
        provider_id: form.provider_id || null,
        ftp_host: form.ftp_host || null,
        ftp_port: form.ftp_port ? Number(form.ftp_port) : null,
        ftp_username: form.ftp_username || null,
        ftp_path: form.ftp_path || "/",
        ftp_passive: form.ftp_passive,
        ftp_ssl: form.ftp_ssl,
      };
      if (form.ftp_password) {
        body.ftp_password = form.ftp_password;
      }

      if (isEdit) {
        await updateMutation.mutate({
          path: { id: portal.id ?? "" },
          body: body as never,
        });
      } else {
        await createMutation.mutate({ body: body as never });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    }
  }, [form, isEdit, portal, createMutation, updateMutation, onSuccess, onClose]);

  const handleEntered = useCallback(() => {
    setForm(portalToFormState(portal));
    setSubmitError(null);
  }, [portal]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 480, maxWidth: "100vw" } } }}
      SlideProps={{ onEntered: handleEntered }}
    >
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="h6">
            {isEdit ? t("portal.form.edit") : t("portal.form.create")}
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

        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            label={t("portal.field.name")}
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            fullWidth
            required
            size="small"
          />

          <TextField
            label={t("portal.field.provider_id")}
            value={form.provider_id}
            onChange={(e) => updateField("provider_id", e.target.value)}
            fullWidth
            size="small"
            helperText={t("portal.field.provider_id_help")}
          />

          <TextField
            label={t("portal.field.ftp_host")}
            value={form.ftp_host}
            onChange={(e) => updateField("ftp_host", e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label={t("portal.field.ftp_port")}
            value={form.ftp_port}
            onChange={(e) => updateField("ftp_port", e.target.value)}
            fullWidth
            size="small"
            type="number"
          />
          <TextField
            label={t("portal.field.ftp_username")}
            value={form.ftp_username}
            onChange={(e) => updateField("ftp_username", e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label={t("portal.field.ftp_password")}
            value={form.ftp_password}
            onChange={(e) => updateField("ftp_password", e.target.value)}
            fullWidth
            size="small"
            type="password"
            placeholder={isEdit ? t("portal.field.ftp_password_placeholder") : ""}
          />
          <TextField
            label={t("portal.field.ftp_path")}
            value={form.ftp_path}
            onChange={(e) => updateField("ftp_path", e.target.value)}
            fullWidth
            size="small"
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.ftp_passive}
                onChange={(e) => updateField("ftp_passive", e.target.checked)}
              />
            }
            label={t("portal.field.ftp_passive")}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.ftp_ssl}
                onChange={(e) => updateField("ftp_ssl", e.target.checked)}
              />
            }
            label={t("portal.field.ftp_ssl")}
          />
        </Box>

        <Box
          sx={{
            pt: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            gap: 1,
          }}
        >
          <Button onClick={onClose} fullWidth disabled={loading}>
            {t("portal.form.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth
            disabled={loading || !form.name}
          >
            {loading
              ? t("portal.form.saving")
              : isEdit
                ? t("portal.form.save")
                : t("portal.form.create")}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
