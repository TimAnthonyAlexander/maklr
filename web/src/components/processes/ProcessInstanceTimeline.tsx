import { useCallback } from "react";
import {
  Box,
  Typography,
  Skeleton,
  Alert,
  Button,
  Divider,
  Paper,
} from "@mui/material";
import {
  Play,
  Pause,
  XCircle,
  CheckCircle2,
  Circle,
  ArrowRight,
  Clock,
  Mail,
  ListTodo,
  GitBranch,
  Pencil,
  Calendar,
  Flag,
} from "lucide-react";
import {
  useGetProcessInstanceById,
  usePatchProcessInstanceUpdateById,
  usePostProcessStepComplete,
} from "../../api/hooks";
import { ProcessStatusBadge, StepStatusBadge } from "./ProcessStatusBadge";
import { useTranslation } from "../../contexts/LanguageContext";
import type { ProcessStepInstance } from "../../api/types";

const STEP_TYPE_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  start: Flag,
  end: CheckCircle2,
  create_task: ListTodo,
  send_email: Mail,
  change_field: Pencil,
  wait_days: Clock,
  decision: GitBranch,
  create_appointment: Calendar,
};

interface ProcessInstanceTimelineProps {
  instanceId: string;
}

export function ProcessInstanceTimeline({ instanceId }: ProcessInstanceTimelineProps) {
  const { t } = useTranslation();
  const { data: instance, loading, error, setData } = useGetProcessInstanceById(instanceId);
  const { mutate: updateInstance, loading: updating } = usePatchProcessInstanceUpdateById();
  const { mutate: completeStep, loading: completing } = usePostProcessStepComplete();

  const handleStatusChange = useCallback(
    async (status: "paused" | "running" | "cancelled") => {
      if (!instance) return;
      try {
        const updated = await updateInstance({ id: instance.id, body: { status } });
        if (updated) setData(updated);
      } catch {
        // error handled by hook
      }
    },
    [instance, updateInstance, setData],
  );

  const handleCompleteStep = useCallback(
    async (stepKey: string) => {
      if (!instance) return;
      try {
        const updated = await completeStep({ id: instance.id, stepKey });
        if (updated) setData(updated);
      } catch {
        // error handled by hook
      }
    },
    [instance, completeStep, setData],
  );

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="text" width={300} height={24} sx={{ mt: 1 }} />
        <Skeleton variant="rectangular" height={300} sx={{ mt: 3, borderRadius: 2 }} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  if (!instance) return null;

  const steps = instance.step_instances ?? [];
  const sortedSteps = [...steps].sort((a, b) => {
    const order = ["completed", "active", "pending", "skipped", "failed"];
    const aIdx = a.activated_at ? new Date(a.activated_at).getTime() : Infinity;
    const bIdx = b.activated_at ? new Date(b.activated_at).getTime() : Infinity;
    if (aIdx !== bIdx) return aIdx - bIdx;
    return order.indexOf(a.status) - order.indexOf(b.status);
  });

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <Typography variant="h5" fontWeight={600}>
          {instance.template?.name ?? "\u2014"}
        </Typography>
        <ProcessStatusBadge status={instance.status} />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {instance.entity_type} &middot;{" "}
        {instance.started_at
          ? `${t("processes.timeline.started_at")}: ${new Date(instance.started_at).toLocaleString()}`
          : ""}
        {instance.completed_at
          ? ` \u00B7 ${t("processes.timeline.completed_at")}: ${new Date(instance.completed_at).toLocaleString()}`
          : ""}
      </Typography>

      {instance.status === "running" && (
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Pause size={16} />}
            onClick={() => handleStatusChange("paused")}
            disabled={updating}
          >
            {t("processes.pause")}
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<XCircle size={16} />}
            onClick={() => handleStatusChange("cancelled")}
            disabled={updating}
          >
            {t("processes.cancel")}
          </Button>
        </Box>
      )}

      {instance.status === "paused" && (
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Play size={16} />}
            onClick={() => handleStatusChange("running")}
            disabled={updating}
          >
            {t("processes.resume")}
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<XCircle size={16} />}
            onClick={() => handleStatusChange("cancelled")}
            disabled={updating}
          >
            {t("processes.cancel")}
          </Button>
        </Box>
      )}

      <Paper variant="outlined" sx={{ p: 0 }}>
        {sortedSteps.map((step, index) => (
          <StepRow
            key={step.id}
            step={step}
            isLast={index === sortedSteps.length - 1}
            onComplete={handleCompleteStep}
            completing={completing}
            instanceStatus={instance.status}
            t={t}
          />
        ))}
      </Paper>
    </Box>
  );
}

interface StepRowProps {
  step: ProcessStepInstance;
  isLast: boolean;
  onComplete: (stepKey: string) => void;
  completing: boolean;
  instanceStatus: string;
  t: (key: string) => string;
}

function StepRow({ step, isLast, onComplete, completing, instanceStatus, t }: StepRowProps) {
  const Icon = STEP_TYPE_ICONS[step.step_type] ?? Circle;
  const isActive = step.status === "active";
  const isCompleted = step.status === "completed";

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 3,
          py: 2,
          bgcolor: isActive ? "action.hover" : "transparent",
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: isCompleted
              ? "success.light"
              : isActive
                ? "info.light"
                : "action.disabledBackground",
            color: isCompleted
              ? "success.dark"
              : isActive
                ? "info.dark"
                : "text.disabled",
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography fontWeight={500} sx={{ fontSize: "0.875rem" }}>
              {step.step_key}
            </Typography>
            <StepStatusBadge status={step.status} />
          </Box>

          <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
            {step.activated_at && (
              <Typography variant="caption" color="text.secondary">
                {new Date(step.activated_at).toLocaleString()}
              </Typography>
            )}
            {step.due_date && (
              <Typography variant="caption" color="text.secondary">
                {t("processes.timeline.due_date")}: {new Date(step.due_date).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isActive && instanceStatus === "running" && step.step_type !== "start" && step.step_type !== "end" && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => onComplete(step.step_key)}
              disabled={completing}
            >
              {t("processes.complete_step")}
            </Button>
          )}
          {step.completed_at && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <ArrowRight size={14} />
              <Typography variant="caption" color="text.secondary">
                {new Date(step.completed_at).toLocaleString()}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      {!isLast && <Divider />}
    </>
  );
}
