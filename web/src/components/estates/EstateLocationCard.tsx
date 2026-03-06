import { Box, Paper, Typography, Grid } from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";
import { EstateMetric } from "./EstateMetric";
import { EstateLocationMap } from "./EstateLocationMap";
import type { Estate } from "../../api/types";

interface EstateLocationCardProps {
  estate: Estate;
}

export function EstateLocationCard({ estate }: EstateLocationCardProps) {
  const { t } = useTranslation();
  const streetLine = [estate.street, estate.house_number]
    .filter(Boolean)
    .join(" ");
  const cityLine = [estate.zip, estate.city].filter(Boolean).join(" ");

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        {t("estate.form_section_location")}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <EstateMetric label={t("estate.field_street")} value={streetLine || null} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <EstateMetric label={t("estate.field_city")} value={cityLine || null} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <EstateMetric label={t("estate.field_country")} value={estate.country} />
        </Grid>
      </Grid>
      {estate.latitude != null && estate.longitude != null && (
        <Box sx={{ mt: 2, borderRadius: 3, overflow: "hidden" }}>
          <EstateLocationMap
            latitude={estate.latitude}
            longitude={estate.longitude}
            title={estate.title}
          />
        </Box>
      )}
    </Paper>
  );
}
