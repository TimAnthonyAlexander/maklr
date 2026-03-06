import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Skeleton,
  Alert,
  Chip,
  Paper,
} from "@mui/material";
import { useGetContactMatchesById } from "../../api/hooks";
import type { EstateMatchResult } from "../../api/types";
import { MatchExplainButton } from "../matches/MatchExplainButton";

interface ContactMatchesTabProps {
  contactId: string;
  contactType?: string;
  hasProfiles: boolean;
}

const priceFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

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

function MatchRow({ match, contactId }: { match: EstateMatchResult; contactId: string }) {
  const navigate = useNavigate();
  const estate = match.estate;
  const location = [estate.city, estate.zip].filter(Boolean).join(", ");

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        cursor: "pointer",
        "&:hover": { bgcolor: "action.hover" },
      }}
      onClick={() => navigate(`/estates/${estate.id}`)}
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
            {estate.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {location || "\u2014"}
            {estate.price != null && ` \u00B7 ${priceFormatter.format(estate.price)}`}
          </Typography>
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
        estateId={estate.id!}
        contactId={contactId}
        profileId={match.profile_id}
      />
    </Paper>
  );
}

export function ContactMatchesTab({
  contactId,
  contactType,
  hasProfiles,
}: ContactMatchesTabProps) {
  const isBuyerOrTenant =
    contactType === "buyer" || contactType === "tenant";

  const { data, loading, error } = useGetContactMatchesById(
    { id: contactId },
    { enabled: hasProfiles },
  );

  if (!isBuyerOrTenant) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Matching is only available for buyers and tenants.
        </Typography>
      </Box>
    );
  }

  if (!hasProfiles) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Add search profiles first to see matching estates.
        </Typography>
      </Box>
    );
  }

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
          No matching estates found. Check if there are active estates that match the search criteria.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        {data?.total ?? 0} matching estate{(data?.total ?? 0) !== 1 ? "s" : ""}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {items.map((match) => (
          <MatchRow key={match.estate.id} match={match} contactId={contactId} />
        ))}
      </Box>
    </Box>
  );
}
