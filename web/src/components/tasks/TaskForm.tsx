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
import CloseIcon from "@mui/icons-material/Close";
import type { Task, PostTaskCreateRequestBody } from "../../api/types";
import { usePostTaskCreate, usePatchTaskUpdateById } from "../../api/hooks";
import { useTranslation } from "../../contexts/LanguageContext";

export interface TaskFormInitialValues {
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
  estate_id?: string | null;
  contact_id?: string | null;
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  initialValues?: TaskFormInitialValues | null;
  onSuccess: () => void;
}

interface FormState {
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  due_date: string;
  estate_id: string;
  contact_id: string;
}

const STATUS_KEYS = ["open", "in_progress", "done", "cancelled"] as const;
const PRIORITY_KEYS = ["low", "medium", "high", "urgent"] as const;
const TYPE_KEYS = [
  "task",
  "follow_up",
  "viewing",
  "call",
  "document_request",
  "maintenance",
] as const;

function taskToFormState(
  task?: Task | null,
  initialValues?: TaskFormInitialValues | null,
): FormState {
  return {
    title: task?.title ?? initialValues?.title ?? "",
    description: task?.description ?? initialValues?.description ?? "",
    type: task?.type ?? initialValues?.type ?? "task",
    priority: task?.priority ?? initialValues?.priority ?? "medium",
    status: task?.status ?? "open",
    due_date: task?.due_date ?? "",
    estate_id: task?.estate_id ?? initialValues?.estate_id ?? "",
    contact_id: task?.contact_id ?? initialValues?.contact_id ?? "",
  };
}

function formStateToBody(form: FormState): PostTaskCreateRequestBody {
  const strOrNull = (v: string) => (v === "" ? null : v);

  return {
    title: form.title,
    description: strOrNull(form.description),
    type: form.type,
    priority: form.priority,
    status: form.status,
    due_date: strOrNull(form.due_date),
    estate_id: strOrNull(form.estate_id),
    contact_id: strOrNull(form.contact_id),
  };
}

function computeDiff(
  original: FormState,
  current: FormState,
): Partial<PostTaskCreateRequestBody> {
  const originalBody = formStateToBody(original);
  const currentBody = formStateToBody(current);
  const diff: Record<string, unknown> = {};

  for (const key of Object.keys(
    currentBody,
  ) as (keyof PostTaskCreateRequestBody)[]) {
    if (currentBody[key] !== originalBody[key]) {
      diff[key] = currentBody[key];
    }
  }

  return diff as Partial<PostTaskCreateRequestBody>;
}

export function TaskForm({
  open,
  onClose,
  task,
  initialValues,
  onSuccess,
}: TaskFormProps) {
  const { t } = useTranslation();
  const isEdit = task != null;
  const initialState = useMemo(
    () => taskToFormState(task, initialValues),
    [task, initialValues],
  );
  const [form, setForm] = useState<FormState>(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = usePostTaskCreate();
  const updateMutation = usePatchTaskUpdateById();

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
      if (isEdit && task?.id) {
        const diff = computeDiff(initialState, form);
        if (Object.keys(diff).length === 0) {
          onClose();
          return;
        }
        await updateMutation.mutate({
          path: { id: task.id },
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
        err instanceof Error ? err.message : "Something went wrong",
      );
    }
  }, [
    isEdit,
    task,
    initialState,
    form,
    updateMutation,
    createMutation,
    onSuccess,
    onClose,
  ]);

  const handleEntered = useCallback(() => {
    setForm(taskToFormState(task, initialValues));
    setSubmitError(null);
  }, [task, initialValues]);

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
            {isEdit ? t("tasks.form.edit_title") : t("tasks.form.new_title")}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
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
            label={t("tasks.form.title")}
            required
            size="small"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
          />

          <TextField
            label={t("tasks.form.description")}
            size="small"
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>{t("tasks.form.type")}</InputLabel>
              <Select
                label={t("tasks.form.type")}
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
              >
                {TYPE_KEYS.map((key) => (
                  <MenuItem key={key} value={key}>
                    {t(`tasks.type.${key}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>{t("tasks.form.priority")}</InputLabel>
              <Select
                label={t("tasks.form.priority")}
                value={form.priority}
                onChange={(e) => updateField("priority", e.target.value)}
              >
                {PRIORITY_KEYS.map((key) => (
                  <MenuItem key={key} value={key}>
                    {t(`tasks.priority.${key}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <FormControl size="small">
            <InputLabel>{t("tasks.form.status")}</InputLabel>
            <Select
              label={t("tasks.form.status")}
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
            >
              {STATUS_KEYS.map((key) => (
                <MenuItem key={key} value={key}>
                  {t(`tasks.status.${key}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label={t("tasks.form.due_date")}
            size="small"
            type="date"
            value={form.due_date}
            onChange={(e) => updateField("due_date", e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
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
            {t("tasks.form.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth
            disabled={loading || !form.title}
          >
            {loading
              ? t("tasks.form.saving")
              : isEdit
                ? t("tasks.form.save_changes")
                : t("tasks.form.create")}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
