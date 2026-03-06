import { useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  RefreshCw,
  Plug,
} from "lucide-react";
import {
  useGetPortalById,
  useDeletePortalById,
  usePostPortalTestById,
  usePostPortalSyncById,
  useGetPortalSyncLogs,
} from "../api/hooks";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/LanguageContext";
import { PortalForm } from "../components/portals/PortalForm";
import { PortalDeleteDialog } from "../components/portals/PortalDeleteDialog";
import { SyncStatusChip } from "../components/portals/SyncStatusChip";

const PORTAL_TABS = ["details", "sync-logs"] as const;

export function PortalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: portal, loading, error, refetch } = useGetPortalById(
    { id: id ?? "" },
    { enabled: !!id },
  );
  const deleteMutation = useDeletePortalById();
  const testMutation = usePostPortalTestById();
  const syncMutation = usePostPortalSyncById();
  const {
    data: syncLogsData,
    loading: syncLogsLoading,
  } = useGetPortalSyncLogs({ id: id ?? "" }, undefined, { enabled: !!id });

  const syncLogs = syncLogsData?.items ?? [];

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = Math.max(
    0,
    PORTAL_TABS.indexOf(searchParams.get("tab") as (typeof PORTAL_TABS)[number]),
  );
  const [tab, setTab] = useState(initialTab);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string | null } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; error?: string | null } | null>(null);

  const canManage = user?.role === "admin" || user?.role === "manager";

  const handleTabChange = useCallback(
    (_: unknown, newTab: number) => {
      setTab(newTab);
      const newParams = new URLSearchParams(searchParams);
      if (newTab === 0) {
        newParams.delete("tab");
      } else {
        newParams.set("tab", PORTAL_TABS[newTab]);
      }
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleDelete = useCallback(async () => {
    if (!id) return;
    try {
      await deleteMutation.mutate({ path: { id } });
      navigate("/portals");
    } catch {
      // Error captured by mutation hook
    }
  }, [id, deleteMutation, navigate]);

  const handleTest = useCallback(async () => {
    if (!id) return;
    setTestResult(null);
    try {
      const result = await testMutation.mutate({ path: { id } });
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : "Connection test failed",
      });
    }
  }, [id, testMutation]);

  const handleSync = useCallback(async () => {
    if (!id) return;
    setSyncResult(null);
    try {
      const result = await syncMutation.mutate({ path: { id } });
      setSyncResult(result);
      refetch();
    } catch (err) {
      setSyncResult({
        success: false,
        error: err instanceof Error ? err.message : "Sync failed",
      });
    }
  }, [id, syncMutation, refetch]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={300} sx={{ mt: 2, borderRadius: 2 }} />
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

  if (!portal) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">{t("portal.not_found")}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowLeft size={18} />}
        onClick={() => navigate("/portals")}
        sx={{ mb: 2 }}
      >
        {t("portal.page_title")}
      </Button>

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
            {portal.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              label={portal.active ? t("portal.status_active") : t("portal.status_inactive")}
              color={portal.active ? "success" : "default"}
              size="small"
              variant="outlined"
            />
            <Chip
              label={(portal.portal_type ?? "ftp").toUpperCase()}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          {canManage && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Plug size={16} />}
              onClick={handleTest}
              disabled={testMutation.loading}
            >
              {testMutation.loading ? t("portal.testing") : t("portal.test_connection")}
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshCw size={16} />}
            onClick={handleSync}
            disabled={syncMutation.loading}
          >
            {syncMutation.loading ? t("portal.syncing") : t("portal.sync_now")}
          </Button>
          {canManage && (
            <>
              <IconButton size="small" onClick={() => setFormOpen(true)}>
                <Pencil size={20} />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={20} />
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      {testResult && (
        <Alert
          severity={testResult.success ? "success" : "error"}
          sx={{ mb: 2 }}
          onClose={() => setTestResult(null)}
        >
          {testResult.success
            ? t("portal.test_success")
            : testResult.error ?? t("portal.test_failed")}
        </Alert>
      )}

      {syncResult && (
        <Alert
          severity={syncResult.success ? "success" : "error"}
          sx={{ mb: 2 }}
          onClose={() => setSyncResult(null)}
        >
          {syncResult.success
            ? t("portal.sync_success")
            : syncResult.error ?? t("portal.sync_failed")}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                {t("portal.connection_details")}
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                }}
              >
                <DetailField label={t("portal.field.portal_type")} value={(portal.portal_type ?? "ftp").toUpperCase()} />
                <DetailField label={t("portal.field.provider_id")} value={portal.provider_id} />

                {portal.portal_type === "ftp" && (
                  <>
                    <DetailField label={t("portal.field.ftp_host")} value={portal.ftp_host} />
                    <DetailField label={t("portal.field.ftp_port")} value={portal.ftp_port != null ? String(portal.ftp_port) : null} />
                    <DetailField label={t("portal.field.ftp_username")} value={portal.ftp_username} />
                    <DetailField label={t("portal.field.ftp_path")} value={portal.ftp_path} />
                    <DetailField
                      label={t("portal.field.ftp_passive")}
                      value={portal.ftp_passive ? t("portal.yes") : t("portal.no")}
                    />
                    <DetailField
                      label={t("portal.field.ftp_ssl")}
                      value={portal.ftp_ssl ? t("portal.yes") : t("portal.no")}
                    />
                  </>
                )}

                <DetailField
                  label={t("portal.col_last_sync")}
                  value={
                    portal.last_sync_at
                      ? new Date(portal.last_sync_at).toLocaleString()
                      : null
                  }
                />
                <DetailField label={t("portal.last_error")} value={portal.last_error} />
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ px: 3 }}>
              <Tabs value={tab} onChange={handleTabChange}>
                <Tab label={t("portal.tab_details")} />
                <Tab label={t("portal.tab_sync_logs")} />
              </Tabs>

              {tab === 0 && (
                <Box sx={{ pt: 3, pb: 3 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    <DetailField
                      label={t("portal.col_created")}
                      value={
                        portal.created_at
                          ? new Date(portal.created_at).toLocaleString()
                          : null
                      }
                    />
                    <DetailField
                      label={t("portal.updated_at")}
                      value={
                        portal.updated_at
                          ? new Date(portal.updated_at).toLocaleString()
                          : null
                      }
                    />
                  </Box>
                </Box>
              )}

              {tab === 1 && (
                <Box sx={{ pt: 3, pb: 3 }}>
                  {syncLogsLoading ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} variant="rectangular" height={40} />
                      ))}
                    </Box>
                  ) : syncLogs.length === 0 ? (
                    <Typography color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
                      {t("portal.no_sync_logs")}
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>{t("portal.sync_log.action")}</TableCell>
                            <TableCell>{t("portal.sync_log.status")}</TableCell>
                            <TableCell>{t("portal.sync_log.error")}</TableCell>
                            <TableCell>{t("portal.sync_log.date")}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {syncLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>{log.action ?? "\u2014"}</TableCell>
                              <TableCell>
                                <SyncStatusChip status={log.status ?? "started"} />
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  color={log.error_message ? "error" : "text.disabled"}
                                  sx={{
                                    maxWidth: 300,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {log.error_message ?? "\u2014"}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {log.created_at
                                  ? new Date(log.created_at).toLocaleString()
                                  : "\u2014"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
            </Paper>
          </Box>
        </Grid>

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
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                {t("portal.quick_info")}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <QuickInfoRow
                  label={t("portal.col_status")}
                  value={
                    <Chip
                      label={portal.active ? t("portal.status_active") : t("portal.status_inactive")}
                      color={portal.active ? "success" : "default"}
                      size="small"
                      variant="outlined"
                    />
                  }
                />
                <QuickInfoRow
                  label={t("portal.col_type")}
                  value={
                    <Typography variant="body2">
                      {(portal.portal_type ?? "ftp").toUpperCase()}
                    </Typography>
                  }
                />
                <QuickInfoRow
                  label={t("portal.field.provider_id")}
                  value={
                    <Typography variant="body2" color={portal.provider_id ? "text.primary" : "text.disabled"}>
                      {portal.provider_id ?? "\u2014"}
                    </Typography>
                  }
                />
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      <PortalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        portal={portal}
        onSuccess={() => refetch()}
      />

      <PortalDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteMutation.loading}
        portalName={portal.name ?? ""}
      />
    </Box>
  );
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        color={value ? "text.primary" : "text.disabled"}
      >
        {value ?? "\u2014"}
      </Typography>
    </Box>
  );
}

function QuickInfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {value}
    </Box>
  );
}
