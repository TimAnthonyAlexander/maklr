import { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import { Copy } from "lucide-react";
import { postInvitation } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";

interface InviteUserDialogProps {
  open: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS = [
  { value: "agent", label: "Agent" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

export function InviteUserDialog({ open, onClose }: InviteUserDialogProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("agent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resetForm = useCallback(() => {
    setEmail("");
    setRole("agent");
    setError(null);
    setInviteUrl(null);
    setCopied(false);
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!user?.office_id) {
      setError("No office associated with your account");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await postInvitation(user.office_id, { email, role });
      setInviteUrl(result.invite_url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create invitation",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.office_id, email, role]);

  const handleCopy = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [inviteUrl]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Invite User</DialogTitle>
      <DialogContent>
        {inviteUrl ? (
          <Box sx={{ pt: 1 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Invitation sent to {email}
            </Alert>
            <Typography variant="caption" color="text.secondary">
              Invite link (expires in 7 days)
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 0.5,
                p: 1.5,
                bgcolor: "action.hover",
                borderRadius: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                }}
              >
                {inviteUrl}
              </Typography>
              <IconButton size="small" onClick={handleCopy}>
                <Copy size={20} />
              </IconButton>
            </Box>
            {copied && (
              <Typography
                variant="caption"
                color="success.main"
                sx={{ mt: 0.5, display: "block" }}
              >
                Copied to clipboard
              </Typography>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              pt: 1,
            }}
          >
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Email"
              type="email"
              size="small"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {inviteUrl ? (
          <Button onClick={handleClose} variant="contained">
            Done
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading || !email}
            >
              {loading ? "Sending..." : "Send Invite"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
