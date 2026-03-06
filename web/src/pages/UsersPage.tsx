import { useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Box, Typography, Button, Alert } from "@mui/material";
import { Plus, UserPlus } from "lucide-react";
import { useGetUserList } from "../api/hooks";
import type { UserListQueryParams } from "../api/types";
import { UserFilters } from "../components/users/UserFilters";
import { UserListView } from "../components/users/UserListView";
import { UserForm } from "../components/users/UserForm";
import { InviteUserDialog } from "../components/users/InviteUserDialog";

function parseFiltersFromParams(
  params: URLSearchParams,
): UserListQueryParams {
  return {
    q: params.get("q") ?? undefined,
    role: params.get("role") ?? undefined,
    active: params.get("active") ?? "1",
    page: params.has("page") ? Number(params.get("page")) : 1,
    per_page: params.has("per_page") ? Number(params.get("per_page")) : 25,
  };
}

function filtersToParams(
  filters: UserListQueryParams,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (filters.q) result.q = filters.q;
  if (filters.role) result.role = filters.role;
  if (filters.active && filters.active !== "1") result.active = filters.active;
  if (filters.page && filters.page > 1) result.page = String(filters.page);
  if (filters.per_page && filters.per_page !== 25)
    result.per_page = String(filters.per_page);
  return result;
}

export function UsersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams],
  );
  const { data, loading, error, refetch } = useGetUserList(filters);

  const users = data?.items ?? [];
  const pagination = data?.pagination;

  const handleFilterChange = useCallback(
    (newFilters: UserListQueryParams) => {
      setSearchParams(filtersToParams(newFilters));
    },
    [setSearchParams],
  );

  const handlePageChange = useCallback(
    (_: unknown, newPage: number) => {
      handleFilterChange({ ...filters, page: newPage + 1 });
    },
    [filters, handleFilterChange],
  );

  const handleRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFilterChange({
        ...filters,
        per_page: parseInt(e.target.value, 10),
        page: 1,
      });
    },
    [filters, handleFilterChange],
  );

  const handleRowClick = useCallback(
    (id: string) => {
      navigate(`/users/${id}`);
    },
    [navigate],
  );

  const handleFormSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Users
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<UserPlus size={18} />}
            onClick={() => setInviteOpen(true)}
          >
            Invite
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => setFormOpen(true)}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <UserFilters filters={filters} onFilterChange={handleFilterChange} />
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {/* Table */}
      <UserListView
        users={users}
        pagination={pagination}
        loading={loading}
        onRowClick={handleRowClick}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onAddClick={() => setFormOpen(true)}
      />

      {/* Create Form Drawer */}
      <UserForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Invite Dialog */}
      <InviteUserDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </Box>
  );
}
