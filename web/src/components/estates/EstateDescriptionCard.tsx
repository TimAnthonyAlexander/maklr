import { Paper, Typography } from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";
import type { Estate } from "../../api/types";

interface EstateDescriptionCardProps {
  estate: Estate;
}

export function EstateDescriptionCard({ estate }: EstateDescriptionCardProps) {
  const { t } = useTranslation();
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        {t("estate.detail_description")}
      </Typography>
      {estate.description ? (
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {estate.description}
        </Typography>
      ) : (
        <Typography variant="body2" sx={{ color: "text.disabled" }}>
          {"\u2014"}
        </Typography>
      )}
    </Paper>
  );
}
