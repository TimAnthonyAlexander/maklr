import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import {
  Box,
  Typography,
  Button,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Skeleton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import {
  useGetTaskList,
  useDeleteTaskById,
  usePatchTaskUpdateById,
} from "../api/hooks";
import type { Task, TaskListQueryParams } from "../api/types";
import { TaskFilters } from "../components/tasks/TaskFilters";
import { TaskForm } from "../components/tasks/TaskForm";
import { TaskDeleteDialog } from "../components/tasks/TaskDeleteDialog";
import { TaskDetailModal } from "../components/tasks/TaskDetailModal";
import { TaskListView } from "../components/tasks/TaskListView";
import { TaskKanbanBoard } from "../components/tasks/TaskKanbanBoard";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/LanguageContext";

type ViewMode = "list" | "kanban";

const STORAGE_KEY = "maklr:tasks-view-mode";

function getStoredViewMode(): ViewMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "kanban" ? "kanban" : "list";
}

function parseFiltersFromParams(params: URLSearchParams): TaskListQueryParams {
  return {
    q: params.get("q") ?? undefined,
    status: params.get("status") ?? undefined,
    priority: params.get("priority") ?? undefined,
    type: params.get("type") ?? undefined,
    page: params.has("page") ? Number(params.get("page")) : 1,
    per_page: params.has("per_page") ? Number(params.get("per_page")) : 25,
  };
}

function filtersToParams(filters: TaskListQueryParams): Record<string, string> {
  const result: Record<string, string> = {};
  if (filters.q) result.q = filters.q;
  if (filters.status) result.status = filters.status;
  if (filters.priority) result.priority = filters.priority;
  if (filters.type) result.type = filters.type;
  if (filters.page && filters.page > 1) result.page = String(filters.page);
  if (filters.per_page && filters.per_page !== 25)
    result.per_page = String(filters.per_page);
  return result;
}

export function TasksPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams],
  );

  // For kanban, fetch all tasks (no pagination) and ignore status filter
  const kanbanFilters = useMemo((): TaskListQueryParams => {
    const { status: _status, ...rest } = filters;
    return viewMode === "kanban"
      ? { ...rest, per_page: 200, page: 1 }
      : filters;
  }, [filters, viewMode]);

  const { data, loading, error, refetch } = useGetTaskList(kanbanFilters);
  const deleteMutation = useDeleteTaskById();
  const patchMutation = usePatchTaskUpdateById();

  const tasks = data?.items ?? [];
  const pagination = data?.pagination;

  const canDelete = user?.role === "admin" || user?.role === "manager";

  const handleViewModeChange = useCallback(
    (_: unknown, newMode: ViewMode | null) => {
      if (!newMode) return;
      setViewMode(newMode);
      localStorage.setItem(STORAGE_KEY, newMode);
    },
    [],
  );

  const handleFilterChange = useCallback(
    (newFilters: TaskListQueryParams) => {
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

  const handleTaskClick = useCallback((task: Task) => {
    if (task.id) {
      setSelectedTaskId(task.id);
    }
  }, []);

  const handleCreateClick = useCallback(() => {
    setCreateFormOpen(true);
  }, []);

  const handleCreateFormClose = useCallback(() => {
    setCreateFormOpen(false);
  }, []);

  const handleCreateFormSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleModalClose = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  const handleModalTaskUpdated = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTask?.id) return;
    try {
      await deleteMutation.mutate({ path: { id: deleteTask.id } });
      setDeleteTask(null);
      refetch();
    } catch {
      // error is surfaced via deleteMutation.error
    }
  }, [deleteTask, deleteMutation, refetch]);

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: string) => {
      try {
        await patchMutation.mutate({
          path: { id: taskId },
          body: { status: newStatus },
        });
        refetch();
      } catch {
        // error surfaced via patchMutation.error
      }
    },
    [patchMutation, refetch],
  );

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
          {t("tasks.page.title")}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                px: 1.5,
                py: 0.5,
                borderColor: "divider",
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.dark" },
                },
              },
            }}
          >
            <ToggleButton value="list" aria-label={t("tasks.page.list_view")}>
              <ViewListIcon sx={{ fontSize: 20 }} />
            </ToggleButton>
            <ToggleButton
              value="kanban"
              aria-label={t("tasks.page.kanban_view")}
            >
              <ViewKanbanIcon sx={{ fontSize: 20 }} />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
          >
            {t("tasks.page.add_task")}
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <TaskFilters filters={filters} onFilterChange={handleFilterChange} />
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {/* Loading state for kanban */}
      {loading && viewMode === "kanban" && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 2,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i}>
              <Skeleton variant="text" width={80} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" height={100} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" height={100} />
            </Box>
          ))}
        </Box>
      )}

      {/* Views */}
      {viewMode === "list" && (
        <TaskListView
          tasks={tasks}
          loading={loading}
          pagination={pagination}
          onTaskClick={handleTaskClick}
          onCreateClick={handleCreateClick}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      )}

      {viewMode === "kanban" && !loading && (
        <TaskKanbanBoard
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        onClose={handleModalClose}
        onTaskUpdated={handleModalTaskUpdated}
      />

      {/* Create Form Drawer */}
      <TaskForm
        open={createFormOpen}
        onClose={handleCreateFormClose}
        task={null}
        onSuccess={handleCreateFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      {canDelete && (
        <TaskDeleteDialog
          open={deleteTask != null}
          onClose={() => setDeleteTask(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleteMutation.loading}
          taskTitle={deleteTask?.title ?? ""}
        />
      )}
    </Box>
  );
}
