import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { Box, Typography, Button, Alert, TablePagination } from "@mui/material";
import { Plus } from "lucide-react";
import { useGetActivityList } from "../api/hooks";
import type { ActivityListQueryParams } from "../api/types";
import { ActivityFilters } from "../components/activity/ActivityFilters";
import { ActivityTimeline } from "../components/activity/ActivityTimeline";
import { ActivityCreateDialog } from "../components/activity/ActivityCreateDialog";
import { useTranslation } from "../contexts/LanguageContext";

function parseFiltersFromParams(
  params: URLSearchParams,
): ActivityListQueryParams {
  return {
    q: params.get("q") ?? undefined,
    type: params.get("type") ?? undefined,
    date_from: params.get("date_from") ?? undefined,
    date_to: params.get("date_to") ?? undefined,
    estate_id: params.get("estate_id") ?? undefined,
    contact_id: params.get("contact_id") ?? undefined,
    user_id: params.get("user_id") ?? undefined,
    page: params.has("page") ? Number(params.get("page")) : 1,
    per_page: params.has("per_page") ? Number(params.get("per_page")) : 25,
  };
}

function filtersToParams(
  filters: ActivityListQueryParams,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (filters.q) result.q = filters.q;
  if (filters.type) result.type = filters.type;
  if (filters.date_from) result.date_from = filters.date_from;
  if (filters.date_to) result.date_to = filters.date_to;
  if (filters.estate_id) result.estate_id = filters.estate_id;
  if (filters.contact_id) result.contact_id = filters.contact_id;
  if (filters.user_id) result.user_id = filters.user_id;
  if (filters.page && filters.page > 1) result.page = String(filters.page);
  if (filters.per_page && filters.per_page !== 25)
    result.per_page = String(filters.per_page);
  return result;
}

export function ActivityLogPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams],
  );
  const { data, loading, error, refetch } = useGetActivityList(filters);

  const activities = data?.items ?? [];
  const pagination = data?.pagination;

  const handleFilterChange = useCallback(
    (newFilters: ActivityListQueryParams) => {
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

  const handleCreateSuccess = useCallback(() => {
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
          {t("activity.page.title")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setDialogOpen(true)}
        >
          {t("activity.page.add_activity")}
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <ActivityFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {/* Timeline */}
      <ActivityTimeline activities={activities} loading={loading} />

      {/* Pagination */}
      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={(filters.page ?? 1) - 1}
          onPageChange={handlePageChange}
          rowsPerPage={filters.per_page ?? 25}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50]}
        />
      )}

      {/* Create Dialog */}
      <ActivityCreateDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </Box>
  );
}
