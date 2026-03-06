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
import { usePostEstateDescriptionGenerate } from "../../api/hooks";
import { useTranslation } from "../../contexts/LanguageContext";

interface EstateFormData {
  title: string;
  property_type: string;
  marketing_type: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  area_total: string;
  area_living: string;
  area_plot: string;
  floor: string;
  floors_total: string;
  year_built: string;
  parking_spaces: string;
  heating_type: string;
  energy_rating: string;
  condition: string;
  furnished: boolean;
  balcony: boolean;
  garden: boolean;
  elevator: boolean;
  cellar: boolean;
  street: string;
  house_number: string;
  zip: string;
  city: string;
  country: string;
}

interface AiDescriptionDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (description: string) => void;
  estateData: EstateFormData;
}

const TONES = ["luxurious", "neutral", "factual", "playful"] as const;

export function AiDescriptionDialog({
  open,
  onClose,
  onGenerated,
  estateData,
}: AiDescriptionDialogProps) {
  const { t } = useTranslation();
  const [tone, setTone] = useState<string>("neutral");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const generateMutation = usePostEstateDescriptionGenerate();

  const handleGenerate = useCallback(async () => {
    const numOrNull = (v: string) => (v === "" ? null : Number(v));
    const strOrNull = (v: string) => (v === "" ? null : v);

    const estateDataPayload: Record<string, unknown> = {
      title: strOrNull(estateData.title),
      property_type: estateData.property_type,
      marketing_type: estateData.marketing_type,
      rooms: numOrNull(estateData.rooms),
      bedrooms: numOrNull(estateData.bedrooms),
      bathrooms: numOrNull(estateData.bathrooms),
      area_total: numOrNull(estateData.area_total),
      area_living: numOrNull(estateData.area_living),
      area_plot: numOrNull(estateData.area_plot),
      floor: numOrNull(estateData.floor),
      floors_total: numOrNull(estateData.floors_total),
      year_built: numOrNull(estateData.year_built),
      parking_spaces: numOrNull(estateData.parking_spaces),
      heating_type: strOrNull(estateData.heating_type),
      energy_rating: strOrNull(estateData.energy_rating),
      condition: strOrNull(estateData.condition),
      furnished: estateData.furnished,
      balcony: estateData.balcony,
      garden: estateData.garden,
      elevator: estateData.elevator,
      cellar: estateData.cellar,
      street: strOrNull(estateData.street),
      house_number: strOrNull(estateData.house_number),
      zip: strOrNull(estateData.zip),
      city: strOrNull(estateData.city),
      country: strOrNull(estateData.country),
    };

    try {
      const result = await generateMutation.mutate({
        body: {
          estate_data: estateDataPayload,
          tone,
          additional_notes: additionalNotes || undefined,
        },
      });
      if (result) {
        onGenerated(result.description);
        setTone("neutral");
        setAdditionalNotes("");
      }
    } catch {
      // error surfaced via mutation
    }
  }, [estateData, tone, additionalNotes, generateMutation, onGenerated]);

  const handleClose = useCallback(() => {
    if (!generateMutation.loading) {
      onClose();
      setTone("neutral");
      setAdditionalNotes("");
      generateMutation.reset();
    }
  }, [generateMutation, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Sparkles size={20} />
        {t("estate.ai_generate_title")}
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
          <InputLabel>{t("estate.ai_tone")}</InputLabel>
          <Select
            value={tone}
            label={t("estate.ai_tone")}
            onChange={(e) => setTone(e.target.value)}
          >
            {TONES.map((t_) => (
              <MenuItem key={t_} value={t_}>
                {t(`estate.ai_tone_${t_}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={3}
          label={t("estate.ai_additional_notes")}
          placeholder={t("estate.ai_additional_notes_placeholder")}
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          helperText={`${additionalNotes.length}/300`}
          slotProps={{
            htmlInput: { maxLength: 300 },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={generateMutation.loading}
          size="small"
        >
          {t("estate.form_cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={generateMutation.loading}
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
            ? t("estate.ai_generating")
            : t("estate.ai_generate")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
