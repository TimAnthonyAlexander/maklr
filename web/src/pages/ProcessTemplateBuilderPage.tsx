import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Skeleton,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Plus, Save } from "lucide-react";
import {
  useGetProcessTemplateById,
  usePostProcessTemplateCreate,
  usePatchProcessTemplateUpdateById,
} from "../api/hooks";
import { ProcessStepConfigPanel } from "../components/processes/ProcessStepConfigPanel";
import { ProcessTriggerConfigForm } from "../components/processes/ProcessTriggerConfigForm";
import { BaseStepNode } from "../components/processes/nodes/BaseStepNode";
import { useTranslation } from "../contexts/LanguageContext";
import type {
  ProcessStep,
  ProcessEntityType,
  ProcessTriggerType,
} from "../api/types";

const nodeTypes: NodeTypes = {
  stepNode: BaseStepNode,
};

const STEP_TYPE_OPTIONS = [
  "create_task",
  "send_email",
  "change_field",
  "wait_days",
  "decision",
  "create_appointment",
] as const;

const DEFAULT_STEPS: ProcessStep[] = [
  { key: "start", type: "start", label: "Start", next: undefined, position: { x: 250, y: 0 } },
  { key: "end", type: "end", label: "End", next: undefined, position: { x: 250, y: 400 } },
];

function stepsToNodes(steps: ProcessStep[], selectedKey: string | null): Node[] {
  return steps.map((step) => ({
    id: step.key,
    type: "stepNode",
    position: step.position ?? { x: 0, y: 0 },
    data: { label: step.label, stepType: step.type, selected: step.key === selectedKey },
  }));
}

function stepsToEdges(steps: ProcessStep[]): Edge[] {
  const edges: Edge[] = [];
  for (const step of steps) {
    if (step.next) {
      edges.push({
        id: `${step.key}->${step.next}`,
        source: step.key,
        target: step.next,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2 },
      });
    }
    if (step.next_yes) {
      edges.push({
        id: `${step.key}->yes->${step.next_yes}`,
        source: step.key,
        sourceHandle: "yes",
        target: step.next_yes,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2, stroke: "#4CAF50" },
        label: "Yes",
      });
    }
    if (step.next_no) {
      edges.push({
        id: `${step.key}->no->${step.next_no}`,
        source: step.key,
        sourceHandle: "no",
        target: step.next_no,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2, stroke: "#f44336" },
        label: "No",
      });
    }
  }
  return edges;
}

