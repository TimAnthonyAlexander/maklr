import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
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
  Chip,
  Skeleton,
  Alert,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  useGetEmailTemplateList,
  useDeleteEmailTemplateById,
} from "../api/hooks";
import type {
  EmailTemplate,
  EmailTemplateListQueryParams,
} from "../api/types";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/LanguageContext";
import { EmailTemplateFormDrawer } from "../components/email-templates/EmailTemplateFormDrawer";

const SCOPE_TABS = ["all", "office", "personal"] as const;

function parseFiltersFromParams(
  params: URLSearchParams,
): EmailTemplateListQueryParams {
  return {
    q: params.get("q") ?? undefined,
    scope: params.get("scope") ?? undefined,
    category: params.get("category") ?? undefined,
    active: params.get("active") ?? undefined,
    page: params.has("page") ? Number(params.get("page")) : 1,
    per_page: params.has("per_page") ? Number(params.get("per_page")) : 25,
  };
}

function filtersToParams(
  filters: EmailTemplateListQueryParams,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (filters.q) result.q = filters.q;
  if (filters.scope) result.scope = filters.scope;
  if (filters.category) result.category = filters.category;
  if (filters.active) result.active = filters.active;
  if (filters.page && filters.page > 1) result.page = String(filters.page);
  if (filters.per_page && filters.per_page !== 25)
    result.per_page = String(filters.per_page);
  return result;
}

export function EmailTemplatesPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);
  const [searchValue, setSearchValue] = useState(
    searchParams.get("q") ?? "",
  );

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams],
  );

  const { data, loading, error, refetch } = useGetEmailTemplateList(filters);
  const deleteMutation = useDeleteEmailTemplateById();

  const templates = data?.items ?? [];
  const pagination = data?.pagination;

  const activeTab = useMemo(() => {
    const scope = filters.scope;
    if (scope === "office") return 1;
    if (scope === "personal") return 2;
    return 0;
  }, [filters.scope]);

  const handleTabChange = useCallback(
    (_: unknown, newValue: number) => {
      const scope = SCOPE_TABS[newValue];
      const updated = { ...filters, scope: scope === "all" ? undefined : scope, page: 1 };
      setSearchParams(filtersToParams(updated));
    },
    [filters, setSearchParams],
  );

  const handleSearch = useCallback(() => {
    const updated = { ...filters, q: searchValue || undefined, page: 1 };
    setSearchParams(filtersToParams(updated));
  }, [filters, searchValue, setSearchParams]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch],
  );

  const handlePageChange = useCallback(
    (_: unknown, newPage: number) => {
      setSearchParams(filtersToParams({ ...filters, page: newPage + 1 }));
    },
    [filters, setSearchParams],
  );

  const handleRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchParams(
        filtersToParams({
          ...filters,
          per_page: parseInt(e.target.value, 10),
          page: 1,
        }),
      );
    },
    [filters, setSearchParams],
  );

  const handleCreateClick = useCallback(() => {
    setEditTemplate(null);
    setDrawerOpen(true);
  }, []);

  const handleRowClick = useCallback((template: EmailTemplate) => {
    setEditTemplate(template);
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    setEditTemplate(null);
  }, []);

  const handleDrawerSuccess = useCallback(() => {
    handleDrawerClose();
    refetch();
  }, [handleDrawerClose, refetch]);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, template: EmailTemplate) => {
      e.stopPropagation();
      setDeleteTarget(template);
    },
    [],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteMutation.mutate({ path: { id: deleteTarget.id } });
      setDeleteTarget(null);
      refetch();
    } catch {
      // error surfaced via mutation
    }
  }, [deleteTarget, deleteMutation, refetch]);

  const canEditTemplate = useCallback(
    (template: EmailTemplate) => {
      if (template.scope === "office") {
        return user?.role === "admin" || user?.role === "manager";
      }
      return template.created_by_user_id === user?.id;
    },
    [user],
  );

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
          {t("email_templates.title")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          {t("email_templates.new")}
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label={t("email_templates.tab_all")} />
          <Tab label={t("email_templates.scope_office")} />
          <Tab label={t("email_templates.scope_personal")} />
        </Tabs>
        <Box sx={{ flex: 1 }} />
        <TextField
          size="small"
          placeholder={t("email_templates.search_placeholder")}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleSearch}>
                  <SearchIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ width: 260 }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("email_templates.name")}</TableCell>
                <TableCell>{t("email_templates.subject")}</TableCell>
                <TableCell>{t("email_templates.category")}</TableCell>
                <TableCell>{t("email_templates.scope")}</TableCell>
                <TableCell>{t("email_templates.active")}</TableCell>
                <TableCell align="right">{t("email_templates.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading && templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box
                      sx={{
                        py: 6,
                        textAlign: "center",
                        color: "text.secondary",
                      }}
                    >
                      <Typography variant="body2">
                        {t("email_templates.empty_state")}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                templates.map((template) => (
                  <TableRow
                    key={template.id}
                    hover
                    onClick={() => handleRowClick(template)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {template.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 300,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {template.subject}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {template.category ?? "\u2014"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          template.scope === "office"
                            ? t("email_templates.scope_office")
                            : t("email_templates.scope_personal")
                        }
                        size="small"
                        variant="outlined"
                        color={template.scope === "office" ? "primary" : "default"}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          template.active
                            ? t("email_templates.status_active")
                            : t("email_templates.status_inactive")
                        }
                        size="small"
                        color={template.active ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {canEditTemplate(template) && (
                        <>
                          <Tooltip title={t("email_templates.edit")}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(template);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t("email_templates.delete")}>
                            <IconButton
                              size="small"
                              onClick={(e) => handleDeleteClick(e, template)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
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

      <EmailTemplateFormDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
        template={editTemplate}
      />

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("email_templates.delete")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("email_templates.delete_confirm", {
              name: deleteTarget?.name ?? "",
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>
            {t("email_templates.cancel")}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleteMutation.loading}
          >
            {t("email_templates.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
