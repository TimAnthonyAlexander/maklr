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
  Skeleton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import type { Task, PaginationMeta } from "../../api/types";
import {
  TaskStatusChip,
  TaskPriorityChip,
  TaskTypeLabel,
} from "./TaskStatusChip";
import { useTranslation } from "../../contexts/LanguageContext";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

interface TaskListViewProps {
  tasks: Task[];
  loading: boolean;
  pagination: PaginationMeta | undefined;
  onTaskClick: (task: Task) => void;
  onCreateClick: () => void;
  onPageChange: (_: unknown, newPage: number) => void;
  onRowsPerPageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TaskListView({
  tasks,
  loading,
  pagination,
  onTaskClick,
  onCreateClick,
  onPageChange,
  onRowsPerPageChange,
}: TaskListViewProps) {
  const { t } = useTranslation();

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("tasks.list.col_key")}</TableCell>
              <TableCell>{t("tasks.list.col_title")}</TableCell>
              <TableCell>{t("tasks.list.col_type")}</TableCell>
              <TableCell>{t("tasks.list.col_priority")}</TableCell>
              <TableCell>{t("tasks.list.col_status")}</TableCell>
              <TableCell>{t("tasks.list.col_due_date")}</TableCell>
              <TableCell>{t("tasks.list.col_created")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      py: 6,
                      color: "text.secondary",
                    }}
                  >
                    <CheckBoxOutlinedIcon
                      sx={{ fontSize: 48, mb: 1, opacity: 0.5 }}
                    />
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {t("tasks.list.empty")}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={onCreateClick}
                    >
                      {t("tasks.list.add_first")}
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              tasks.map((task) => (
                <TableRow
                  key={task.id}
                  hover
                  onClick={() => onTaskClick(task)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        fontWeight: 500,
                        fontSize: "0.8rem",
                      }}
                    >
                      TASK-{task.task_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {task.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <TaskTypeLabel value={task.type ?? "task"} />
                  </TableCell>
                  <TableCell>
                    <TaskPriorityChip priority={task.priority ?? "medium"} />
                  </TableCell>
                  <TableCell>
                    <TaskStatusChip status={task.status ?? "open"} />
                  </TableCell>
                  <TableCell>
                    {task.due_date
                      ? dateFormatter.format(new Date(task.due_date))
                      : "\u2014"}
                  </TableCell>
                  <TableCell>
                    {task.created_at
                      ? dateFormatter.format(new Date(task.created_at))
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
          onPageChange={onPageChange}
          rowsPerPage={pagination.per_page ?? 25}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50]}
        />
      )}
    </Paper>
  );
}
