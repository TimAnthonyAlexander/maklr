import { Box, Paper, Typography, Grid, Chip } from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";
import { EstateMetric } from "./EstateMetric";
import type { Estate } from "../../api/types";

const BOOLEAN_FEATURES = [
  { key: "furnished" as const, labelKey: "estate.field_furnished" },
  { key: "balcony" as const, labelKey: "estate.field_balcony" },
  { key: "garden" as const, labelKey: "estate.field_garden" },
  { key: "elevator" as const, labelKey: "estate.field_elevator" },
  { key: "cellar" as const, labelKey: "estate.field_cellar" },
] as const;

interface EstateFeaturesCardProps {
  estate: Estate;
}

export function EstateFeaturesCard({ estate }: EstateFeaturesCardProps) {
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        {t("estate.form_section_features")}
      </Typography>
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <EstateMetric label={t("estate.field_heating_type")} value={estate.heating_type} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <EstateMetric label={t("estate.field_energy_rating")} value={estate.energy_rating} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <EstateMetric label={t("estate.field_condition")} value={estate.condition} />
        </Grid>
      </Grid>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        {BOOLEAN_FEATURES.map(({ key, labelKey }) => (
          <Chip
            key={key}
            label={t(labelKey)}
            size="small"
            variant={estate[key] ? "filled" : "outlined"}
            color={estate[key] ? "primary" : "default"}
            sx={{ opacity: estate[key] ? 1 : 0.5 }}
          />
        ))}
      </Box>
      <EstateMetric label={t("estate.label_virtual_tour")} value={estate.virtual_tour_url} />
    </Paper>
  );
}
