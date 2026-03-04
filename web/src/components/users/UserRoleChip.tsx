import { Chip, type ChipProps } from "@mui/material";

const ROLE_CONFIG: Record<string, { label: string; color: ChipProps["color"] }> =
  {
    admin: { label: "Admin", color: "error" },
    manager: { label: "Manager", color: "primary" },
    agent: { label: "Agent", color: "success" },
    readonly: { label: "Read-only", color: "default" },
    guest: { label: "Guest", color: "default" },
  };

interface UserRoleChipProps {
  role: string;
}

export function UserRoleChip({ role }: UserRoleChipProps) {
  const config = ROLE_CONFIG[role] ?? { label: role, color: "default" as const };

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 500, fontSize: "0.75rem" }}
    />
  );
}
