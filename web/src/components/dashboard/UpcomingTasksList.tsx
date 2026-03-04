import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Skeleton,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router";
import { useTranslation } from "../../contexts/LanguageContext";
import { TaskStatusChip, TaskPriorityChip } from "../tasks/TaskStatusChip";
import type { Task } from "../../api/types";

interface UpcomingTasksListProps {
  tasks: Task[] | undefined;
  loading: boolean;
}

function formatDueDate(
  dateStr: string | null | undefined,
  t: (key: string, params?: Record<string, string>) => string,
): string {
  if (!dateStr) return t("dashboard.upcoming_tasks.no_due_date");
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 0) {
    const overdue = Math.abs(diffDays);
    return overdue === 1
      ? t("dashboard.upcoming_tasks.overdue_one")
      : t("dashboard.upcoming_tasks.overdue_many", { count: String(overdue) });
  }
  if (diffDays === 0) return t("dashboard.upcoming_tasks.today");
  if (diffDays === 1) return t("dashboard.upcoming_tasks.tomorrow");
  if (diffDays < 7)
    return t("dashboard.upcoming_tasks.in_days", { count: String(diffDays) });
  return date.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

function getDueDateColor(dateStr: string | null | undefined): string {
  if (!dateStr) return "text.secondary";
  const diffMs = new Date(dateStr).getTime() - Date.now();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 0) return "error.main";
  if (diffDays <= 2) return "warning.main";
  return "text.secondary";
}

export function UpcomingTasksList({ tasks, loading }: UpcomingTasksListProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
      <Box sx={{ px: 3, pt: 3, pb: 1.5 }}>
        <Typography variant="h6">
          {t("dashboard.upcoming_tasks.title")}
        </Typography>
      </Box>
      <TableContainer>
        <Table sx={{ "& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root": { borderBottom: "none" } }}>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4].map((j) => (
                    <TableCell key={j}>
                      <Skeleton width={80} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (tasks ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2">
                    {t("dashboard.upcoming_tasks.empty")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              (tasks ?? []).map((task) => (
                <TableRow
                  key={task.id}
                  hover
                  onClick={() => navigate(`/tasks?task=${task.id}`)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {task.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        TASK-{task.task_number}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <TaskStatusChip status={task.status ?? "open"} />
                  </TableCell>
                  <TableCell>
                    <TaskPriorityChip priority={task.priority ?? "medium"} />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{ color: getDueDateColor(task.due_date) }}
                    >
                      {formatDueDate(task.due_date, t)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
