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
  Switch,
  FormControlLabel,
  Button,
  Alert,
  IconButton,
  Divider,
  Chip,
} from "@mui/material";
import { X } from "lucide-react";
import type {
  CustomFieldDefinition,
  PostCustomFieldDefinitionCreateRequestBody,
  PatchCustomFieldDefinitionUpdateRequestBody,
} from "../../api/types";
import {
  usePostCustomFieldDefinitionCreate,
  usePatchCustomFieldDefinitionUpdateById,
} from "../../api/hooks";
import { useTranslation } from "../../contexts/LanguageContext";

interface CustomFieldDefinitionFormProps {
  open: boolean;
  onClose: () => void;
  definition?: CustomFieldDefinition | null;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  label: string;
  field_type: string;
  entity_type: string;
  options: string[];
  required: boolean;
  sort_order: string;
  active: boolean;
}

function definitionToFormState(
  def?: CustomFieldDefinition | null,
): FormState {
  return {
    name: def?.name ?? "",
    label: def?.label ?? "",
    field_type: def?.field_type ?? "text",
    entity_type: def?.entity_type ?? "estate",
    options: def?.options ?? [],
    required: def?.required ?? false,
    sort_order: def?.sort_order != null ? String(def.sort_order) : "0",
    active: def?.active ?? true,
  };
}

function formStateToCreateBody(
  form: FormState,
): PostCustomFieldDefinitionCreateRequestBody {
  return {
    name: form.name,
    label: form.label,
    field_type: form.field_type as PostCustomFieldDefinitionCreateRequestBody["field_type"],
    entity_type: form.entity_type as PostCustomFieldDefinitionCreateRequestBody["entity_type"],
    options: form.field_type === "select" ? form.options : null,
    required: form.required,
    sort_order: form.sort_order === "" ? 0 : Number(form.sort_order),
  };
}

function computeDiff(
  original: FormState,
  current: FormState,
): PatchCustomFieldDefinitionUpdateRequestBody {
  const diff: Record<string, unknown> = {};

  if (current.label !== original.label) diff.label = current.label;
  if (current.field_type !== original.field_type)
    diff.field_type = current.field_type;
  if (current.entity_type !== original.entity_type)
    diff.entity_type = current.entity_type;
  if (current.required !== original.required) diff.required = current.required;
  if (current.active !== original.active) diff.active = current.active;

  const sortOrder = current.sort_order === "" ? 0 : Number(current.sort_order);
  const origSortOrder =
    original.sort_order === "" ? 0 : Number(original.sort_order);
  if (sortOrder !== origSortOrder) diff.sort_order = sortOrder;

  if (JSON.stringify(current.options) !== JSON.stringify(original.options)) {
    diff.options = current.field_type === "select" ? current.options : null;
  }

  return diff as PatchCustomFieldDefinitionUpdateRequestBody;
}

const FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "textarea", label: "Textarea" },
];

const ENTITY_TYPE_OPTIONS = [
  { value: "estate", label: "Estate" },
  { value: "contact", label: "Contact" },
  { value: "both", label: "Both" },
];

export function CustomFieldDefinitionForm({
  open,
  onClose,
  definition,
  onSuccess,
}: CustomFieldDefinitionFormProps) {
  const { t } = useTranslation();
  const isEdit = definition != null;
  const initialState = useMemo(
    () => definitionToFormState(definition),
    [definition],
  );
  const [form, setForm] = useState<FormState>(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [optionInput, setOptionInput] = useState("");

  const createMutation = usePostCustomFieldDefinitionCreate();
  const updateMutation = usePatchCustomFieldDefinitionUpdateById();

  const loading = createMutation.loading || updateMutation.loading;

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleAddOption = useCallback(() => {
    const trimmed = optionInput.trim();
    if (trimmed && !form.options.includes(trimmed)) {
      setForm((prev) => ({ ...prev, options: [...prev.options, trimmed] }));
      setOptionInput("");
    }
  }, [optionInput, form.options]);

  const handleRemoveOption = useCallback((option: string) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((o) => o !== option),
    }));
  }, []);

  const handleOptionKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddOption();
      }
    },
    [handleAddOption],
  );

  const hasRequiredFields = form.name && form.label;

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);

    try {
      if (isEdit && definition?.id) {
        const diff = computeDiff(initialState, form);
        if (Object.keys(diff).length === 0) {
          onClose();
          return;
        }
        await updateMutation.mutate({
          path: { id: definition.id },
          body: diff,
        });
      } else {
        await createMutation.mutate({
          body: formStateToCreateBody(form),
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
    definition,
    initialState,
    form,
    updateMutation,
    createMutation,
    onSuccess,
    onClose,
  ]);

  const handleEntered = useCallback(() => {
    setForm(definitionToFormState(definition));
    setSubmitError(null);
    setOptionInput("");
  }, [definition]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 480, maxWidth: "100vw" } } }}
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
            {isEdit
              ? t("custom_fields.form_title_edit")
              : t("custom_fields.form_title_new")}
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
            label={t("custom_fields.field_name")}
            size="small"
            required
            fullWidth
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            disabled={isEdit}
            helperText={
              isEdit ? t("custom_fields.name_immutable") : undefined
            }
          />

          <TextField
            label={t("custom_fields.field_label")}
            size="small"
            required
            fullWidth
            value={form.label}
            onChange={(e) => updateField("label", e.target.value)}
          />

          <Divider />

          <FormControl size="small" fullWidth>
            <InputLabel>{t("custom_fields.field_type")}</InputLabel>
            <Select
              label={t("custom_fields.field_type")}
              value={form.field_type}
              onChange={(e) => updateField("field_type", e.target.value)}
            >
              {FIELD_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>{t("custom_fields.field_entity_type")}</InputLabel>
            <Select
              label={t("custom_fields.field_entity_type")}
              value={form.entity_type}
              onChange={(e) => updateField("entity_type", e.target.value)}
            >
              {ENTITY_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {form.field_type === "select" && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                {t("custom_fields.field_options")}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={t("custom_fields.option_placeholder")}
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={handleOptionKeyDown}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddOption}
                  disabled={!optionInput.trim()}
                >
                  {t("custom_fields.add_option")}
                </Button>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {form.options.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    size="small"
                    onDelete={() => handleRemoveOption(option)}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Divider />

          <TextField
            label={t("custom_fields.field_sort_order")}
            size="small"
            type="number"
            fullWidth
            value={form.sort_order}
            onChange={(e) => updateField("sort_order", e.target.value)}
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.required}
                onChange={(e) => updateField("required", e.target.checked)}
                size="small"
              />
            }
            label={t("custom_fields.field_required")}
          />

          {isEdit && (
            <FormControlLabel
              control={
                <Switch
                  checked={form.active}
                  onChange={(e) => updateField("active", e.target.checked)}
                  size="small"
                />
              }
              label={t("custom_fields.field_active")}
            />
          )}
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
            {t("custom_fields.form_cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth
            disabled={loading || !hasRequiredFields}
          >
            {loading
              ? t("custom_fields.form_saving")
              : isEdit
                ? t("custom_fields.form_save_changes")
                : t("custom_fields.form_create")}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
