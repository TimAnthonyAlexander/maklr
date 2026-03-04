import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";

interface EstateDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  estateTitle: string;
}

export function EstateDeleteDialog({
  open,
  onClose,
  onConfirm,
  loading,
  estateTitle,
}: EstateDeleteDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("estate.archive_title")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t("estate.archive_description", { title: estateTitle })}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {t("estate.archive_cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading
            ? t("estate.archive_loading")
            : t("estate.archive_confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
