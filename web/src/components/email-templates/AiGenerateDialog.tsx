import { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Sparkles } from "lucide-react";
import type { PostEmailTemplateGenerateResponse } from "../../api/types";
import { usePostEmailTemplateGenerate } from "../../api/hooks";
import { useTranslation } from "../../contexts/LanguageContext";

interface AiGenerateDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (result: PostEmailTemplateGenerateResponse) => void;
  category?: string;
}

const TONES = ["professional", "friendly", "casual", "formal"] as const;

export function AiGenerateDialog({
  open,
  onClose,
  onGenerated,
  category,
}: AiGenerateDialogProps) {
  const { t } = useTranslation();
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState<string>("professional");
  const generateMutation = usePostEmailTemplateGenerate();

  const handleGenerate = useCallback(async () => {
    try {
      const result = await generateMutation.mutate({
        body: {
          description,
          tone,
          category: category || null,
        },
      });
      if (result) {
        onGenerated(result);
        setDescription("");
        setTone("professional");
      }
    } catch {
      // error surfaced via mutation
    }
  }, [description, tone, category, generateMutation, onGenerated]);

  const handleClose = useCallback(() => {
    if (!generateMutation.loading) {
      onClose();
      setDescription("");
      setTone("professional");
      generateMutation.reset();
    }
  }, [generateMutation, onClose]);

  const descriptionValid =
    description.length >= 10 && description.length <= 500;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Sparkles size={20} />
        {t("email_templates.ai_generate_title")}
      </DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
      >
        {generateMutation.error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {generateMutation.error.message}
          </Alert>
        )}

        <TextField
          fullWidth
          multiline
          rows={4}
          label={t("email_templates.ai_description")}
          placeholder={t("email_templates.ai_description_placeholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          helperText={`${description.length}/500`}
          slotProps={{
            htmlInput: { maxLength: 500 },
          }}
          sx={{ mt: 1 }}
        />

        <FormControl size="small" fullWidth>
          <InputLabel>{t("email_templates.ai_tone")}</InputLabel>
          <Select
            value={tone}
            label={t("email_templates.ai_tone")}
            onChange={(e) => setTone(e.target.value)}
          >
            {TONES.map((t_) => (
              <MenuItem key={t_} value={t_}>
                {t(`email_templates.ai_tone_${t_}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={generateMutation.loading}
          size="small"
        >
          {t("email_templates.cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={!descriptionValid || generateMutation.loading}
          startIcon={
            generateMutation.loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <Sparkles size={18} />
            )
          }
          size="small"
        >
          {generateMutation.loading
            ? t("email_templates.ai_generating")
            : t("email_templates.ai_generate")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
