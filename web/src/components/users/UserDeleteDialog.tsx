import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

interface UserDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  userName: string;
}

export function UserDeleteDialog({
  open,
  onClose,
  onConfirm,
  loading,
  userName,
}: UserDeleteDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Deactivate this user?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          &quot;{userName}&quot; will be deactivated and will no longer be able
          to log in. This can be reversed by reactivating the user.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading ? "Deactivating..." : "Deactivate"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
