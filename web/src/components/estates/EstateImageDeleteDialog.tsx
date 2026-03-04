import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";

interface EstateImageDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  imageName: string;
}

export function EstateImageDeleteDialog({
  open,
  onClose,
  onConfirm,
  loading,
  imageName,
}: EstateImageDeleteDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("estate.delete_image_title")}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          {t("estate.delete_image_confirm_text", { name: imageName })}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {t("estate.delete_image_cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading
            ? t("estate.delete_image_loading")
            : t("estate.delete_image_confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
