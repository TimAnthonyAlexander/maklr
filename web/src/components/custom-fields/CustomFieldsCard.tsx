import { Box, Paper, Typography } from "@mui/material";
import { useGetCustomFieldDefinitionList } from "../../api/hooks";
import type { CustomFieldDefinition } from "../../api/types";
import { useTranslation } from "../../contexts/LanguageContext";

interface CustomFieldsCardProps {
  entityType: "estate" | "contact";
  values: Record<string, unknown> | null | undefined;
}

function formatValue(def: CustomFieldDefinition, value: unknown): string {
  if (value == null || value === "") return "\u2014";

  switch (def.field_type) {
    case "boolean":
      return value ? "Yes" : "No";
    case "date":
      if (typeof value === "string") {
        try {
          return new Intl.DateTimeFormat("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(new Date(value));
        } catch {
          return String(value);
        }
      }
      return String(value);
    default:
      return String(value);
  }
}

export function CustomFieldsCard({
  entityType,
  values,
}: CustomFieldsCardProps) {
  const { t } = useTranslation();
  const { data } = useGetCustomFieldDefinitionList({
    entity_type: entityType,
    active: "1",
    per_page: 100,
  });

  const definitions = data?.items ?? [];

  if (definitions.length === 0) {
    return null;
  }

  const sorted = [...definitions].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  const fieldValues = values ?? {};

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        {t("custom_fields.card_title")}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        {sorted.map((def) => {
          const name = def.name ?? "";
          const value = fieldValues[name];
          const formatted = formatValue(def, value);
          const isEmpty = formatted === "\u2014";

          return (
            <Box key={name}>
              <Typography variant="caption" color="text.secondary">
                {def.label}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 500,
                  color: isEmpty ? "text.disabled" : "text.primary",
                }}
              >
                {formatted}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
