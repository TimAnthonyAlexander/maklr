import { useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Box, Typography, Button, Alert } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useGetContactList } from "../api/hooks";
import type { ContactListQueryParams } from "../api/types";
import { ContactFilters } from "../components/contacts/ContactFilters";
import { ContactListView } from "../components/contacts/ContactListView";
import { ContactForm } from "../components/contacts/ContactForm";

function parseFiltersFromParams(
  params: URLSearchParams,
): ContactListQueryParams {
  return {
    q: params.get("q") ?? undefined,
    type: params.get("type") ?? undefined,
    entity_type: params.get("entity_type") ?? undefined,
    stage: params.get("stage") ?? undefined,
    page: params.has("page") ? Number(params.get("page")) : 1,
    per_page: params.has("per_page") ? Number(params.get("per_page")) : 25,
  };
}

function filtersToParams(
  filters: ContactListQueryParams,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (filters.q) result.q = filters.q;
  if (filters.type) result.type = filters.type;
  if (filters.entity_type) result.entity_type = filters.entity_type;
  if (filters.stage) result.stage = filters.stage;
  if (filters.page && filters.page > 1) result.page = String(filters.page);
  if (filters.per_page && filters.per_page !== 25)
    result.per_page = String(filters.per_page);
  return result;
}

export function ContactsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams],
  );
  const { data, loading, error, refetch } = useGetContactList(filters);

  const contacts = data?.items ?? [];
  const pagination = data?.pagination;

  const handleFilterChange = useCallback(
    (newFilters: ContactListQueryParams) => {
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
      navigate(`/contacts/${id}`);
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
          Contacts
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
        >
          Add Contact
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <ContactFilters filters={filters} onFilterChange={handleFilterChange} />
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {/* Table */}
      <ContactListView
        contacts={contacts}
        pagination={pagination}
        loading={loading}
        onRowClick={handleRowClick}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onAddClick={() => setFormOpen(true)}
      />

      {/* Create Form Drawer */}
      <ContactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </Box>
  );
}
