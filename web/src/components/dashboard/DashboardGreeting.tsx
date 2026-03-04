import { Box, Typography } from "@mui/material";
import { useTranslation } from "../../contexts/LanguageContext";

interface DashboardGreetingProps {
  userName: string;
}

export function DashboardGreeting({ userName }: DashboardGreetingProps) {
  const { t } = useTranslation();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Box>
      <Typography variant="h4">
        {t("dashboard.greeting", { name: userName })}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        {today}
      </Typography>
    </Box>
  );
}
