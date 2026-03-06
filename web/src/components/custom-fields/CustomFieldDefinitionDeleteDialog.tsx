import { useCallback, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from "@mui/material";
import type { CustomFieldDefinition } from "../../api/types";
import { useDeleteCustomFieldDefinitionById } from "../../api/hooks";
import { useTranslation } from "../../contexts/LanguageContext";

interface CustomFieldDefinitionDeleteDialogProps {
  definition: CustomFieldDefinition | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CustomFieldDefinitionDeleteDialog({
  definition,
  onClose,
  onSuccess,
}: CustomFieldDefinitionDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteCustomFieldDefinitionById();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = useCallback(async () => {
    if (!definition?.id) return;
    setError(null);

    try {
      await deleteMutation.mutate({ path: { id: definition.id } });
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    }
  }, [definition, deleteMutation, onSuccess]);

  return (
    <Dialog open={definition != null} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("custom_fields.delete_title")}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography>
          {t("custom_fields.delete_confirm", {
            name: definition?.label ?? definition?.name ?? "",
          })}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t("custom_fields.delete_note")}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleteMutation.loading}>
          {t("custom_fields.form_cancel")}
        </Button>
        <Button
          onClick={handleDelete}
          color="error"
          variant="contained"
          disabled={deleteMutation.loading}
        >
          {deleteMutation.loading
            ? t("custom_fields.deleting")
            : t("custom_fields.delete_button")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
