import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";

interface TaskDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  taskTitle: string;
}

export function TaskDeleteDialog({
  open,
  onClose,
  onConfirm,
  loading,
  taskTitle,
}: TaskDeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("tasks.delete.title")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t("tasks.delete.message", { title: taskTitle })}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {t("tasks.delete.cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading ? t("tasks.delete.deleting") : t("tasks.delete.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
