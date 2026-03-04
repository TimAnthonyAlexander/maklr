import { Chip } from "@mui/material";
import { colors } from "../../theme/colors";

const STAGE_COLORS: Record<string, { bg: string; color: string }> = {
  cold: { bg: colors.status.info.bg, color: colors.status.info.text },
  warm: { bg: colors.status.warning.bg, color: colors.status.warning.text },
  hot: { bg: colors.status.error.bg, color: colors.status.error.text },
  customer: { bg: colors.status.success.bg, color: colors.status.success.text },
  lost: { bg: colors.status.neutral.bg, color: colors.status.neutral.text },
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  buyer: { bg: colors.contactType.buyer.bg, color: colors.contactType.buyer.text },
  seller: { bg: colors.contactType.seller.bg, color: colors.contactType.seller.text },
  tenant: { bg: colors.contactType.tenant.bg, color: colors.contactType.tenant.text },
  landlord: { bg: colors.contactType.landlord.bg, color: colors.contactType.landlord.text },
  misc: { bg: colors.contactType.misc.bg, color: colors.contactType.misc.text },
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

interface ContactStageChipProps {
  stage: string;
}

export function ContactStageChip({ stage }: ContactStageChipProps) {
  const colors = STAGE_COLORS[stage] ?? STAGE_COLORS.cold;
  return (
    <Chip
      label={capitalize(stage)}
      size="small"
      sx={{
        bgcolor: colors.bg,
        color: colors.color,
        fontWeight: 500,
        fontSize: "0.75rem",
      }}
    />
  );
}

interface ContactTypeChipProps {
  type: string;
}

export function ContactTypeChip({ type }: ContactTypeChipProps) {
  const colors = TYPE_COLORS[type] ?? TYPE_COLORS.misc;
  return (
    <Chip
      label={capitalize(type)}
      size="small"
      sx={{
        bgcolor: colors.bg,
        color: colors.color,
        fontWeight: 500,
        fontSize: "0.75rem",
      }}
    />
  );
}
