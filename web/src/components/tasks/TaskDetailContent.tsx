import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Box, Typography, Skeleton, Alert, TextField } from "@mui/material";
import {
  useGetTaskShowById,
  useDeleteTaskById,
  usePatchTaskUpdateById,
} from "../../api/hooks";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "../../contexts/LanguageContext";
import { TaskDetailHeader } from "./TaskDetailHeader";
import { TaskDetailSidebar } from "./TaskDetailSidebar";
import { TaskDeleteDialog } from "./TaskDeleteDialog";
import type { TaskComment } from "../../api/types";

interface TaskDetailContentProps {
  taskId: string;
  showFullPageLink?: boolean;
  onClose?: () => void;
  onTaskUpdated?: () => void;
}

function formatCommentDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskDetailContent({
  taskId,
  showFullPageLink = true,
  onClose,
  onTaskUpdated,
}: TaskDetailContentProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const canDelete = user?.role === "admin" || user?.role === "manager";

  const {
    data: task,
    loading,
    error,
    setData: setTask,
  } = useGetTaskShowById({ id: taskId }, { enabled: !!taskId });

  const deleteMutation = useDeleteTaskById();
  const patchMutation = usePatchTaskUpdateById();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState("");
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Sync description when task data changes
  useEffect(() => {
    if (!editingDescription && task) {
      setDescriptionValue(task.description ?? "");
    }
  }, [task?.description, editingDescription, task]);

  const handleFieldSave = useCallback(
    async (field: string, value: string | null) => {
      try {
        const updated = await patchMutation.mutate({
          path: { id: taskId },
          body: { [field]: value },
        });
        setTask(updated);
        onTaskUpdated?.();
      } catch {
        // error surfaced via patchMutation.error
      }
    },
    [taskId, patchMutation, setTask, onTaskUpdated],
  );

  const handleDescriptionClick = useCallback(() => {
    setEditingDescription(true);
    setTimeout(() => descriptionRef.current?.focus(), 0);
  }, []);

  const handleDescriptionSave = useCallback(async () => {
    const newValue = descriptionValue.trim() || null;
    const oldValue = task?.description?.trim() || null;
    if (newValue !== oldValue) {
      await handleFieldSave("description", newValue);
    }
    setEditingDescription(false);
  }, [descriptionValue, task?.description, handleFieldSave]);

  const handleDescriptionKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Cmd/Ctrl+Enter to save, Escape to cancel
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleDescriptionSave();
      }
      if (e.key === "Escape") {
        setDescriptionValue(task?.description ?? "");
        setEditingDescription(false);
      }
    },
    [handleDescriptionSave, task?.description],
  );

  const handleDeleteClick = useCallback(() => {
    setDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteMutation.mutate({ path: { id: taskId } });
      setDeleteOpen(false);
      onClose?.();
      onTaskUpdated?.();
    } catch {
      // error surfaced via deleteMutation.error
    }
  }, [taskId, deleteMutation, onClose, onTaskUpdated]);

  const handleOpenFullPage = useCallback(() => {
    onClose?.();
    navigate(`/tasks/${taskId}`);
  }, [navigate, taskId, onClose]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={100} height={20} />
        <Skeleton variant="text" width={300} height={40} sx={{ mt: 1 }} />
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Skeleton variant="rounded" width={60} height={24} />
          <Skeleton variant="rounded" width={60} height={24} />
          <Skeleton variant="rounded" width={60} height={24} />
        </Box>
        <Skeleton
          variant="rectangular"
          height={200}
          sx={{ mt: 3, borderRadius: 2 }}
        />
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

  if (!task) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">{t("tasks.detail.not_found")}</Alert>
      </Box>
    );
  }

  const comments: TaskComment[] = task.comments ?? [];
  const modifierKey = navigator.platform?.includes("Mac") ? "\u2318" : "Ctrl";

  return (
    <Box sx={{ p: 3 }}>
      {patchMutation.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {patchMutation.error.message}
        </Alert>
      )}

      <TaskDetailHeader
        task={task}
        canDelete={canDelete}
        showFullPageLink={showFullPageLink}
        onFieldSave={handleFieldSave}
        onDelete={handleDeleteClick}
        onOpenFullPage={handleOpenFullPage}
      />

      {/* Body: main + sidebar */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          mt: 3,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* Main content area */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Editable description */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              {t("tasks.detail.description")}
            </Typography>
            {editingDescription ? (
              <Box>
                <TextField
                  inputRef={descriptionRef}
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  onBlur={handleDescriptionSave}
                  onKeyDown={handleDescriptionKeyDown}
                  multiline
                  minRows={3}
                  maxRows={12}
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder={t("tasks.detail.description_placeholder")}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  {t("tasks.detail.save_hint", { key: modifierKey })}
                </Typography>
              </Box>
            ) : (
              <Box
                onClick={handleDescriptionClick}
                sx={{
                  cursor: "pointer",
                  borderRadius: 2,
                  p: 1.5,
                  mx: -1.5,
                  minHeight: 60,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                {task.description ? (
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", color: "text.primary" }}
                  >
                    {task.description}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t("tasks.detail.description_placeholder")}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Comments (read-only for now) */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              {t("tasks.detail.comments")}
            </Typography>
            {comments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t("tasks.detail.no_comments")}
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {comments.map((comment) => (
                  <Box
                    key={comment.id}
                    sx={{
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {comment.user?.name ?? t("tasks.detail.unknown_user")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCommentDate(comment.created_at)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {comment.body}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Sidebar */}
        <Box sx={{ width: { xs: "100%", md: 280 }, flexShrink: 0 }}>
          <TaskDetailSidebar task={task} onFieldSave={handleFieldSave} />
        </Box>
      </Box>

      {/* Delete dialog */}
      {canDelete && (
        <TaskDeleteDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDeleteConfirm}
          loading={deleteMutation.loading}
          taskTitle={task.title ?? ""}
        />
      )}
    </Box>
  );
}
