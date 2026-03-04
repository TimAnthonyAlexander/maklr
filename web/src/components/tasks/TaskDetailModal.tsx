import { Dialog, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { TaskDetailContent } from "./TaskDetailContent";

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

export function TaskDetailModal({
  taskId,
  onClose,
  onTaskUpdated,
}: TaskDetailModalProps) {
  return (
    <Dialog
      open={taskId != null}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        elevation: 0,
        sx: {
          width: "90vw",
          maxWidth: 1200,
          height: "90vh",
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        },
      }}
    >
      {/* Close button */}
      <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ overflow: "auto", height: "100%" }}>
        {taskId && (
          <TaskDetailContent
            taskId={taskId}
            showFullPageLink
            onClose={onClose}
            onTaskUpdated={onTaskUpdated}
          />
        )}
      </Box>
    </Dialog>
  );
}
