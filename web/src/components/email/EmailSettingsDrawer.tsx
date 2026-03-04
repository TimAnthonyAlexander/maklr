import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Chip,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CircularProgress from "@mui/material/CircularProgress";
import type { EmailAccount } from "../../api/types";
import { useTranslation } from "../../contexts/LanguageContext";
import {
  useGetEmailAccountList,
  useDeleteEmailAccountById,
  usePostEmailAccountTestById,
} from "../../api/hooks";
import { EmailAccountForm } from "./EmailAccountForm";
import { EmailAccountDeleteDialog } from "./EmailAccountDeleteDialog";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function StatusChip({ account }: { account: EmailAccount }) {
  const { t } = useTranslation();
  if (!account.active) {
    return (
      <Chip
        label={t("email.status_inactive")}
        size="small"
        sx={{ bgcolor: "grey.200", color: "text.secondary" }}
      />
    );
  }
  if (account.last_error) {
    return (
      <Tooltip title={account.last_error}>
        <Chip label={t("email.status_error")} size="small" color="warning" />
      </Tooltip>
    );
  }
  return <Chip label={t("email.status_connected")} size="small" color="success" />;
}

interface EmailSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function EmailSettingsDrawer({
  open,
  onClose,
}: EmailSettingsDrawerProps) {
  const { t } = useTranslation();
  const [formOpen, setFormOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<EmailAccount | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<EmailAccount | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);

  const { data, loading, refetch } = useGetEmailAccountList(undefined, {
    enabled: open,
  });
  const deleteMutation = useDeleteEmailAccountById();
  const testMutation = usePostEmailAccountTestById();

  const accounts = data?.items ?? [];

  const handleCreateClick = useCallback(() => {
    setEditAccount(null);
    setFormOpen(true);
  }, []);

  const handleRowClick = useCallback((account: EmailAccount) => {
    setEditAccount(account);
    setFormOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setEditAccount(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, account: EmailAccount) => {
      e.stopPropagation();
      setDeleteAccount(account);
    },
    [],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteAccount?.id) return;
    try {
      await deleteMutation.mutate({ path: { id: deleteAccount.id } });
      setDeleteAccount(null);
      refetch();
    } catch {
      // error surfaced via mutation
    }
  }, [deleteAccount, deleteMutation, refetch]);

  const handleTestClick = useCallback(
    async (e: React.MouseEvent, account: EmailAccount) => {
      e.stopPropagation();
      if (!account.id) return;
      setTestingId(account.id);
      try {
        const result = await testMutation.mutate({ path: { id: account.id } });
        if (result.success) {
          setSnackbar({
            message: t("email.test_success"),
            severity: "success",
          });
        } else {
          setSnackbar({
            message: result.error ?? t("email.test_failed"),
            severity: "error",
          });
        }
        refetch();
      } catch (err) {
        setSnackbar({
          message:
            err instanceof Error ? err.message : t("email.test_failed"),
          severity: "error",
        });
      } finally {
        setTestingId(null);
      }
    },
    [testMutation, refetch],
  );

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: 720, maxWidth: "100vw" } }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 3,
              py: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t("email.settings_title")}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleCreateClick}
              >
                {t("email.connect_account")}
              </Button>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("email.table_name")}</TableCell>
                    <TableCell>{t("email.table_email")}</TableCell>
                    <TableCell>{t("email.table_status")}</TableCell>
                    <TableCell>{t("email.table_last_sync")}</TableCell>
                    <TableCell align="right">{t("email.table_actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton variant="text" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}

                  {!loading && accounts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Box
                          sx={{
                            py: 4,
                            textAlign: "center",
                            color: "text.secondary",
                          }}
                        >
                          <Typography variant="body2">
                            {t("email.no_accounts_connected")}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    accounts.map((account) => (
                      <TableRow
                        key={account.id}
                        hover
                        onClick={() => handleRowClick(account)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {account.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {account.email_address}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip account={account} />
                        </TableCell>
                        <TableCell>
                          {account.last_sync_at
                            ? dateFormatter.format(
                                new Date(account.last_sync_at),
                              )
                            : "\u2014"}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={t("email.test_connection")}>
                            <IconButton
                              size="small"
                              onClick={(e) => handleTestClick(e, account)}
                              disabled={testingId === account.id}
                            >
                              {testingId === account.id ? (
                                <CircularProgress size={18} />
                              ) : (
                                <NetworkCheckIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t("email.deactivate")}>
                            <IconButton
                              size="small"
                              onClick={(e) => handleDeleteClick(e, account)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Drawer>

      {/* Account Form Drawer */}
      <EmailAccountForm
        open={formOpen}
        onClose={handleFormClose}
        account={editAccount}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Dialog */}
      <EmailAccountDeleteDialog
        open={deleteAccount != null}
        onClose={() => setDeleteAccount(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.loading}
        accountName={deleteAccount?.name ?? ""}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar != null}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snackbar ? (
          <Alert
            onClose={() => setSnackbar(null)}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
