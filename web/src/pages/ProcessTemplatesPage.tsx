import { useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Box,
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
  TextField,
  InputAdornment,
  Skeleton,
  Alert,
  Chip,
} from "@mui/material";
import { Plus, Search, Workflow } from "lucide-react";
import { useGetProcessTemplateList } from "../api/hooks";
import { useTranslation } from "../contexts/LanguageContext";

const TRIGGER_KEYS: Record<string, string> = {
  manual: "processes.trigger.manual",
  status_change: "processes.trigger.status_change",
  field_change: "processes.trigger.field_change",
  date_field: "processes.trigger.date_field",
};

const ENTITY_KEYS: Record<string, string> = {
  estate: "processes.entity.estate",
  contact: "processes.entity.contact",
};

export function ProcessTemplatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(
    () => ({
      q: searchParams.get("q") ?? undefined,
      entity_type: searchParams.get("entity_type") ?? undefined,
      active: searchParams.get("active") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      per_page: searchParams.get("per_page")
        ? Number(searchParams.get("per_page"))
        : undefined,
    }),
    [searchParams],
  );

  const { data, loading, error } = useGetProcessTemplateList(query);
  const items = data?.items ?? [];
  const pagination = data?.pagination;

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
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
          {t("processes.templates")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => navigate("/processes/new")}
        >
          {t("processes.add_template")}
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder={t("processes.search_placeholder")}
          value={searchParams.get("q") || ""}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ width: 300 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            },
          }}
        />
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
                <TableCell>{t("processes.col_name")}</TableCell>
                <TableCell>{t("processes.col_entity_type")}</TableCell>
                <TableCell>{t("processes.col_trigger")}</TableCell>
                <TableCell>{t("processes.col_active")}</TableCell>
                <TableCell>{t("processes.col_created")}</TableCell>
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
                      {t("processes.empty_templates")}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Plus size={18} />}
                      onClick={() => navigate("/processes/new")}
                      sx={{ mt: 2 }}
                    >
                      {t("processes.add_template")}
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                items.map((template) => (
                  <TableRow
                    key={template.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate(`/processes/${template.id}/edit`)}
                  >
                    <TableCell>
                      <Typography fontWeight={500}>{template.name}</Typography>
                      {template.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 300,
                          }}
                        >
                          {template.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(ENTITY_KEYS[template.entity_type] ?? template.entity_type)}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500, fontSize: "0.75rem" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {t(TRIGGER_KEYS[template.trigger_type] ?? template.trigger_type)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          template.active
                            ? t("processes.active")
                            : t("processes.inactive")
                        }
                        color={template.active ? "success" : "default"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {template.created_at
                        ? new Date(template.created_at).toLocaleDateString()
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
