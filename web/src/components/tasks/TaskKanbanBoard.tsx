import { useCallback, useMemo } from "react";
import { Box, Typography, Paper, Stack, Chip } from "@mui/material";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { Task } from "../../api/types";
import { TaskPriorityChip, TaskTypeLabel } from "./TaskStatusChip";
import { useTranslation } from "../../contexts/LanguageContext";
import { colors } from "../../theme/colors";

const COLUMNS = [
  {
    id: "open",
    labelKey: "tasks.status.open",
    bg: colors.status.info.bg,
    color: colors.status.info.text,
  },
  {
    id: "in_progress",
    labelKey: "tasks.status.in_progress",
    bg: colors.status.warning.bg,
    color: colors.status.warning.text,
  },
  {
    id: "done",
    labelKey: "tasks.status.done",
    bg: colors.status.success.bg,
    color: colors.status.success.text,
  },
  {
    id: "cancelled",
    labelKey: "tasks.status.cancelled",
    bg: colors.status.neutral.bg,
    color: colors.status.neutral.text,
  },
] as const;

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

interface TaskKanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
}

export function TaskKanbanBoard({
  tasks,
  onTaskClick,
  onStatusChange,
}: TaskKanbanBoardProps) {
  const { t } = useTranslation();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    for (const col of COLUMNS) {
      grouped[col.id] = [];
    }
    for (const task of tasks) {
      const status = task.status ?? "open";
      if (grouped[status]) {
        grouped[status].push(task);
      } else {
        grouped["open"].push(task);
      }
    }
    return grouped;
  }, [tasks]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id);
      setActiveTask(task ?? null);
    },
    [tasks],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;

      const taskId = active.id as string;
      const overId = over.id as string;

      // Determine target column: either dropping on a column directly or on a task within a column
      const isColumn = COLUMNS.some((c) => c.id === overId);
      let targetStatus: string;

      if (isColumn) {
        targetStatus = overId;
      } else {
        // Dropped on another task — find that task's status
        const overTask = tasks.find((t) => t.id === overId);
        targetStatus = overTask?.status ?? "open";
      }

      const draggedTask = tasks.find((t) => t.id === taskId);
      if (draggedTask && draggedTask.status !== targetStatus) {
        onStatusChange(taskId, targetStatus);
      }
    },
    [tasks, onStatusChange],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLUMNS.length}, 1fr)`,
          gap: 2,
          minHeight: 400,
        }}
      >
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            label={t(column.labelKey)}
            tasks={tasksByStatus[column.id]}
            onTaskClick={onTaskClick}
          />
        ))}
      </Box>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

interface KanbanColumnProps {
  column: (typeof COLUMNS)[number];
  label: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

function KanbanColumn({
  column,
  label,
  tasks,
  onTaskClick,
}: KanbanColumnProps) {
  const taskIds = useMemo(() => tasks.map((t) => t.id!), [tasks]);

  return (
    <SortableContext
      items={taskIds}
      id={column.id}
      strategy={verticalListSortingStrategy}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: 200,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1.5,
            px: 0.5,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: column.color,
            }}
          />
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            {label}
          </Typography>
          <Chip
            label={tasks.length}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.7rem",
              fontWeight: 600,
              bgcolor: column.bg,
              color: column.color,
            }}
          />
        </Box>

        <DroppableColumn columnId={column.id}>
          <Stack spacing={1}>
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onTaskClick={onTaskClick}
              />
            ))}
          </Stack>
        </DroppableColumn>
      </Box>
    </SortableContext>
  );
}

interface DroppableColumnProps {
  columnId: string;
  children: React.ReactNode;
}

function DroppableColumn({ columnId, children }: DroppableColumnProps) {
  const { setNodeRef } = useSortable({
    id: columnId,
    data: { type: "column" },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1,
        bgcolor: "#F8F8F8",
        borderRadius: 2,
        p: 1,
        minHeight: 120,
      }}
    >
      {children}
    </Box>
  );
}

interface SortableTaskCardProps {
  task: Task;
  onTaskClick: (task: Task) => void;
}

function SortableTaskCard({ task, onTaskClick }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={() => onTaskClick(task)} />
    </Box>
  );
}

interface TaskCardProps {
  task: Task;
  overlay?: boolean;
  onClick?: () => void;
}

function TaskCard({ task, overlay, onClick }: TaskCardProps) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 1.5,
        cursor: overlay ? "grabbing" : "pointer",
        bgcolor: "background.paper",
        borderColor: overlay ? "primary.main" : "divider",
        "&:hover": overlay ? {} : { borderColor: "text.secondary" },
        boxShadow: overlay ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontFamily: "monospace",
          color: "text.secondary",
          fontSize: "0.7rem",
        }}
      >
        TASK-{task.task_number}
      </Typography>

      <Typography
        variant="body2"
        sx={{ fontWeight: 500, mt: 0.5, mb: 1, lineHeight: 1.3 }}
      >
        {task.title}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flexWrap: "wrap",
        }}
      >
        <TaskTypeLabel value={task.type ?? "task"} />
        <TaskPriorityChip priority={task.priority ?? "medium"} />
        {task.due_date && (
          <Chip
            label={dateFormatter.format(new Date(task.due_date))}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.7rem", height: 22 }}
          />
        )}
      </Box>
    </Paper>
  );
}
