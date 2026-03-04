import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
} from "@mui/material";
import { usePostActivityCreate } from "../../api/hooks";
import { useTranslation } from "../../contexts/LanguageContext";

interface FormState {
  type: string;
  subject: string;
  description: string;
  estate_id: string;
  contact_id: string;
}

const INITIAL_STATE: FormState = {
  type: "phone_call",
  subject: "",
  description: "",
  estate_id: "",
  contact_id: "",
};

const MANUAL_TYPES = [
  { value: "phone_call", labelKey: "activity.type.phone_call" },
  { value: "meeting", labelKey: "activity.type.meeting" },
  { value: "note", labelKey: "activity.type.note" },
  { value: "viewing", labelKey: "activity.type.viewing" },
];

interface ActivityCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ActivityCreateDialog({
  open,
  onClose,
  onSuccess,
}: ActivityCreateDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const { loading, mutate } = usePostActivityCreate();

  const updateField = useCallback(
    <K extends keyof FormState>(key: K) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
      },
    [],
  );

  const handleEntering = useCallback(() => {
    setForm(INITIAL_STATE);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      await mutate({
        body: {
          type: form.type,
          subject: form.subject,
          description: form.description || null,
          estate_id: form.estate_id || null,
          contact_id: form.contact_id || null,
        },
      });
      onSuccess();
      onClose();
    } catch {
      // Error handled by hook
    }
  }, [form, mutate, onSuccess, onClose]);

  const isValid = useMemo(() => form.subject.trim().length > 0, [form.subject]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onEntering: handleEntering }}
    >
      <DialogTitle>{t("activity.form.title")}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            select
            label={t("activity.form.type")}
            value={form.type}
            onChange={updateField("type")}
            size="small"
            fullWidth
          >
            {MANUAL_TYPES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label={t("activity.form.subject")}
            value={form.subject}
            onChange={updateField("subject")}
            size="small"
            fullWidth
            required
            autoFocus
          />

          <TextField
            label={t("activity.form.description")}
            value={form.description}
            onChange={updateField("description")}
            size="small"
            fullWidth
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("activity.form.cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !isValid}
        >
          {loading ? t("activity.form.saving") : t("activity.form.create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
