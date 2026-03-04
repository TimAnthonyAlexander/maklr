import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import {
  Box,
  Typography,
  Button,
  Paper,
  TablePagination,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  useGetDocumentList,
  usePostDocumentCreate,
  useDeleteDocumentById,
} from "../api/hooks";
import type { DocumentListQueryParams, Document } from "../api/types";
import { useAuth } from "../contexts/AuthContext";
import { DocumentFilters } from "../components/documents/DocumentFilters";
import { DocumentListTable } from "../components/documents/DocumentListTable";
import { DocumentUploadDialog } from "../components/documents/DocumentUploadDialog";
import { DocumentDeleteDialog } from "../components/documents/DocumentDeleteDialog";

function parseFiltersFromParams(
  params: URLSearchParams,
): DocumentListQueryParams {
  return {
    q: params.get("q") ?? undefined,
    category: params.get("category") ?? undefined,
    page: params.has("page") ? Number(params.get("page")) : 1,
    per_page: params.has("per_page") ? Number(params.get("per_page")) : 25,
  };
}

function filtersToParams(
  filters: DocumentListQueryParams,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (filters.q) result.q = filters.q;
  if (filters.category) result.category = filters.category;
  if (filters.page && filters.page > 1) result.page = String(filters.page);
  if (filters.per_page && filters.per_page !== 25)
    result.per_page = String(filters.per_page);
  return result;
}

export function DocumentsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);

  const canDelete = user?.role === "admin" || user?.role === "manager";

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams],
  );
  const { data, loading, error, refetch } = useGetDocumentList(filters);
  const uploadMutation = usePostDocumentCreate();
  const deleteMutation = useDeleteDocumentById();

  const documents = data?.items ?? [];
  const pagination = data?.pagination;

  const handleFilterChange = useCallback(
    (newFilters: DocumentListQueryParams) => {
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

  const handleUpload = useCallback(
    async (formData: FormData) => {
      await uploadMutation.mutate({ formData });
      setUploadOpen(false);
      refetch();
    },
    [uploadMutation, refetch],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteMutation.mutate({ path: { id: deleteTarget.id } });
      setDeleteTarget(null);
      refetch();
    } catch {
      // Error captured by mutation hook
    }
  }, [deleteTarget, deleteMutation, refetch]);

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Documents
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setUploadOpen(true)}
        >
          Upload
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <DocumentFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <Paper variant="outlined">
        <DocumentListTable
          documents={documents}
          loading={loading}
          canDelete={canDelete}
          onDeleteClick={setDeleteTarget}
        />

        {pagination && (
          <TablePagination
            component="div"
            count={pagination.total}
            page={(pagination.page ?? 1) - 1}
            onPageChange={handlePageChange}
            rowsPerPage={pagination.per_page ?? 25}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 25, 50]}
          />
        )}
      </Paper>

      <DocumentUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
        loading={uploadMutation.loading}
      />

      <DocumentDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.loading}
        fileName={deleteTarget?.file_name ?? ""}
      />
    </Box>
  );
}
