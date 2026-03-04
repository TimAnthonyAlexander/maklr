import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";

interface EmailAccountDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  accountName: string;
}

export function EmailAccountDeleteDialog({
  open,
  onClose,
  onConfirm,
  loading,
  accountName,
}: EmailAccountDeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("email.deactivate_title")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t("email.deactivate_message", { name: accountName })}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {t("email.cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading ? t("email.deactivating") : t("email.deactivate")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
