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
import type { PostEmailDraftGenerateResponse } from "../../api/types";
import { usePostEmailDraftGenerate } from "../../api/hooks";
import { useTranslation } from "../../contexts/LanguageContext";

interface AiDraftDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (result: PostEmailDraftGenerateResponse) => void;
  contactId?: string | null;
  estateId?: string | null;
}

const INTENTS = [
  "follow_up_viewing",
  "price_update",
  "new_listing_match",
  "document_request",
  "viewing_invitation",
  "general_follow_up",
  "custom",
] as const;

export function AiDraftDialog({
  open,
  onClose,
  onGenerated,
  contactId,
  estateId,
}: AiDraftDialogProps) {
  const { t } = useTranslation();
  const [intent, setIntent] = useState<string>("follow_up_viewing");
  const [contextNotes, setContextNotes] = useState("");
  const generateMutation = usePostEmailDraftGenerate();

  const isCustom = intent === "custom";
  const notesValid = !isCustom || contextNotes.length >= 10;

  const handleGenerate = useCallback(async () => {
    try {
      const result = await generateMutation.mutate({
        body: {
          intent,
          contact_id: contactId || null,
          estate_id: estateId || null,
          context_notes: contextNotes || null,
        },
      });
      if (result) {
        onGenerated(result);
        setIntent("follow_up_viewing");
        setContextNotes("");
      }
    } catch {
      // error surfaced via mutation
    }
  }, [intent, contactId, estateId, contextNotes, generateMutation, onGenerated]);

  const handleClose = useCallback(() => {
    if (!generateMutation.loading) {
      onClose();
      setIntent("follow_up_viewing");
      setContextNotes("");
      generateMutation.reset();
    }
  }, [generateMutation, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Sparkles size={20} />
        {t("email.ai_draft_title")}
      </DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
      >
        {generateMutation.error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {generateMutation.error.message}
          </Alert>
        )}

        <FormControl size="small" fullWidth sx={{ mt: 1 }}>
          <InputLabel>{t("email.ai_draft_intent")}</InputLabel>
          <Select
            value={intent}
            label={t("email.ai_draft_intent")}
            onChange={(e) => setIntent(e.target.value)}
          >
            {INTENTS.map((i) => (
              <MenuItem key={i} value={i}>
                {t(`email.ai_draft_intent_${i}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={3}
          size="small"
          label={t("email.ai_draft_context_notes")}
          placeholder={t("email.ai_draft_context_notes_placeholder")}
          value={contextNotes}
          onChange={(e) => setContextNotes(e.target.value)}
          helperText={`${contextNotes.length}/500`}
          required={isCustom}
          slotProps={{
            htmlInput: { maxLength: 500 },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={generateMutation.loading}
          size="small"
        >
          {t("email.cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={!notesValid || generateMutation.loading}
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
            ? t("email.ai_draft_generating")
            : t("email.ai_draft_generate")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
