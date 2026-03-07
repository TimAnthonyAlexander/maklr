import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Alert,
} from "@mui/material";
import { Plus, Workflow } from "lucide-react";
import { useGetEstateProcesses, useGetContactProcesses } from "../../api/hooks";
import { ProcessStatusBadge } from "./ProcessStatusBadge";
import { StartProcessDialog } from "./StartProcessDialog";
import { useTranslation } from "../../contexts/LanguageContext";
import type { ProcessEntityType } from "../../api/types";

interface EntityProcessesTabProps {
  entityType: ProcessEntityType;
  entityId: string;
}

export function EntityProcessesTab({ entityType, entityId }: EntityProcessesTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [startDialogOpen, setStartDialogOpen] = useState(false);

  const estateResult = useGetEstateProcesses(
    entityType === "estate" ? entityId : null,
  );
  const contactResult = useGetContactProcesses(
    entityType === "contact" ? entityId : null,
  );

  const result = entityType === "estate" ? estateResult : contactResult;
  const { data, loading, error, refetch } = result;
  const items = data?.items ?? [];

  const handleSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          {t("processes.instances")}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Plus size={16} />}
          onClick={() => setStartDialogOpen(true)}
        >
          {t("processes.start_process")}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("processes.col_template")}</TableCell>
              <TableCell>{t("processes.col_status")}</TableCell>
              <TableCell>{t("processes.col_current_step")}</TableCell>
              <TableCell>{t("processes.col_started")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: "center", py: 4 }}>
                  <Workflow
                    size={32}
                    strokeWidth={1}
                    style={{ opacity: 0.3, marginBottom: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {t("processes.empty_instances")}
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              items.map((instance) => (
                <TableRow
                  key={instance.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/process-instances/${instance.id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {instance.template?.name ?? "\u2014"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <ProcessStatusBadge status={instance.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {instance.current_step_key ?? "\u2014"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {instance.started_at
                        ? new Date(instance.started_at).toLocaleString()
                        : "\u2014"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <StartProcessDialog
        open={startDialogOpen}
        onClose={() => setStartDialogOpen(false)}
        onSuccess={handleSuccess}
        entityType={entityType}
        entityId={entityId}
      />
    </Box>
  );
}
