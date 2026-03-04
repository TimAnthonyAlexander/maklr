import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type {
  Appointment,
  PostAppointmentCreateRequestBody,
  AppointmentConflict,
  AppointmentWithConflicts,
} from "../../api/types";
import {
  usePostAppointmentCreate,
  usePatchAppointmentUpdateById,
} from "../../api/hooks";
import { toDatetimeLocal, toApiDatetime } from "../../utils/dateUtils";
import { useTranslation } from "../../contexts/LanguageContext";

interface AppointmentFormDialogProps {
  open: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  initialDateTime?: Date | null;
  onSuccess: () => void;
}

interface FormState {
  title: string;
  description: string;
  type: string;
  starts_at: string;
  ends_at: string;
  location: string;
  estate_id: string;
}

const TYPE_KEYS = [
  "viewing",
  "meeting",
  "call",
  "handover",
  "inspection",
  "open_house",
  "signing",
  "valuation",
  "photography",
  "other",
] as const;

function appointmentToFormState(
  appointment?: Appointment | null,
  initialDateTime?: Date | null,
): FormState {
  if (appointment) {
    return {
      title: appointment.title ?? "",
      description: appointment.description ?? "",
      type: appointment.type ?? "other",
      starts_at: appointment.starts_at
        ? toDatetimeLocal(new Date(appointment.starts_at.replace(" ", "T")))
        : "",
      ends_at: appointment.ends_at
        ? toDatetimeLocal(new Date(appointment.ends_at.replace(" ", "T")))
        : "",
      location: appointment.location ?? "",
      estate_id: appointment.estate_id ?? "",
    };
  }

  const start = initialDateTime ?? new Date();
  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  return {
    title: "",
    description: "",
    type: "meeting",
    starts_at: toDatetimeLocal(start),
    ends_at: toDatetimeLocal(end),
    location: "",
    estate_id: "",
  };
}

function formStateToBody(form: FormState): PostAppointmentCreateRequestBody {
  const strOrNull = (v: string) => (v === "" ? null : v);

  return {
    title: form.title,
    description: strOrNull(form.description),
    type: form.type,
    starts_at: toApiDatetime(new Date(form.starts_at)),
    ends_at: toApiDatetime(new Date(form.ends_at)),
    location: strOrNull(form.location),
    estate_id: strOrNull(form.estate_id),
  };
}

function computeDiff(
  original: FormState,
  current: FormState,
): Partial<PostAppointmentCreateRequestBody> {
  const originalBody = formStateToBody(original);
  const currentBody = formStateToBody(current);
  const diff: Record<string, unknown> = {};

  for (const key of Object.keys(
    currentBody,
  ) as (keyof PostAppointmentCreateRequestBody)[]) {
    if (currentBody[key] !== originalBody[key]) {
      diff[key] = currentBody[key];
    }
  }

  return diff as Partial<PostAppointmentCreateRequestBody>;
}

export function AppointmentFormDialog({
  open,
  onClose,
  appointment,
  initialDateTime,
  onSuccess,
}: AppointmentFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = appointment != null;
  const initialState = useMemo(
    () => appointmentToFormState(appointment, initialDateTime),
    [appointment, initialDateTime],
  );
  const [form, setForm] = useState<FormState>(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<AppointmentConflict[]>([]);

  const createMutation = usePostAppointmentCreate();
  const updateMutation = usePatchAppointmentUpdateById();

  const loading = createMutation.loading || updateMutation.loading;

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    setConflicts([]);

    try {
      let result: AppointmentWithConflicts;
      if (isEdit && appointment?.id) {
        const diff = computeDiff(initialState, form);
        if (Object.keys(diff).length === 0) {
          onClose();
          return;
        }
        result = await updateMutation.mutate({
          path: { id: appointment.id },
          body: diff,
        });
      } else {
        result = await createMutation.mutate({
          body: formStateToBody(form),
        });
      }

      onSuccess();

      // Show conflict warnings if present (appointment saved successfully)
      if (result?.conflicts && result.conflicts.length > 0) {
        setConflicts(result.conflicts);
      } else {
        onClose();
      }
    } catch (err) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Something went wrong");
      }
    }
  }, [
    isEdit,
    appointment,
    initialState,
    form,
    updateMutation,
    createMutation,
    onSuccess,
    onClose,
  ]);

  const handleEntering = useCallback(() => {
    setForm(appointmentToFormState(appointment, initialDateTime));
    setSubmitError(null);
    setConflicts([]);
  }, [appointment, initialDateTime]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableRestoreFocus
      TransitionProps={{ onEntering: handleEntering }}
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {isEdit ? t("calendar.form.edit_title") : t("calendar.form.new_title")}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        {conflicts.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Box sx={{ fontWeight: 500, mb: 0.5 }}>
              {t("calendar.form.conflict_warning")}
            </Box>
            {conflicts.map((c, i) => (
              <Box key={i} sx={{ fontSize: "0.85rem" }}>
                {c.title} ({c.starts_at} \u2013 {c.ends_at})
              </Box>
            ))}
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label={t("calendar.form.title")}
            required
            size="small"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            autoFocus
          />

          <TextField
            label={t("calendar.form.description")}
            size="small"
            multiline
            rows={2}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />

          <FormControl size="small">
            <InputLabel>{t("calendar.form.type")}</InputLabel>
            <Select
              label={t("calendar.form.type")}
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
            >
              {TYPE_KEYS.map((key) => (
                <MenuItem key={key} value={key}>
                  {t(`calendar.type.${key}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label={t("calendar.form.starts_at")}
              size="small"
              type="datetime-local"
              fullWidth
              value={form.starts_at}
              onChange={(e) => updateField("starts_at", e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label={t("calendar.form.ends_at")}
              size="small"
              type="datetime-local"
              fullWidth
              value={form.ends_at}
              onChange={(e) => updateField("ends_at", e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <TextField
            label={t("calendar.form.location")}
            size="small"
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {conflicts.length > 0 ? (
          <Button variant="contained" onClick={onClose}>
            {t("calendar.form.acknowledge")}
          </Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={loading}>
              {t("calendar.form.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={
                loading || !form.title || !form.starts_at || !form.ends_at
              }
            >
              {loading
                ? t("calendar.form.saving")
                : isEdit
                  ? t("calendar.form.save_changes")
                  : t("calendar.form.create")}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
