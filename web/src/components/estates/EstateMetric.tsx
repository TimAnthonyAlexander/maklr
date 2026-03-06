import { Box, Typography } from "@mui/material";

interface MetricProps {
  label: string;
  value: string | number | null | undefined;
  suffix?: string;
}

export function EstateMetric({ label, value, suffix }: MetricProps) {
  const isEmpty = value == null || value === "";
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontWeight: 500,
          color: isEmpty ? "text.disabled" : "text.primary",
        }}
      >
        {isEmpty ? "\u2014" : `${value}${suffix ? ` ${suffix}` : ""}`}
      </Typography>
    </Box>
  );
}
