import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Skeleton,
  Alert,
  Chip,
  Paper,
} from "@mui/material";
import { useGetEstateMatchesById } from "../../api/hooks";
import type { ContactMatchResult } from "../../api/types";
import { getContactDisplayName } from "../../utils/contactHelpers";
import { MatchExplainButton } from "../matches/MatchExplainButton";

interface EstateMatchesTabProps {
  estateId: string;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "success" : score >= 50 ? "warning" : "error";
  return (
    <Chip
      label={`${Math.round(score)}%`}
      size="small"
      color={color}
      sx={{ fontWeight: 600, minWidth: 52 }}
    />
  );
}

const STAGE_COLORS: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  cold: "default",
  warm: "warning",
  hot: "error",
  customer: "success",
  lost: "default",
};

function ContactMatchRow({ match, estateId }: { match: ContactMatchResult; estateId: string }) {
  const navigate = useNavigate();
  const contact = match.contact;
  const displayName = getContactDisplayName(contact);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        cursor: "pointer",
        "&:hover": { bgcolor: "action.hover" },
      }}
      onClick={() => navigate(`/contacts/${contact.id}`)}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
            {displayName}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
            <Chip
              label={contact.type ?? "misc"}
              size="small"
              variant="outlined"
            />
            <Chip
              label={contact.stage ?? "cold"}
              size="small"
              color={STAGE_COLORS[contact.stage ?? "cold"] ?? "default"}
              variant="outlined"
            />
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
          <ScoreBadge score={match.score} />
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
        Profile: {match.profile_name}
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
        {match.matched.map((m) => (
          <Chip key={m} label={m} size="small" color="success" variant="outlined" />
        ))}
        {match.unmatched.map((m) => (
          <Chip key={m} label={m} size="small" color="error" variant="outlined" />
        ))}
      </Box>
      <MatchExplainButton
        estateId={estateId}
        contactId={contact.id!}
        profileId={match.profile_id}
      />
    </Paper>
  );
}

export function EstateMatchesTab({ estateId }: EstateMatchesTabProps) {
  const { data, loading, error } = useGetEstateMatchesById(
    { id: estateId },
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No matching contacts found. Contacts need search profiles to appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        {data?.total ?? 0} matching contact{(data?.total ?? 0) !== 1 ? "s" : ""}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {items.map((match) => (
          <ContactMatchRow key={match.contact.id} match={match} estateId={estateId} />
        ))}
      </Box>
    </Box>
  );
}
