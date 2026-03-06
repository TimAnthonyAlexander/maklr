import { useParams, useNavigate } from "react-router";
import { Box, Button } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import { TaskDetailContent } from "../components/tasks/TaskDetailContent";

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowLeft size={18} />}
        onClick={() => navigate("/tasks")}
        sx={{ mb: 2 }}
      >
        Tasks
      </Button>

      <TaskDetailContent
        taskId={id}
        showFullPageLink={false}
        onClose={() => navigate("/tasks")}
      />
    </Box>
  );
}
