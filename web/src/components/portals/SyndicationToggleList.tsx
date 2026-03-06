import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Switch,
  Skeleton,
  Alert,
} from "@mui/material";
import {
  useGetEstateSyndications,
  usePatchEstateSyndicationUpdate,
} from "../../api/hooks";
import type { EstateSyndication } from "../../api/types";
import { SyncStatusChip } from "./SyncStatusChip";
import { useTranslation } from "../../contexts/LanguageContext";

interface SyndicationToggleListProps {
  estateId: string;
}

export function SyndicationToggleList({ estateId }: SyndicationToggleListProps) {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useGetEstateSyndications(
    { id: estateId },
    { enabled: !!estateId },
  );
  const updateMutation = usePatchEstateSyndicationUpdate();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const items = data?.items ?? [];

  const handleToggle = useCallback(
    async (syndication: EstateSyndication) => {
      if (!syndication.id) return;
      setTogglingId(syndication.id);
      try {
        await updateMutation.mutate({
          path: {
            id: estateId,
            syndicationId: syndication.id,
          },
          body: { enabled: !syndication.enabled },
        });
        refetch();
      } catch {
        // Error captured by mutation hook
      } finally {
        setTogglingId(null);
      }
    },
    [estateId, updateMutation, refetch],
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  if (items.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
        {t("portal.syndication.no_portals")}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {items.map((syndication) => (
        <Box
          key={syndication.id}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography fontWeight={500}>
              {syndication.portal?.name ?? "\u2014"}
            </Typography>
            <SyncStatusChip status={syndication.sync_status ?? "pending"} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {syndication.last_synced_at && (
              <Typography variant="caption" color="text.secondary">
                {new Date(syndication.last_synced_at).toLocaleDateString()}
              </Typography>
            )}
            <Switch
              checked={syndication.enabled ?? false}
              onChange={() => handleToggle(syndication)}
              disabled={togglingId === syndication.id}
              size="small"
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
