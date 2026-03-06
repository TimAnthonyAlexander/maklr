import { useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Box,
  Checkbox,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  Alert,
} from "@mui/material";
import { Plus, Building2 } from "lucide-react";
import { useGetEstateList } from "../api/hooks";
import type { EstateListQueryParams } from "../api/types";
import { EstateStatusChip } from "../components/estates/EstateStatusChip";
import { EstateFilters } from "../components/estates/EstateFilters";
import { EstateForm } from "../components/estates/EstateForm";
import { EstateBulkActionToolbar } from "../components/estates/EstateBulkActionToolbar";
import { useTranslation } from "../contexts/LanguageContext";

const priceFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function parseFiltersFromParams(
  params: URLSearchParams,
): EstateListQueryParams {
  return {
    q: params.get("q") ?? undefined,
    status: params.get("status") ?? undefined,
    property_type: params.get("property_type") ?? undefined,
    marketing_type: params.get("marketing_type") ?? undefined,
    page: params.has("page") ? Number(params.get("page")) : 1,
    per_page: params.has("per_page") ? Number(params.get("per_page")) : 25,
  };
}

function filtersToParams(
  filters: EstateListQueryParams,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (filters.q) result.q = filters.q;
  if (filters.status) result.status = filters.status;
  if (filters.property_type) result.property_type = filters.property_type;
  if (filters.marketing_type) result.marketing_type = filters.marketing_type;
  if (filters.page && filters.page > 1) result.page = String(filters.page);
  if (filters.per_page && filters.per_page !== 25)
    result.per_page = String(filters.per_page);
  return result;
}

const PROPERTY_TYPE_KEYS: Record<string, string> = {
  apartment: "estate.property_type_apartment",
  house: "estate.property_type_house",
  commercial: "estate.property_type_commercial",
  land: "estate.property_type_land",
  garage: "estate.property_type_garage",
};

const MARKETING_TYPE_KEYS: Record<string, string> = {
  sale: "estate.marketing_type_sale",
  rent: "estate.marketing_type_rent",
  lease: "estate.marketing_type_lease",
};

export function EstatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams],
  );
  const { data, loading, error, refetch } = useGetEstateList(filters);

  const estates = useMemo(() => data?.items ?? [], [data?.items]);
  const pagination = data?.pagination;

  const handleFilterChange = useCallback(
    (newFilters: EstateListQueryParams) => {
      setSelectedIds(new Set());
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
      navigate(`/estates/${id}`);
    },
    [navigate],
  );

  const handleFormSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === estates.length && estates.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(
        new Set(estates.map((e) => e.id).filter(Boolean) as string[]),
      );
    }
  }, [estates, selectedIds.size]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkActionComplete = useCallback(() => {
    refetch();
  }, [refetch]);

  const allSelected = estates.length > 0 && selectedIds.size === estates.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

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
          {t("estate.page_title")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setFormOpen(true)}
        >
          {t("estate.add_estate")}
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <EstateFilters filters={filters} onFilterChange={handleFilterChange} />
      </Box>

      {/* Bulk Action Toolbar */}
      <EstateBulkActionToolbar
        selectedIds={Array.from(selectedIds)}
        onClearSelection={handleClearSelection}
        onActionComplete={handleBulkActionComplete}
      />

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {/* Table */}
      <Paper variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={someSelected}
                    checked={allSelected}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>{t("estate.col_title")}</TableCell>
                <TableCell>{t("estate.col_type")}</TableCell>
                <TableCell>{t("estate.col_marketing")}</TableCell>
                <TableCell>{t("estate.col_status")}</TableCell>
                <TableCell>{t("estate.col_city")}</TableCell>
                <TableCell align="right">{t("estate.col_price")}</TableCell>
                <TableCell>{t("estate.col_created")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading && estates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        py: 6,
                        color: "text.secondary",
                      }}
                    >
                      <Building2
                        size={48}
                        style={{ marginBottom: 8, opacity: 0.5 }}
                      />
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        {t("estate.no_estates_yet")}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<Plus size={18} />}
                        onClick={() => setFormOpen(true)}
                      >
                        {t("estate.add_first_estate")}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                estates.map((estate) => (
                  <TableRow
                    key={estate.id}
                    hover
                    selected={!!estate.id && selectedIds.has(estate.id)}
                    onClick={() => estate.id && handleRowClick(estate.id)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={!!estate.id && selectedIds.has(estate.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => estate.id && handleSelectOne(estate.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {estate.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {PROPERTY_TYPE_KEYS[estate.property_type ?? ""]
                        ? t(PROPERTY_TYPE_KEYS[estate.property_type ?? ""])
                        : estate.property_type}
                    </TableCell>
                    <TableCell>
                      {MARKETING_TYPE_KEYS[estate.marketing_type ?? ""]
                        ? t(MARKETING_TYPE_KEYS[estate.marketing_type ?? ""])
                        : estate.marketing_type}
                    </TableCell>
                    <TableCell>
                      <EstateStatusChip status={estate.status ?? "draft"} />
                    </TableCell>
                    <TableCell>{estate.city ?? "\u2014"}</TableCell>
                    <TableCell align="right">
                      {estate.price != null
                        ? priceFormatter.format(estate.price)
                        : "\u2014"}
                    </TableCell>
                    <TableCell>
                      {estate.created_at
                        ? dateFormatter.format(new Date(estate.created_at))
                        : "\u2014"}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

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

      {/* Create Form Drawer */}
      <EstateForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </Box>
  );
}
