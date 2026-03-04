import { Paper, Typography, Box, Skeleton } from "@mui/material";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";

interface StatCardProps {
  icon: LucideIcon;
  value: number | undefined;
  label: string;
  href?: string;
  loading?: boolean;
}

export function StatCard({
  icon: Icon,
  value,
  label,
  href,
  loading,
}: StatCardProps) {
  const navigate = useNavigate();

  return (
    <Paper
      variant="outlined"
      onClick={href ? () => navigate(href) : undefined}
      sx={{
        p: 3,
        borderRadius: 1,
        cursor: href ? "pointer" : "default",
        transition: "border-color 0.2s",
        "&:hover": href ? { borderColor: "text.primary" } : undefined,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <Icon size={20} />
        <Typography variant="body2">{label}</Typography>
      </Box>
      {loading ? (
        <Skeleton width={60} height={36} />
      ) : (
        <Typography variant="h4">{value ?? 0}</Typography>
      )}
    </Paper>
  );
}
