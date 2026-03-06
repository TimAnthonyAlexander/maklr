import { useState, useCallback, useRef, useEffect } from "react";
import { Box, Typography, IconButton, Button, TextField } from "@mui/material";
import { Trash2, ExternalLink } from "lucide-react";
import {
  TaskStatusChip,
  TaskPriorityChip,
  TaskTypeLabel,
} from "./TaskStatusChip";
import type { TaskWithRelations } from "../../api/types";
import { useTranslation } from "../../contexts/LanguageContext";

interface TaskDetailHeaderProps {
  task: TaskWithRelations;
  canDelete: boolean;
  showFullPageLink: boolean;
  onFieldSave: (field: string, value: string | null) => Promise<void>;
  onDelete: () => void;
  onOpenFullPage: () => void;
}

export function TaskDetailHeader({
  task,
  canDelete,
  showFullPageLink,
  onFieldSave,
  onDelete,
  onOpenFullPage,
}: TaskDetailHeaderProps) {
  const { t } = useTranslation();
  const taskKey = task.task_number != null ? `TASK-${task.task_number}` : null;

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title ?? "");
  const titleRef = useRef<HTMLInputElement>(null);

  // Sync when task changes externally
  useEffect(() => {
    if (!editingTitle) {
      setTitleValue(task.title ?? "");
    }
  }, [task.title, editingTitle]);

  const handleTitleClick = useCallback(() => {
    setEditingTitle(true);
    // Focus after render
    setTimeout(() => titleRef.current?.focus(), 0);
  }, []);

  const handleTitleSave = useCallback(async () => {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== task.title) {
      await onFieldSave("title", trimmed);
    } else {
      setTitleValue(task.title ?? "");
    }
    setEditingTitle(false);
  }, [titleValue, task.title, onFieldSave]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleTitleSave();
      }
      if (e.key === "Escape") {
        setTitleValue(task.title ?? "");
        setEditingTitle(false);
      }
    },
    [handleTitleSave, task.title],
  );

  return (
    <Box>
      {/* Top row: task key + full page link */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 0.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {taskKey && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              {taskKey}
            </Typography>
          )}
          {canDelete && (
            <IconButton
              size="small"
              color="error"
              onClick={onDelete}
              sx={{ ml: 0.5 }}
            >
              <Trash2 size={16} />
            </IconButton>
          )}
        </Box>
        {showFullPageLink && (
          <Button
            size="small"
            endIcon={<ExternalLink size={14} />}
            onClick={onOpenFullPage}
            sx={{ textTransform: "none", fontSize: "0.8rem" }}
          >
            {t("tasks.detail.open_full_page")}
          </Button>
        )}
      </Box>

      {/* Editable title */}
      {editingTitle ? (
        <TextField
          inputRef={titleRef}
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={handleTitleKeyDown}
          variant="standard"
          fullWidth
          slotProps={{
            input: {
              sx: { fontSize: "1.5rem", fontWeight: 600, py: 0 },
              disableUnderline: false,
            },
          }}
          sx={{ mb: 1.5 }}
        />
      ) : (
        <Typography
          variant="h5"
          onClick={handleTitleClick}
          sx={{
            fontWeight: 600,
            mb: 1.5,
            cursor: "pointer",
            borderRadius: 1,
            px: 0.5,
            mx: -0.5,
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          {task.title || t("tasks.detail.untitled")}
        </Typography>
      )}

      {/* Chips (read-only badges — editing happens in sidebar) */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <TaskStatusChip status={task.status ?? "open"} />
        <TaskPriorityChip priority={task.priority ?? "medium"} />
        <TaskTypeLabel value={task.type ?? "task"} />
      </Box>
    </Box>
  );
}
