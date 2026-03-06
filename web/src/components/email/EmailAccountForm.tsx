import { useState, useCallback, useMemo } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  IconButton,
} from "@mui/material";
import { X } from "lucide-react";
import type {
  EmailAccount,
  PostEmailAccountCreateRequestBody,
  PatchEmailAccountUpdateRequestBody,
} from "../../api/types";
import {
  usePostEmailAccountCreate,
  usePatchEmailAccountUpdateById,
} from "../../api/hooks";
import { useTranslation } from "../../contexts/LanguageContext";

interface EmailAccountFormProps {
  open: boolean;
  onClose: () => void;
  account?: EmailAccount | null;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  email_address: string;
  imap_host: string;
  imap_port: string;
  imap_encryption: string;
  smtp_host: string;
  smtp_port: string;
  smtp_encryption: string;
  username: string;
  password: string;
  scope: string;
}

const ENCRYPTION_OPTIONS = ["ssl", "tls", "none"] as const;
const SCOPE_OPTIONS = ["personal", "office"] as const;

function accountToFormState(account?: EmailAccount | null): FormState {
  return {
    name: account?.name ?? "",
    email_address: account?.email_address ?? "",
    imap_host: account?.imap_host ?? "",
    imap_port: String(account?.imap_port ?? 993),
    imap_encryption: account?.imap_encryption ?? "ssl",
    smtp_host: account?.smtp_host ?? "",
    smtp_port: String(account?.smtp_port ?? 465),
    smtp_encryption: account?.smtp_encryption ?? "ssl",
    username: account?.username ?? "",
    password: "",
    scope: account?.scope ?? "personal",
  };
}

function formStateToBody(form: FormState): PostEmailAccountCreateRequestBody {
  return {
    name: form.name,
    email_address: form.email_address,
    imap_host: form.imap_host,
    imap_port: parseInt(form.imap_port, 10) || 993,
    imap_encryption: form.imap_encryption,
    smtp_host: form.smtp_host,
    smtp_port: parseInt(form.smtp_port, 10) || 465,
    smtp_encryption: form.smtp_encryption,
    username: form.username,
    password: form.password,
    scope: form.scope,
  };
}

function computeDiff(
  original: FormState,
  current: FormState,
): PatchEmailAccountUpdateRequestBody {
  const originalBody = formStateToBody(original);
  const currentBody = formStateToBody(current);
  const diff: Record<string, unknown> = {};

  for (const key of Object.keys(
    currentBody,
  ) as (keyof PostEmailAccountCreateRequestBody)[]) {
    if (key === "password") {
      if (current.password !== "") {
        diff.password = current.password;
      }
      continue;
    }
    if (currentBody[key] !== originalBody[key]) {
      diff[key] = currentBody[key];
    }
  }

  return diff as PatchEmailAccountUpdateRequestBody;
}

export function EmailAccountForm({
  open,
  onClose,
  account,
  onSuccess,
}: EmailAccountFormProps) {
  const { t } = useTranslation();
  const isEdit = account != null;
  const initialState = useMemo(() => accountToFormState(account), [account]);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = usePostEmailAccountCreate();
  const updateMutation = usePatchEmailAccountUpdateById();

  const loading = createMutation.loading || updateMutation.loading;

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const canSubmit =
    form.name !== "" &&
    form.email_address !== "" &&
    form.imap_host !== "" &&
    form.smtp_host !== "" &&
    form.username !== "" &&
    (!isEdit ? form.password !== "" : true);

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);

    try {
      if (isEdit && account?.id) {
        const diff = computeDiff(initialState, form);
        if (Object.keys(diff).length === 0) {
          onClose();
          return;
        }
        await updateMutation.mutate({
          path: { id: account.id },
          body: diff,
        });
      } else {
        await createMutation.mutate({
          body: formStateToBody(form),
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t("email.something_went_wrong"),
      );
    }
  }, [
    isEdit,
    account,
    initialState,
    form,
    updateMutation,
    createMutation,
    onSuccess,
    onClose,
  ]);

  const handleEntered = useCallback(() => {
    setForm(accountToFormState(account));
    setSubmitError(null);
  }, [account]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 560, maxWidth: "100vw" } } }}
      SlideProps={{ onEntered: handleEntered }}
    >
      <Box
        sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Typography variant="h6">
            {isEdit ? t("email.edit_account") : t("email.connect_email_account")}
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
          {/* Account Info */}
          <Typography
            variant="subtitle2"
            sx={{ color: "text.secondary", mt: 1 }}
          >
            {t("email.account_info")}
          </Typography>

          <TextField
            label={t("email.account_name")}
            required
            size="small"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder={t("email.account_name_placeholder")}
          />

          <TextField
            label={t("email.email_address")}
            required
            size="small"
            type="email"
            value={form.email_address}
            onChange={(e) => updateField("email_address", e.target.value)}
          />

          <FormControl size="small">
            <InputLabel>{t("email.scope")}</InputLabel>
            <Select
              label={t("email.scope")}
              value={form.scope}
              onChange={(e) => updateField("scope", e.target.value)}
            >
              {SCOPE_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* IMAP Settings */}
          <Typography
            variant="subtitle2"
            sx={{ color: "text.secondary", mt: 2 }}
          >
            {t("email.imap_settings")}
          </Typography>

          <TextField
            label={t("email.imap_host")}
            required
            size="small"
            value={form.imap_host}
            onChange={(e) => updateField("imap_host", e.target.value)}
            placeholder={t("email.imap_host_placeholder")}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label={t("email.imap_port")}
              size="small"
              type="number"
              value={form.imap_port}
              onChange={(e) => updateField("imap_port", e.target.value)}
              sx={{ width: 120 }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>{t("email.encryption")}</InputLabel>
              <Select
                label={t("email.encryption")}
                value={form.imap_encryption}
                onChange={(e) => updateField("imap_encryption", e.target.value)}
              >
                {ENCRYPTION_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* SMTP Settings */}
          <Typography
            variant="subtitle2"
            sx={{ color: "text.secondary", mt: 2 }}
          >
            {t("email.smtp_settings")}
          </Typography>

          <TextField
            label={t("email.smtp_host")}
            required
            size="small"
            value={form.smtp_host}
            onChange={(e) => updateField("smtp_host", e.target.value)}
            placeholder={t("email.smtp_host_placeholder")}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label={t("email.smtp_port")}
              size="small"
              type="number"
              value={form.smtp_port}
              onChange={(e) => updateField("smtp_port", e.target.value)}
              sx={{ width: 120 }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>{t("email.encryption")}</InputLabel>
              <Select
                label={t("email.encryption")}
                value={form.smtp_encryption}
                onChange={(e) => updateField("smtp_encryption", e.target.value)}
              >
                {ENCRYPTION_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Credentials */}
          <Typography
            variant="subtitle2"
            sx={{ color: "text.secondary", mt: 2 }}
          >
            {t("email.credentials")}
          </Typography>

          <TextField
            label={t("email.username")}
            required
            size="small"
            value={form.username}
            onChange={(e) => updateField("username", e.target.value)}
          />

          <TextField
            label={t("email.password")}
            required={!isEdit}
            size="small"
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            helperText={
              isEdit ? t("email.password_hint") : undefined
            }
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            pt: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button onClick={onClose} fullWidth disabled={loading}>
            {t("email.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth
            disabled={loading || !canSubmit}
          >
            {loading
              ? t("email.saving")
              : isEdit
                ? t("email.save_changes")
                : t("email.connect_account")}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
