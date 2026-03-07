import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Box, Typography } from "@mui/material";
import {
  Flag,
  CheckCircle2,
  ListTodo,
  Mail,
  Pencil,
  Clock,
  GitBranch,
  Calendar,
} from "lucide-react";

const STEP_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  start: Flag,
  end: CheckCircle2,
  create_task: ListTodo,
  send_email: Mail,
  change_field: Pencil,
  wait_days: Clock,
  decision: GitBranch,
  create_appointment: Calendar,
};

const STEP_COLORS: Record<string, string> = {
  start: "#4CAF50",
  end: "#9E9E9E",
  create_task: "#2196F3",
  send_email: "#FF9800",
  change_field: "#9C27B0",
  wait_days: "#607D8B",
  decision: "#E91E63",
  create_appointment: "#00BCD4",
};

interface StepNodeData {
  label: string;
  stepType: string;
  selected?: boolean;
  [key: string]: unknown;
}

function BaseStepNodeInner({ data }: NodeProps) {
  const nodeData = data as unknown as StepNodeData;
  const Icon = STEP_ICONS[nodeData.stepType] ?? Flag;
  const color = STEP_COLORS[nodeData.stepType] ?? "#757575";
  const isDecision = nodeData.stepType === "decision";

  return (
    <Box
      sx={{
        bgcolor: "#fff",
        border: "2px solid",
        borderColor: nodeData.selected ? "primary.main" : "divider",
        borderRadius: isDecision ? "4px" : "12px",
        transform: isDecision ? "rotate(0deg)" : undefined,
        px: 2,
        py: 1.5,
        minWidth: 160,
        maxWidth: 220,
        textAlign: "center",
        cursor: "pointer",
        transition: "border-color 0.15s ease",
        "&:hover": {
          borderColor: color,
        },
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "center" }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            bgcolor: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={14} />
        </Box>
        <Typography sx={{ fontSize: "0.8rem", fontWeight: 500, lineHeight: 1.2 }}>
          {nodeData.label}
        </Typography>
      </Box>

      {isDecision ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            style={{ background: "#4CAF50", left: "30%" }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            style={{ background: "#f44336", left: "70%" }}
          />
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} style={{ background: color }} />
      )}
    </Box>
  );
}

export const BaseStepNode = memo(BaseStepNodeInner);
