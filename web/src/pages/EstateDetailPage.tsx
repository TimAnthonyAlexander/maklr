import { useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import {
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Skeleton,
  Alert,
  Menu,
  MenuItem,
  IconButton,
  Grid,
} from "@mui/material";
import { ArrowLeft, Pencil, Trash2, FileText } from "lucide-react";
import {
  useGetEstateShowById,
  usePatchEstateUpdateById,
  useDeleteEstateById,
} from "../api/hooks";
import type { Estate, EstateImage } from "../api/types";
import { getEstateBrochureUrl } from "../api/client";
import { EstateImagesTab } from "../components/estates/EstateImagesTab";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/LanguageContext";
import {
  EstateStatusChip,
  PropertyTypeLabel,
  MarketingTypeLabel,
} from "../components/estates/EstateStatusChip";
import { EstateForm } from "../components/estates/EstateForm";
import { EstateDeleteDialog } from "../components/estates/EstateDeleteDialog";
import { EntityDocumentsTab } from "../components/documents/EntityDocumentsTab";
import { EntityActivityTimeline } from "../components/activity/ActivityTimeline";
import { EstateContactsTab } from "../components/estates/EstateContactsTab";
import { EstateMatchesTab } from "../components/estates/EstateMatchesTab";
import { EstateImageGallery } from "../components/estates/EstateImageGallery";
import { EstateDescriptionCard } from "../components/estates/EstateDescriptionCard";
import { EstateKeyMetricsCard } from "../components/estates/EstateKeyMetricsCard";
import { EstateLocationCard } from "../components/estates/EstateLocationCard";
import { EstateFeaturesCard } from "../components/estates/EstateFeaturesCard";

const STATUSES = ["draft", "active", "reserved", "sold", "rented", "archived"];

const ESTATE_TABS = ["images", "documents", "matches"] as const;

export function EstateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data, loading, error, refetch } = useGetEstateShowById(
    { id: id ?? "" },
    { enabled: !!id },
  );
  const updateMutation = usePatchEstateUpdateById();
  const deleteMutation = useDeleteEstateById();

  const estate = data ?? null;
  const images = (estate as Estate & { images?: EstateImage[] })?.images ?? [];

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = Math.max(
    0,
    ESTATE_TABS.indexOf(
      searchParams.get("tab") as (typeof ESTATE_TABS)[number],
    ),
  );
  const [tab, setTab] = useState(initialTab);

  const handleTabChange = useCallback(
    (_: unknown, newTab: number) => {
      setTab(newTab);
      const newParams = new URLSearchParams(searchParams);
      if (newTab === 0) {
        newParams.delete("tab");
      } else {
        newParams.set("tab", ESTATE_TABS[newTab]);
      }
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null);

  const canDelete = user?.role === "admin" || user?.role === "manager";

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      setStatusAnchor(null);
      if (!id) return;
      try {
        await updateMutation.mutate({
          path: { id },
          body: { status: newStatus },
        });
        refetch();
      } catch {
        // Error is captured by the mutation hook
      }
    },
    [id, updateMutation, refetch],
  );

  const handleDelete = useCallback(async () => {
    if (!id) return;
    try {
      await deleteMutation.mutate({ path: { id } });
      navigate("/estates");
    } catch {
      // Error is captured by the mutation hook
    }
  }, [id, deleteMutation, navigate]);

  const handleFormSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton
          variant="rectangular"
          height={300}
          sx={{ mt: 2, borderRadius: 2 }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error.message}</Alert>
      </Box>
    );
  }

  if (!estate) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">{t("estate.detail_not_found")}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Back */}
      <Button
        startIcon={<ArrowLeft size={18} />}
        onClick={() => navigate("/estates")}
        sx={{ mb: 2 }}
      >
        {t("estate.page_title")}
      </Button>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {estate.title}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <EstateStatusChip status={estate.status ?? "draft"} />
            <PropertyTypeLabel value={estate.property_type ?? "apartment"} />
            <MarketingTypeLabel value={estate.marketing_type ?? "sale"} />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => setStatusAnchor(e.currentTarget)}
          >
            {t("estate.change_status")}
          </Button>
          <IconButton
            component="a"
            href={getEstateBrochureUrl(estate.id)}
            target="_blank"
            size="small"
          >
            <FileText size={20} />
          </IconButton>
          <IconButton size="small" onClick={() => setFormOpen(true)}>
            <Pencil size={20} />
          </IconButton>
          {canDelete && (
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={20} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Status menu */}
      <Menu
        anchorEl={statusAnchor}
        open={!!statusAnchor}
        onClose={() => setStatusAnchor(null)}
      >
        {STATUSES.filter((s) => s !== estate.status).map((s) => (
          <MenuItem key={s} onClick={() => handleStatusChange(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </MenuItem>
        ))}
      </Menu>

      {/* Main content + Sidebar */}
      <Grid container spacing={3}>
        {/* Main content */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <EstateImageGallery estate={estate} images={images} />
            <EstateDescriptionCard estate={estate} />
            <EstateKeyMetricsCard estate={estate} />
            <EstateLocationCard estate={estate} />
            <EstateFeaturesCard estate={estate} />

            {/* Images / Documents / Matches Tabs */}
            <Paper variant="outlined" sx={{ px: 3 }}>
              <Tabs value={tab} onChange={handleTabChange}>
                <Tab label={t("estate.tab_images")} />
                <Tab label={t("estate.tab_documents")} />
                <Tab label={t("estate.tab_matches")} />
              </Tabs>

              {tab === 0 && (
                <Box sx={{ pt: 3, pb: 3 }}>
                  {id && (
                    <EstateImagesTab
                      estateId={id}
                      images={images}
                      onImagesChanged={() => refetch()}
                    />
                  )}
                </Box>
              )}
              {tab === 1 && (
                <Box sx={{ pt: 3, pb: 3 }}>
                  {id && (
                    <EntityDocumentsTab entityType="estate" entityId={id} />
                  )}
                </Box>
              )}
              {tab === 2 && (
                <Box sx={{ pt: 3, pb: 3 }}>
                  {id && <EstateMatchesTab estateId={id} />}
                </Box>
              )}
            </Paper>
          </Box>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box
            sx={{
              position: "sticky",
              top: 24,
              alignSelf: "flex-start",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <Paper variant="outlined" sx={{ p: 3 }}>
              {id && <EstateContactsTab estateId={id} />}
            </Paper>

            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                {t("estate.detail_activity")}
              </Typography>
              {id && (
                <EntityActivityTimeline entityType="estate" entityId={id} />
              )}
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Edit drawer */}
      <EstateForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        estate={estate}
        onSuccess={handleFormSuccess}
      />

      {/* Delete dialog */}
      <EstateDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteMutation.loading}
        estateTitle={estate.title ?? ""}
      />
    </Box>
  );
}
