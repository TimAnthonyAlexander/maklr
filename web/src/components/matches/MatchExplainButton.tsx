import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { usePostMatchExplain } from "../../api/hooks";
import type { MatchExplanation } from "../../api/types";

interface MatchExplainButtonProps {
  estateId: string;
  contactId: string;
  profileId: string;
}

export function MatchExplainButton({
  estateId,
  contactId,
  profileId,
}: MatchExplainButtonProps) {
  const [explanation, setExplanation] = useState<MatchExplanation | null>(null);
  const [open, setOpen] = useState(false);
  const { loading, error, mutate } = usePostMatchExplain();

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (explanation) {
      setOpen((prev) => !prev);
      return;
    }

    try {
      const result = await mutate({
        body: { estate_id: estateId, contact_id: contactId, profile_id: profileId },
      });
      setExplanation(result);
      setOpen(true);
    } catch {
      // error state handled by hook
    }
  };

  return (
    <Box onClick={(e) => e.stopPropagation()}>
      <Button
        size="small"
        variant="outlined"
        startIcon={loading ? <CircularProgress size={14} /> : <AutoAwesomeIcon />}
        disabled={loading}
        onClick={handleClick}
        sx={{ textTransform: "none", fontWeight: 500, mt: 1 }}
      >
        {loading ? "Analyzing..." : "Explain"}
      </Button>

      {error && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
          {error.message}
        </Typography>
      )}

      <Collapse in={open}>
        {explanation && (
          <Box sx={{ mt: 1.5, pl: 1, borderLeft: "2px solid", borderColor: "divider" }}>
            {explanation.strong_fits.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "success.main" }}>
                  Strong Fits
                </Typography>
                {explanation.strong_fits.map((fit, i) => (
                  <Typography
                    key={i}
                    variant="body2"
                    sx={{ pl: 1, py: 0.25, color: "success.dark", fontSize: "0.8125rem" }}
                  >
                    {"\u2022"} {fit}
                  </Typography>
                ))}
              </Box>
            )}

            {explanation.stretches.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "warning.main" }}>
                  Stretches
                </Typography>
                {explanation.stretches.map((stretch, i) => (
                  <Typography
                    key={i}
                    variant="body2"
                    sx={{ pl: 1, py: 0.25, color: "warning.dark", fontSize: "0.8125rem" }}
                  >
                    {"\u2022"} {stretch}
                  </Typography>
                ))}
              </Box>
            )}

            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
              <LightbulbOutlinedIcon sx={{ fontSize: 16, mt: 0.25, color: "text.secondary" }} />
              <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary", fontSize: "0.8125rem" }}>
                {explanation.suggested_pitch}
              </Typography>
            </Box>
          </Box>
        )}
      </Collapse>
    </Box>
  );
}
