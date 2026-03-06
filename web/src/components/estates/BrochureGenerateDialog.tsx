import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  Skeleton,
  Alert,
  CircularProgress,
  Checkbox,
} from "@mui/material";
import { Plus, X, RefreshCw } from "lucide-react";
import type { Estate, EstateImage, BrochureContent } from "../../api/types";
import {
  usePostBrochureContentGenerate,
  usePostBrochureCreate,
} from "../../api/hooks";
import { getEstateImageUrl } from "../../api/client";
import { useTranslation } from "../../contexts/LanguageContext";

const TONES = ["neutral", "luxurious", "factual", "playful"] as const;

interface BrochureGenerateDialogProps {
  open: boolean;
  onClose: () => void;
  estate: Estate;
  images: EstateImage[];
  onCreated: () => void;
}

export function BrochureGenerateDialog({
  open,
  onClose,
  estate,
  images,
  onCreated,
}: BrochureGenerateDialogProps) {
  const { t } = useTranslation();
  const generateMutation = usePostBrochureContentGenerate();
  const createMutation = usePostBrochureCreate();

  const [tone, setTone] = useState<string>("neutral");
  const [content, setContent] = useState<BrochureContent | null>(null);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [phase, setPhase] = useState<"generating" | "editing" | "creating">(
    "generating",
  );

  const galleryImages = images.filter((img) => img.category !== "floor_plan");

  const generate = useCallback(
    async (selectedTone: string) => {
      setPhase("generating");
      try {
        const result = await generateMutation.mutate({
          estateId: estate.id,
          body: { tone: selectedTone },
        });
        setContent(result);
        setPhase("editing");
      } catch {
        setPhase("editing");
      }
    },
    [estate.id, generateMutation],
  );

  useEffect(() => {
    if (open) {
      setContent(null);
      setTone("neutral");
      setSelectedImageIds(galleryImages.map((img) => img.id));
      generateMutation.reset();
      createMutation.reset();
      generate("neutral");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleToneChange = useCallback(
    (newTone: string) => {
      setTone(newTone);
      generate(newTone);
    },
    [generate],
  );

  const updateField = useCallback(
    (field: keyof BrochureContent, value: string | string[]) => {
      if (!content) return;
      setContent({ ...content, [field]: value });
    },
    [content],
  );

  const addHighlight = useCallback(() => {
    if (!content) return;
    setContent({ ...content, highlights: [...content.highlights, ""] });
  }, [content]);

  const removeHighlight = useCallback(
    (index: number) => {
      if (!content) return;
      setContent({
        ...content,
        highlights: content.highlights.filter((_, i) => i !== index),
      });
    },
    [content],
  );

  const updateHighlight = useCallback(
    (index: number, value: string) => {
      if (!content) return;
      const updated = content.highlights.map((h, i) =>
        i === index ? value : h,
      );
      setContent({ ...content, highlights: updated });
    },
    [content],
  );

  const toggleImage = useCallback(
    (imageId: string) => {
      setSelectedImageIds((prev) =>
        prev.includes(imageId)
          ? prev.filter((id) => id !== imageId)
          : [...prev, imageId],
      );
    },
    [],
  );

  const handleCreate = useCallback(async () => {
    if (!content) return;
    setPhase("creating");
    try {
      await createMutation.mutate({
        estateId: estate.id,
        body: {
          headline: content.headline,
          description: content.description,
          highlights: content.highlights.filter((h) => h.trim() !== ""),
          location_summary: content.location_summary,
          call_to_action: content.call_to_action,
          image_ids: selectedImageIds,
        },
      });
      onCreated();
      onClose();
    } catch {
      setPhase("editing");
    }
  }, [content, estate.id, selectedImageIds, createMutation, onCreated, onClose]);

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
          {t("estate.brochure_generate_title")}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {phase === "generating" && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxWidth: 700,
              mx: "auto",
              mt: 4,
            }}
          >
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="rectangular" height={120} />
            <Skeleton variant="text" width="40%" height={30} />
            <Skeleton variant="rectangular" height={80} />
            <Skeleton variant="text" width="50%" height={30} />
            <Skeleton variant="rectangular" height={60} />
          </Box>
        )}

        {generateMutation.error && phase === "editing" && !content && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {generateMutation.error.message}
          </Alert>
        )}

        {(phase === "editing" || phase === "creating") && content && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              maxWidth: 700,
              mx: "auto",
            }}
          >
            {/* Tone selector */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500, mr: 1 }}>
                {t("estate.brochure_tone")}:
              </Typography>
              {TONES.map((toneOption) => (
                <Chip
                  key={toneOption}
                  label={toneOption.charAt(0).toUpperCase() + toneOption.slice(1)}
                  onClick={() => handleToneChange(toneOption)}
                  variant={tone === toneOption ? "filled" : "outlined"}
                  color={tone === toneOption ? "primary" : "default"}
                  size="small"
                />
              ))}
              <Button
                size="small"
                startIcon={<RefreshCw size={14} />}
                onClick={() => generate(tone)}
                disabled={generateMutation.loading}
              >
                {t("estate.brochure_regenerate")}
              </Button>
            </Box>

            {/* Headline */}
            <TextField
              label={t("estate.brochure_headline")}
              value={content.headline}
              onChange={(e) => updateField("headline", e.target.value)}
              fullWidth
              disabled={phase === "creating"}
            />

            {/* Description */}
            <TextField
              label={t("estate.brochure_description")}
              value={content.description}
              onChange={(e) => updateField("description", e.target.value)}
              fullWidth
              multiline
              rows={5}
              disabled={phase === "creating"}
            />

            {/* Highlights */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                {t("estate.brochure_highlights")}
              </Typography>
              {content.highlights.map((highlight, index) => (
                <Box
                  key={index}
                  sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}
                >
                  <TextField
                    value={highlight}
                    onChange={(e) => updateHighlight(index, e.target.value)}
                    fullWidth
                    size="small"
                    disabled={phase === "creating"}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeHighlight(index)}
                    disabled={phase === "creating"}
                  >
                    <X size={16} />
                  </IconButton>
                </Box>
              ))}
              <Button
                size="small"
                startIcon={<Plus size={14} />}
                onClick={addHighlight}
                disabled={phase === "creating"}
              >
                {t("estate.brochure_add_highlight")}
              </Button>
            </Box>

            {/* Location Summary */}
            <TextField
              label={t("estate.brochure_location_summary")}
              value={content.location_summary}
              onChange={(e) => updateField("location_summary", e.target.value)}
              fullWidth
              multiline
              rows={2}
              disabled={phase === "creating"}
            />

            {/* Call to Action */}
            <TextField
              label={t("estate.brochure_call_to_action")}
              value={content.call_to_action}
              onChange={(e) => updateField("call_to_action", e.target.value)}
              fullWidth
              multiline
              rows={2}
              disabled={phase === "creating"}
            />

            {/* Fact Sheet (read-only) */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                {t("estate.brochure_fact_sheet")}
              </Typography>
              <Box
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "action.hover",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {estate.property_type &&
                    `${estate.property_type.charAt(0).toUpperCase() + estate.property_type.slice(1)} \u2022 `}
                  {estate.marketing_type &&
                    `${estate.marketing_type.charAt(0).toUpperCase() + estate.marketing_type.slice(1)} \u2022 `}
                  {estate.rooms != null && `${estate.rooms} rooms \u2022 `}
                  {estate.area_living != null &&
                    `${estate.area_living} m\u00B2 \u2022 `}
                  {estate.city && `${estate.city}`}
                </Typography>
              </Box>
            </Box>

            {/* Image Selection */}
            {galleryImages.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  {t("estate.brochure_select_images")}
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: 1,
                  }}
                >
                  {galleryImages.map((img) => (
                    <Box
                      key={img.id}
                      onClick={() => toggleImage(img.id)}
                      sx={{
                        position: "relative",
                        cursor: "pointer",
                        borderRadius: 1,
                        overflow: "hidden",
                        border: "2px solid",
                        borderColor: selectedImageIds.includes(img.id)
                          ? "primary.main"
                          : "divider",
                        opacity: selectedImageIds.includes(img.id) ? 1 : 0.5,
                        transition: "all 0.2s",
                      }}
                    >
                      <Box
                        component="img"
                        src={getEstateImageUrl(estate.id, img.id)}
                        sx={{
                          width: "100%",
                          height: 80,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <Checkbox
                        checked={selectedImageIds.includes(img.id)}
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          p: 0.25,
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {createMutation.error && (
              <Alert severity="error">{createMutation.error.message}</Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={phase === "creating"}>
          {t("estate.brochure_cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={phase !== "editing" || !content}
          startIcon={
            phase === "creating" ? <CircularProgress size={16} /> : null
          }
        >
          {phase === "creating"
            ? t("estate.brochure_creating_pdf")
            : t("estate.brochure_create_pdf")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
