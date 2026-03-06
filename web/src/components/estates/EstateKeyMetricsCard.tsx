import { Paper, Typography, Grid } from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";
import { EstateMetric } from "./EstateMetric";
import type { Estate } from "../../api/types";

const priceFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

interface EstateKeyMetricsCardProps {
  estate: Estate;
}

export function EstateKeyMetricsCard({ estate }: EstateKeyMetricsCardProps) {
  const { t } = useTranslation();
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        {t("estate.detail_key_metrics")}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <EstateMetric
            label={t("estate.field_price")}
            value={
              estate.price != null ? priceFormatter.format(estate.price) : null
            }
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <EstateMetric
            label={t("estate.label_total_area")}
            value={estate.area_total}
            suffix="m²"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <EstateMetric
            label={t("estate.label_living_area")}
            value={estate.area_living}
            suffix="m²"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <EstateMetric
            label={t("estate.label_plot_area")}
            value={estate.area_plot}
            suffix="m²"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <EstateMetric label={t("estate.field_rooms")} value={estate.rooms} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <EstateMetric label={t("estate.field_bedrooms")} value={estate.bedrooms} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <EstateMetric label={t("estate.field_bathrooms")} value={estate.bathrooms} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <EstateMetric label={t("estate.field_parking_spaces")} value={estate.parking_spaces} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <EstateMetric label={t("estate.field_year_built")} value={estate.year_built} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <EstateMetric label={t("estate.field_floor")} value={estate.floor} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <EstateMetric label={t("estate.field_floors_total")} value={estate.floors_total} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <EstateMetric label={t("estate.field_external_id")} value={estate.external_id} />
        </Grid>
      </Grid>
    </Paper>
  );
}
