import { useState, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slide,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { usePostEstateBulkAction } from "../../api/hooks";
import { useGetUserList } from "../../api/hooks";
import { useTranslation } from "../../contexts/LanguageContext";
import type { EstateBulkAction } from "../../api/types";

interface EstateBulkActionToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onActionComplete: () => void;
}

type DialogType = "status" | "assign" | "archive" | null;

const STATUSES = [
  { value: "draft", key: "estate.status_draft" },
  { value: "active", key: "estate.status_active" },
  { value: "reserved", key: "estate.status_reserved" },
  { value: "sold", key: "estate.status_sold" },
  { value: "rented", key: "estate.status_rented" },
  { value: "archived", key: "estate.status_archived" },
] as const;

export function EstateBulkActionToolbar({
  selectedIds,
  onClearSelection,
  onActionComplete,
}: EstateBulkActionToolbarProps) {
  const { t } = useTranslation();
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("__unassign__");
  const bulkAction = usePostEstateBulkAction();
  const { data: usersData } = useGetUserList({ per_page: 100 });
  const users = usersData?.items ?? [];

  const handleClose = useCallback(() => {
    setDialogType(null);
    setSelectedStatus("");
    setSelectedUserId("__unassign__");
  }, []);

  const handleConfirm = useCallback(async () => {
    let action: EstateBulkAction;
    let body: Record<string, unknown> = { ids: selectedIds };

    switch (dialogType) {
      case "status":
        action = "status_change";
        body = { ...body, action, status: selectedStatus };
        break;
      case "assign":
        action = "assign";
        body = {
          ...body,
          action,
          assigned_user_id:
            selectedUserId === "__unassign__" ? null : selectedUserId,
        };
        break;
      case "archive":
        action = "archive";
        body = { ...body, action };
        break;
      default:
        return;
    }

    try {
      await bulkAction.mutate({
        body: body as Parameters<typeof bulkAction.mutate>[0]["body"],
      });
      handleClose();
      onClearSelection();
      onActionComplete();
    } catch {
      // error state is in bulkAction.error
    }
  }, [
    dialogType,
    selectedIds,
    selectedStatus,
    selectedUserId,
    bulkAction,
    handleClose,
    onClearSelection,
    onActionComplete,
  ]);

  const count = selectedIds.length;

  return (
    <>
      <Slide direction="down" in={count > 0} mountOnEnter unmountOnExit>
        <Paper
          variant="outlined"
          sx={{
            mb: 2,
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {t("estate.bulk_selected", { count: String(count) })}
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" onClick={() => setDialogType("status")}>
              {t("estate.bulk_change_status")}
            </Button>
            <Button size="small" onClick={() => setDialogType("assign")}>
              {t("estate.bulk_assign")}
            </Button>
            <Button size="small" onClick={() => setDialogType("archive")}>
              {t("estate.bulk_archive")}
            </Button>
          </Box>

          <Box sx={{ ml: "auto" }}>
            <IconButton size="small" onClick={onClearSelection}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      </Slide>

      {/* Status Change Dialog */}
      <Dialog open={dialogType === "status"} onClose={handleClose}>
        <DialogTitle>{t("estate.bulk_change_status")}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>{t("estate.bulk_select_status")}</InputLabel>
            <Select
              value={selectedStatus}
              label={t("estate.bulk_select_status")}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {t(s.key)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t("estate.bulk_cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={!selectedStatus || bulkAction.loading}
          >
            {t("estate.bulk_confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Agent Dialog */}
      <Dialog open={dialogType === "assign"} onClose={handleClose}>
        <DialogTitle>{t("estate.bulk_assign")}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>{t("estate.bulk_select_agent")}</InputLabel>
            <Select
              value={selectedUserId}
              label={t("estate.bulk_select_agent")}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <MenuItem value="__unassign__">
                {t("estate.bulk_unassign")}
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name ?? user.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t("estate.bulk_cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={bulkAction.loading}
          >
            {t("estate.bulk_confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive Dialog */}
      <Dialog open={dialogType === "archive"} onClose={handleClose}>
        <DialogTitle>
          {t("estate.bulk_archive_confirm", { count: String(count) })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("estate.bulk_archive_description", { count: String(count) })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t("estate.bulk_cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={bulkAction.loading}
          >
            {t("estate.bulk_confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
