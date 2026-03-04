import { Box, Button } from "@mui/material";
import { Plus, UserPlus } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "../../contexts/LanguageContext";

export function QuickActions() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Box sx={{ display: "flex", gap: 1.5 }}>
      <Button
        variant="contained"
        startIcon={<Plus size={18} />}
        onClick={() => navigate("/estates?action=create")}
      >
        {t("dashboard.quick_actions.add_estate")}
      </Button>
      <Button
        variant="outlined"
        startIcon={<UserPlus size={18} />}
        onClick={() => navigate("/contacts?action=create")}
      >
        {t("dashboard.quick_actions.add_contact")}
      </Button>
    </Box>
  );
}
