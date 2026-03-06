import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  Paper,
  Skeleton,
  Alert,
  Grid,
  IconButton,
  Chip,
} from "@mui/material";
import { ArrowLeft, Pencil, UserX } from "lucide-react";
import {
  useGetUserShowById,
  usePatchUserUpdateById,
} from "../api/hooks";
import type { User } from "../api/types";
import { useAuth } from "../contexts/AuthContext";
import { UserRoleChip } from "../components/users/UserRoleChip";
import { UserForm } from "../components/users/UserForm";
import { UserDeleteDialog } from "../components/users/UserDeleteDialog";
import { EntityActivityTimeline } from "../components/activity/ActivityTimeline";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

interface MetricProps {
  label: string;
  value: string | number | null | undefined;
}

function Metric({ label, value }: MetricProps) {
  const isEmpty = value == null || value === "";
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontWeight: 500,
          color: isEmpty ? "text.disabled" : "text.primary",
        }}
      >
        {isEmpty ? "\u2014" : value}
      </Typography>
    </Box>
  );
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const { data, loading, error, refetch } = useGetUserShowById(
    { id: id ?? "" },
    { enabled: !!id },
  );
  const deactivateMutation = usePatchUserUpdateById();

  const user = data ?? null;

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canDeactivate =
    (authUser?.role === "admin" || authUser?.role === "manager") &&
    authUser?.id !== id;

  const handleDeactivate = useCallback(async () => {
    if (!id) return;
    try {
      await deactivateMutation.mutate({
        path: { id },
        body: { active: false },
      });
      navigate("/users");
    } catch {
      // Error captured by mutation hook
    }
  }, [id, deactivateMutation, navigate]);

  const handleFormSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton
          variant="rectangular"
          height={300}
          sx={{ mt: 2, borderRadius: 2 }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error.message}</Alert>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">User not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Back */}
      <Button
        startIcon={<ArrowLeft size={18} />}
        onClick={() => navigate("/users")}
        sx={{ mb: 2 }}
      >
        Users
      </Button>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {user.name || user.email || "Unnamed User"}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <UserRoleChip role={user.role ?? "guest"} />
            <Chip
              label={user.active ? "Active" : "Inactive"}
              size="small"
              color={user.active ? "success" : "default"}
              variant={user.active ? "filled" : "outlined"}
              sx={{ fontWeight: 500, fontSize: "0.75rem" }}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton size="small" onClick={() => setFormOpen(true)}>
            <Pencil size={20} />
          </IconButton>
          {canDeactivate && user.active && (
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteOpen(true)}
            >
              <UserX size={20} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Main content + Sidebar */}
      <Grid container spacing={3}>
        {/* Main content */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              User Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Metric label="Name" value={user.name} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Metric label="Email" value={user.email} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Metric label="Phone" value={user.phone} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Metric label="Office ID" value={user.office_id} />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box
            sx={{
              position: "sticky",
              top: 24,
              alignSelf: "flex-start",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {/* Details */}
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Details
              </Typography>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Role
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <UserRoleChip role={user.role ?? "guest"} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={user.active ? "Active" : "Inactive"}
                      size="small"
                      color={user.active ? "success" : "default"}
                      variant={user.active ? "filled" : "outlined"}
                    />
                  </Box>
                </Box>
                {user.created_at && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {dateFormatter.format(new Date(user.created_at))}
                    </Typography>
                  </Box>
                )}
                {user.updated_at && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Updated
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {dateFormatter.format(new Date(user.updated_at))}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Activity */}
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Activity
              </Typography>
              {id && (
                <EntityActivityTimeline entityType="user" entityId={id} />
              )}
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Edit drawer */}
      <UserForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        user={user}
        onSuccess={handleFormSuccess}
      />

      {/* Deactivate dialog */}
      <UserDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeactivate}
        loading={deactivateMutation.loading}
        userName={user.name || user.email || "this user"}
      />
    </Box>
  );
}
