import { useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Box,
  Typography,
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
  MenuItem,
  TextField,
} from "@mui/material";
import { Workflow } from "lucide-react";
import { useGetProcessInstanceList } from "../api/hooks";
import { ProcessStatusBadge } from "../components/processes/ProcessStatusBadge";
import { useTranslation } from "../contexts/LanguageContext";

export function ProcessInstancesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(
    () => ({
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      per_page: searchParams.get("per_page")
        ? Number(searchParams.get("per_page"))
        : undefined,
    }),
    [searchParams],
  );

  const { data, loading, error } = useGetProcessInstanceList(query);
  const items = data?.items ?? [];
  const pagination = data?.pagination;

  const handleStatusFilter = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("status", value);
      } else {
        params.delete("status");
      }
      params.delete("page");
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const handlePageChange = useCallback(
    (_: unknown, newPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(newPage + 1));
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const handleRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const params = new URLSearchParams(searchParams);
      params.set("per_page", e.target.value);
      params.delete("page");
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          {t("processes.instances")}
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          select
          size="small"
          value={searchParams.get("status") || ""}
          onChange={(e) => handleStatusFilter(e.target.value)}
          sx={{ width: 200 }}
          label={t("processes.col_status")}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="running">{t("processes.status.running")}</MenuItem>
          <MenuItem value="paused">{t("processes.status.paused")}</MenuItem>
          <MenuItem value="completed">{t("processes.status.completed")}</MenuItem>
          <MenuItem value="cancelled">{t("processes.status.cancelled")}</MenuItem>
          <MenuItem value="failed">{t("processes.status.failed")}</MenuItem>
        </TextField>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <Paper variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("processes.col_template")}</TableCell>
                <TableCell>{t("processes.col_entity_type")}</TableCell>
                <TableCell>{t("processes.col_status")}</TableCell>
                <TableCell>{t("processes.col_current_step")}</TableCell>
                <TableCell>{t("processes.col_started")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: "center", py: 6 }}>
                    <Workflow
                      size={40}
                      strokeWidth={1}
                      style={{ opacity: 0.3, marginBottom: 8 }}
                    />
                    <Typography color="text.secondary">
                      {t("processes.empty_instances")}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                items.map((instance) => (
                  <TableRow
                    key={instance.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate(`/process-instances/${instance.id}`)}
                  >
                    <TableCell>
                      <Typography fontWeight={500}>
                        {instance.template?.name ?? "\u2014"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                        {instance.entity_type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <ProcessStatusBadge status={instance.status} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {instance.current_step_key ?? "\u2014"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {instance.started_at
                        ? new Date(instance.started_at).toLocaleString()
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
            rowsPerPage={pagination.per_page ?? 20}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 25, 50]}
          />
        )}
      </Paper>
    </Box>
  );
}
