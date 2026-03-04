import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import {
  Box,
  Typography,
  Alert,
  TablePagination,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
} from "@mui/material";
import { useGetAuditLogList } from "../api/hooks";
import type { AuditLogListQueryParams, AuditLog } from "../api/types";

const ACTION_COLORS: Record<string, "success" | "warning" | "error" | "info"> =
  {
    created: "success",
    updated: "warning",
    deleted: "error",
  };

const ENTITY_TYPES = [
  "appointment",
  "contact",
  "document",
  "email_account",
  "email_template",
  "estate",
  "office",
  "task",
  "user",
];

const ACTIONS = ["created", "updated", "deleted"];

function parseFiltersFromParams(
  params: URLSearchParams,
): AuditLogListQueryParams {
  return {
    entity_type: params.get("entity_type") ?? undefined,
    entity_id: params.get("entity_id") ?? undefined,
    action: params.get("action") ?? undefined,
    user_id: params.get("user_id") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    page: params.has("page") ? Number(params.get("page")) : 1,
    per_page: params.has("per_page") ? Number(params.get("per_page")) : 25,
  };
}

function filtersToParams(
  filters: AuditLogListQueryParams,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (filters.entity_type) result.entity_type = filters.entity_type;
  if (filters.entity_id) result.entity_id = filters.entity_id;
  if (filters.action) result.action = filters.action;
  if (filters.user_id) result.user_id = filters.user_id;
  if (filters.from) result.from = filters.from;
  if (filters.to) result.to = filters.to;
  if (filters.page && filters.page > 1) result.page = String(filters.page);
  if (filters.per_page && filters.per_page !== 25)
    result.per_page = String(filters.per_page);
  return result;
}

function formatChanges(
  changes?: Record<string, { old: unknown; new: unknown }>,
): string {
  if (!changes || Object.keys(changes).length === 0) return "\u2014";
  return Object.keys(changes).join(", ");
}

function formatTimestamp(ts?: string | null): string {
  if (!ts) return "\u2014";
  const d = new Date(ts.replace(" ", "T"));
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TableSkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 6 }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton variant="text" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function AuditLogRow({ entry }: { entry: AuditLog }) {
  return (
    <TableRow hover>
      <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>
        {formatTimestamp(entry.created_at)}
      </TableCell>
      <TableCell sx={{ fontSize: "0.8rem" }}>
        {entry.user?.name ?? entry.user_id ?? "\u2014"}
      </TableCell>
      <TableCell>
        <Chip
          label={entry.action}
          size="small"
          color={ACTION_COLORS[entry.action ?? ""] ?? "default"}
          variant="outlined"
          sx={{ fontWeight: 500, fontSize: "0.75rem" }}
        />
      </TableCell>
      <TableCell sx={{ fontSize: "0.8rem" }}>{entry.entity_type}</TableCell>
      <TableCell
        sx={{
          fontSize: "0.75rem",
          fontFamily: "monospace",
          maxWidth: 120,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {entry.entity_id?.substring(0, 8) ?? "\u2014"}
      </TableCell>
      <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
        {formatChanges(entry.changes)}
      </TableCell>
    </TableRow>
  );
}

export function AuditLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams],
  );
  const { data, loading, error } = useGetAuditLogList(filters);

  const entries = data?.items ?? [];
  const pagination = data?.pagination;

  const handleFilterChange = useCallback(
    (newFilters: AuditLogListQueryParams) => {
      setSearchParams(filtersToParams(newFilters));
    },
    [setSearchParams],
  );

  const [localFrom, setLocalFrom] = useState(filters.from ?? "");
  const [localTo, setLocalTo] = useState(filters.to ?? "");

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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Audit Log
      </Typography>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Entity Type</InputLabel>
          <Select
            label="Entity Type"
            value={filters.entity_type ?? ""}
            onChange={(e) =>
              handleFilterChange({
                ...filters,
                entity_type: e.target.value || undefined,
                page: 1,
              })
            }
          >
            <MenuItem value="">All</MenuItem>
            {ENTITY_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t.replace("_", " ")}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Action</InputLabel>
          <Select
            label="Action"
            value={filters.action ?? ""}
            onChange={(e) =>
              handleFilterChange({
                ...filters,
                action: e.target.value || undefined,
                page: 1,
              })
            }
          >
            <MenuItem value="">All</MenuItem>
            {ACTIONS.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          type="date"
          label="From"
          value={localFrom}
          onChange={(e) => setLocalFrom(e.target.value)}
          onBlur={() =>
            handleFilterChange({
              ...filters,
              from: localFrom || undefined,
              page: 1,
            })
          }
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 160 }}
        />

        <TextField
          size="small"
          type="date"
          label="To"
          value={localTo}
          onChange={(e) => setLocalTo(e.target.value)}
          onBlur={() =>
            handleFilterChange({
              ...filters,
              to: localTo || undefined,
              page: 1,
            })
          }
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 160 }}
        />
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {/* Table */}
      <TableContainer
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Entity Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Entity ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Changed Fields</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && entries.length === 0 ? (
              <TableSkeletonRows count={5} />
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No audit log entries found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <AuditLogRow key={entry.id} entry={entry} />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
    </Box>
  );
}
