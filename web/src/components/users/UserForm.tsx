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
} from "@mui/material";
import { X } from "lucide-react";
import type {
  User,
  PostUserCreateRequestBody,
  PatchUserUpdateByIdRequestBody,
} from "../../api/types";
import { usePostUserCreate, usePatchUserUpdateById } from "../../api/hooks";
import { useAuth } from "../../contexts/AuthContext";

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  active: boolean;
}

function userToFormState(user?: User | null): FormState {
  return {
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "agent",
    phone: user?.phone ?? "",
    active: user?.active ?? true,
  };
}

function formStateToCreateBody(form: FormState): PostUserCreateRequestBody {
  const strOrNull = (v: string) => (v === "" ? null : v);

  return {
    name: form.name,
    email: form.email,
    password: form.password,
    role: form.role,
    phone: strOrNull(form.phone),
  };
}

function computeDiff(
  original: FormState,
  current: FormState,
): PatchUserUpdateByIdRequestBody {
  const diff: Record<string, unknown> = {};

  if (current.name !== original.name) diff.name = current.name;
  if (current.email !== original.email) diff.email = current.email;
  if (current.password !== "") diff.password = current.password;
  if (current.role !== original.role) diff.role = current.role;

  const phoneVal = current.phone === "" ? null : current.phone;
  const origPhoneVal = original.phone === "" ? null : original.phone;
  if (phoneVal !== origPhoneVal) diff.phone = phoneVal;

  // active is handled via the "deactivate" dialog, not the form
  // But we include it for admin toggling
  if (current.active !== original.active) {
    diff.active = current.active;
  }

  return diff as PatchUserUpdateByIdRequestBody;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "agent", label: "Agent" },
  { value: "readonly", label: "Read-only" },
];

export function UserForm({ open, onClose, user, onSuccess }: UserFormProps) {
  const isEdit = user != null;
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === "admin";
  const initialState = useMemo(() => userToFormState(user), [user]);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = usePostUserCreate();
  const updateMutation = usePatchUserUpdateById();

  const loading = createMutation.loading || updateMutation.loading;

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const hasRequiredFields = isEdit
    ? form.name && form.email
    : form.name && form.email && form.password;

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);

    try {
      if (isEdit && user?.id) {
        const diff = computeDiff(initialState, form);
        if (Object.keys(diff).length === 0) {
          onClose();
          return;
        }
        await updateMutation.mutate({
          path: { id: user.id },
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
    user,
    initialState,
    form,
    updateMutation,
    createMutation,
    onSuccess,
    onClose,
  ]);

  const handleEntered = useCallback(() => {
    setForm(userToFormState(user));
    setSubmitError(null);
  }, [user]);

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
            {isEdit ? "Edit User" : "New User"}
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
            label="Name"
            size="small"
            required
            fullWidth
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
          />

          <TextField
            label="Email"
            size="small"
            required
            fullWidth
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />

          <TextField
            label={isEdit ? "New Password (leave blank to keep)" : "Password"}
            size="small"
            required={!isEdit}
            fullWidth
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
          />

          <Divider />

          {isAdmin && (
            <FormControl size="small" fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={form.role}
                onChange={(e) => updateField("role", e.target.value)}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            label="Phone"
            size="small"
            fullWidth
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />

          {isEdit && isAdmin && (
            <FormControlLabel
              control={
                <Switch
                  checked={form.active}
                  onChange={(e) => updateField("active", e.target.checked)}
                  size="small"
                />
              }
              label="Active"
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
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth
            disabled={loading || !hasRequiredFields}
          >
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Create User"}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