function generateKey(): string {
  return `step_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function ProcessTemplateBuilderPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const { data: template, loading: loadingTemplate } = useGetProcessTemplateById(
    id ?? null,
  );
  const { mutate: createTemplate, loading: creating } = usePostProcessTemplateCreate();
  const { mutate: updateTemplate, loading: updating } = usePatchProcessTemplateUpdateById();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [entityType, setEntityType] = useState<ProcessEntityType>("estate");
  const [triggerType, setTriggerType] = useState<ProcessTriggerType>("manual");
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>({});
  const [steps, setSteps] = useState<ProcessStep[]>(DEFAULT_STEPS);
  const [selectedStepKey, setSelectedStepKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(stepsToNodes(steps, null));
  const [edges, setEdges, onEdgesChange] = useEdgesState(stepsToEdges(steps));

  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null);

  // Load template data when editing
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description ?? "");
      setEntityType(template.entity_type as ProcessEntityType);
      setTriggerType(template.trigger_type as ProcessTriggerType);
      setTriggerConfig(template.trigger_config ?? {});
      const loadedSteps = template.steps ?? DEFAULT_STEPS;
      setSteps(loadedSteps);
      setNodes(stepsToNodes(loadedSteps, null));
      setEdges(stepsToEdges(loadedSteps));
    }
  }, [template, setNodes, setEdges]);

  // Sync nodes/edges when steps change
  const syncFlowFromSteps = useCallback(
    (newSteps: ProcessStep[], selected: string | null) => {
      setNodes(stepsToNodes(newSteps, selected));
      setEdges(stepsToEdges(newSteps));
    },
    [setNodes, setEdges],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed }, style: { strokeWidth: 2 } }, eds));

      // Update step references
      setSteps((prev) => {
        const sourceStep = prev.find((s) => s.key === connection.source);
        if (!sourceStep || !connection.target) return prev;

        return prev.map((s) => {
          if (s.key !== connection.source) return s;
          if (connection.sourceHandle === "yes") {
            return { ...s, next_yes: connection.target ?? undefined };
          }
          if (connection.sourceHandle === "no") {
            return { ...s, next_no: connection.target ?? undefined };
          }
          return { ...s, next: connection.target ?? undefined };
        });
      });
    },
    [setEdges],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedStepKey(node.id);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, selected: n.id === node.id },
        })),
      );
    },
    [setNodes],
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSteps((prev) =>
        prev.map((s) =>
          s.key === node.id
            ? { ...s, position: { x: node.position.x, y: node.position.y } }
            : s,
        ),
      );
    },
    [],
  );

  const handleAddStep = useCallback(
    (type: string) => {
      setAddMenuAnchor(null);
      const key = generateKey();
      const maxY = Math.max(...steps.map((s) => s.position?.y ?? 0), 0);
      const newStep: ProcessStep = {
        key,
        type: type as ProcessStep["type"],
        label: t(`processes.step_types.${type}`),
        config: {},
        position: { x: 250, y: maxY + 120 },
      };
      const newSteps = [...steps, newStep];
      setSteps(newSteps);
      setSelectedStepKey(key);
      syncFlowFromSteps(newSteps, key);
    },
    [steps, syncFlowFromSteps, t],
  );

  const handleStepChange = useCallback(
    (updated: ProcessStep) => {
      const newSteps = steps.map((s) => (s.key === updated.key ? updated : s));
      setSteps(newSteps);
      syncFlowFromSteps(newSteps, selectedStepKey);
    },
    [steps, selectedStepKey, syncFlowFromSteps],
  );

  const handleDeleteStep = useCallback(
    (stepKey: string) => {
      const newSteps = steps
        .filter((s) => s.key !== stepKey)
        .map((s) => ({
          ...s,
          next: s.next === stepKey ? undefined : s.next,
          next_yes: s.next_yes === stepKey ? undefined : s.next_yes,
          next_no: s.next_no === stepKey ? undefined : s.next_no,
        }));
      setSteps(newSteps);
      setSelectedStepKey(null);
      syncFlowFromSteps(newSteps, null);
    },
    [steps, syncFlowFromSteps],
  );

  const selectedStep = useMemo(
    () => steps.find((s) => s.key === selectedStepKey) ?? null,
    [steps, selectedStepKey],
  );

  const handleSave = useCallback(async () => {
    setSaveError(null);
    try {
      const body = {
        name,
        description: description || undefined,
        entity_type: entityType,
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        steps,
      };

      if (isNew) {
        const result = await createTemplate({ body });
        if (result) {
          navigate(`/processes/${result.id}/edit`, { replace: true });
        }
      } else {
        await updateTemplate({ id: id!, body });
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    }
  }, [name, description, entityType, triggerType, triggerConfig, steps, isNew, id, createTemplate, updateTemplate, navigate]);

  if (!isNew && loadingTemplate) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="rectangular" height={600} sx={{ mt: 2, borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 1px)" }}>
      {/* Top bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 3,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <IconButton onClick={() => navigate("/processes")} size="small">
          <ArrowLeft size={20} />
        </IconButton>

        <TextField
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("processes.template_name")}
          size="small"
          variant="standard"
          sx={{ minWidth: 200 }}
          slotProps={{ input: { sx: { fontSize: "1.1rem", fontWeight: 600 } } }}
        />

        <Box sx={{ flex: 1 }} />

        <ProcessTriggerConfigForm
          entityType={entityType}
          triggerType={triggerType}
          triggerConfig={triggerConfig}
          onEntityTypeChange={setEntityType}
          onTriggerTypeChange={setTriggerType}
          onTriggerConfigChange={setTriggerConfig}
        />

        <Button
          variant="contained"
          startIcon={<Save size={16} />}
          onClick={handleSave}
          disabled={creating || updating || !name.trim()}
        >
          {creating || updating ? t("processes.saving") : t("processes.save_template")}
        </Button>
      </Box>

      {saveError && (
        <Alert severity="error" sx={{ mx: 3, mt: 1 }}>
          {saveError}
        </Alert>
      )}

      {/* Canvas + config panel */}
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Box sx={{ flex: 1, position: "relative" }}>
          {/* Add step button */}
          <Box sx={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Plus size={16} />}
              onClick={(e) => setAddMenuAnchor(e.currentTarget)}
              sx={{ bgcolor: "background.paper" }}
            >
              {t("processes.builder.add_step")}
            </Button>
            <Menu
              anchorEl={addMenuAnchor}
              open={Boolean(addMenuAnchor)}
              onClose={() => setAddMenuAnchor(null)}
            >
              {STEP_TYPE_OPTIONS.map((type) => (
                <MenuItem key={type} onClick={() => handleAddStep(type)}>
                  {t(`processes.step_types.${type}`)}
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode="Delete"
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </Box>

        {selectedStep && (
          <ProcessStepConfigPanel
            step={selectedStep}
            onChange={handleStepChange}
            onDelete={handleDeleteStep}
          />
        )}
      </Box>
    </Box>
  );
}
