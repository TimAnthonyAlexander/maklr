import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Skeleton,
  Box,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router";
import { useTranslation } from "../../contexts/LanguageContext";
import type { DashboardMatchingTopMatch } from "../../api/types";
import { colors } from "../../theme/colors";

interface TopMatchesListProps {
  matches: DashboardMatchingTopMatch[] | undefined;
  loading: boolean;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? colors.status.success.text
      : score >= 50
        ? colors.status.warning.text
        : colors.status.error.text;
  const bg =
    score >= 80
      ? colors.status.success.bg
      : score >= 50
        ? colors.status.warning.bg
        : colors.status.error.bg;

  return (
    <Chip
      label={`${Math.round(score)}%`}
      size="small"
      sx={{
        bgcolor: bg,
        color,
        fontWeight: 600,
        fontSize: "0.75rem",
        minWidth: 48,
      }}
    />
  );
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  buyer: colors.contactType.buyer,
  tenant: colors.contactType.tenant,
  seller: colors.contactType.seller,
  landlord: colors.contactType.landlord,
  misc: colors.contactType.misc,
};

export function TopMatchesList({ matches, loading }: TopMatchesListProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
      <Box sx={{ px: 3, pt: 3, pb: 1.5 }}>
        <Typography variant="h6">
          {t("dashboard.top_matches.title")}
        </Typography>
      </Box>
      <TableContainer>
        <Table
          sx={{
            "& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root":
              { borderBottom: "none" },
          }}
        >
          <TableBody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4].map((j) => (
                    <TableCell key={j}>
                      <Skeleton width={80} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (matches ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2">
                    {t("dashboard.top_matches.empty")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              (matches ?? []).map((match) => {
                const typeColor = TYPE_COLORS[match.contact_type] ??
                  TYPE_COLORS.misc;
                return (
                  <TableRow
                    key={`${match.estate_id}-${match.contact_id}`}
                    hover
                    onClick={() => navigate(`/estates/${match.estate_id}`)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {match.estate_title || "\u2014"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {match.contact_name || "\u2014"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={match.contact_type}
                        size="small"
                        sx={{
                          bgcolor: typeColor.bg,
                          color: typeColor.text,
                          fontWeight: 500,
                          fontSize: "0.75rem",
                          textTransform: "capitalize",
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <ScoreBadge score={match.score} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
