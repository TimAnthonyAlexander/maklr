import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";

interface PortalDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  portalName: string;
}

export function PortalDeleteDialog({
  open,
  onClose,
  onConfirm,
  loading,
  portalName,
}: PortalDeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("portal.delete_title")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t("portal.delete_description", { name: portalName })}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {t("portal.delete_cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading ? t("portal.delete_loading") : t("portal.delete_confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
