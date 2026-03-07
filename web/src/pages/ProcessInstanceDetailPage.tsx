import { useParams, useNavigate } from "react-router";
import { Box, Button } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import { ProcessInstanceTimeline } from "../components/processes/ProcessInstanceTimeline";
import { useTranslation } from "../contexts/LanguageContext";

export function ProcessInstanceDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowLeft size={18} />}
        onClick={() => navigate("/process-instances")}
        sx={{ mb: 2 }}
      >
        {t("processes.back_to_instances")}
      </Button>
      <ProcessInstanceTimeline instanceId={id} />
    </Box>
  );
}
