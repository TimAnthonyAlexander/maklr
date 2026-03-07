import { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
} from "@mui/material";
import { useGetProcessTemplateList, usePostProcessInstanceCreate } from "../../api/hooks";
import { useTranslation } from "../../contexts/LanguageContext";
import type { ProcessEntityType } from "../../api/types";

interface StartProcessDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entityType: ProcessEntityType;
  entityId: string;
}

export function StartProcessDialog({
  open,
  onClose,
  onSuccess,
  entityType,
  entityId,
}: StartProcessDialogProps) {
  const { t } = useTranslation();
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const { data: templatesData } = useGetProcessTemplateList(
    { entity_type: entityType, active: "true" },
    { enabled: open },
  );
  const templates = templatesData?.items ?? [];

  const { mutate: createInstance, loading: creating } = usePostProcessInstanceCreate({
    onSuccess: () => {
      setSelectedTemplateId("");
      onSuccess();
      onClose();
    },
  });

  const handleSubmit = useCallback(async () => {
    if (!selectedTemplateId) return;
    try {
      await createInstance({
        body: {
          process_template_id: selectedTemplateId,
          entity_type: entityType,
          entity_id: entityId,
        },
      });
    } catch {
      // error handled by hook
    }
  }, [selectedTemplateId, entityType, entityId, createInstance]);

  const handleClose = useCallback(() => {
    setSelectedTemplateId("");
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("processes.start_process_title")}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            select
            label={t("processes.select_template")}
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            fullWidth
            size="small"
          >
            {templates.map((tmpl) => (
              <MenuItem key={tmpl.id} value={tmpl.id}>
                {tmpl.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={creating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={creating || !selectedTemplateId}
        >
          {creating ? t("processes.starting") : t("processes.start_process")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
