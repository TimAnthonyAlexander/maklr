import { Chip } from "@mui/material";
import { colors } from "../../theme/colors";
import { useTranslation } from "../../contexts/LanguageContext";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: colors.status.draft.bg, color: colors.status.draft.text },
  active: { bg: colors.status.success.bg, color: colors.status.success.text },
  reserved: { bg: colors.status.warning.bg, color: colors.status.warning.text },
  sold: { bg: colors.status.info.bg, color: colors.status.info.text },
  rented: { bg: colors.status.info.bg, color: colors.status.info.text },
  archived: { bg: colors.status.neutral.bg, color: colors.status.neutral.text },
};

const STATUS_KEYS: Record<string, string> = {
  draft: "estate.status_draft",
  active: "estate.status_active",
  reserved: "estate.status_reserved",
  sold: "estate.status_sold",
  rented: "estate.status_rented",
  archived: "estate.status_archived",
};

const PROPERTY_TYPE_KEYS: Record<string, string> = {
  apartment: "estate.property_type_apartment",
  house: "estate.property_type_house",
  commercial: "estate.property_type_commercial",
  land: "estate.property_type_land",
  garage: "estate.property_type_garage",
};

const MARKETING_TYPE_KEYS: Record<string, string> = {
  sale: "estate.marketing_type_sale",
  rent: "estate.marketing_type_rent",
  lease: "estate.marketing_type_lease",
};

interface EstateStatusChipProps {
  status: string;
}

export function EstateStatusChip({ status }: EstateStatusChipProps) {
  const { t } = useTranslation();
  const chipColors = STATUS_COLORS[status] ?? STATUS_COLORS.draft;
  const label = STATUS_KEYS[status]
    ? t(STATUS_KEYS[status])
    : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        bgcolor: chipColors.bg,
        color: chipColors.color,
        fontWeight: 500,
        fontSize: "0.75rem",
      }}
    />
  );
}

interface TypeLabelProps {
  value: string;
}

export function PropertyTypeLabel({ value }: TypeLabelProps) {
  const { t } = useTranslation();
  const label = PROPERTY_TYPE_KEYS[value]
    ? t(PROPERTY_TYPE_KEYS[value])
    : value;
  return (
    <Chip
      label={label}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 500, fontSize: "0.75rem" }}
    />
  );
}

export function MarketingTypeLabel({ value }: TypeLabelProps) {
  const { t } = useTranslation();
  const label = MARKETING_TYPE_KEYS[value]
    ? t(MARKETING_TYPE_KEYS[value])
    : value;
  return (
    <Chip
      label={label}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 500, fontSize: "0.75rem" }}
    />
  );
}
