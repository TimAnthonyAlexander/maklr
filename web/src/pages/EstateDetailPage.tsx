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
  Chip,
  Grid,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import {
  useGetEstateShowById,
  usePatchEstateUpdateById,
  useDeleteEstateById,
} from "../api/hooks";
import type { Estate, EstateImage } from "../api/types";
import { getEstateImageUrl, getEstateBrochureUrl } from "../api/client";
import { EstateImagesTab } from "../components/estates/EstateImagesTab";
import { useAuth } from "../contexts/AuthContext";
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
import { EstateLocationMap } from "../components/estates/EstateLocationMap";

const priceFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const STATUSES = ["draft", "active", "reserved", "sold", "rented", "archived"];

const ESTATE_TABS = ["images", "documents", "matches"] as const;

interface MetricProps {
  label: string;
  value: string | number | null | undefined;
  suffix?: string;
}

function Metric({ label, value, suffix }: MetricProps) {
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

function ImageGallery({
  estate,
  images,
}: {
  estate: Estate;
  images: EstateImage[];
}) {
  const sortedImages = [...images].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  if (sortedImages.length === 0 || !estate.id) return null;

  return (
    <Grid container spacing={1.5}>
      {sortedImages.map((img) => (
        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={img.id}>
          <Box
            component="img"
            src={getEstateImageUrl(estate.id!, img.id ?? "")}
            alt={img.alt_text ?? img.title ?? img.file_name ?? ""}
            sx={{
              width: "100%",
              aspectRatio: "4/3",
              objectFit: "cover",
              display: "block",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          />
        </Grid>
      ))}
    </Grid>
  );
}

function DescriptionCard({ estate }: { estate: Estate }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Description
      </Typography>
      {estate.description ? (
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {estate.description}
        </Typography>
      ) : (
        <Typography variant="body2" sx={{ color: "text.disabled" }}>
          {"\u2014"}
        </Typography>
      )}
    </Paper>
  );
}

function KeyMetricsCard({ estate }: { estate: Estate }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Key Metrics
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Metric
            label="Price"
            value={
              estate.price != null ? priceFormatter.format(estate.price) : null
            }
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Metric
            label="Total Area"
            value={estate.area_total}
            suffix="m\u00B2"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Metric
            label="Living Area"
            value={estate.area_living}
            suffix="m\u00B2"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Metric
            label="Plot Area"
            value={estate.area_plot}
            suffix="m\u00B2"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Metric label="Rooms" value={estate.rooms} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Metric label="Bedrooms" value={estate.bedrooms} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Metric label="Bathrooms" value={estate.bathrooms} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Metric label="Parking Spaces" value={estate.parking_spaces} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Metric label="Year Built" value={estate.year_built} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Metric label="Floor" value={estate.floor} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Metric label="Total Floors" value={estate.floors_total} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Metric label="External ID" value={estate.external_id} />
        </Grid>
      </Grid>
    </Paper>
  );
}

function LocationCard({ estate }: { estate: Estate }) {
  const streetLine = [estate.street, estate.house_number]
    .filter(Boolean)
    .join(" ");
  const cityLine = [estate.zip, estate.city].filter(Boolean).join(" ");

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Location
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Metric label="Street" value={streetLine || null} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Metric label="City" value={cityLine || null} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Metric label="Country" value={estate.country} />
        </Grid>
      </Grid>
      {estate.latitude != null && estate.longitude != null && (
        <Box sx={{ mt: 2, borderRadius: 3, overflow: "hidden" }}>
          <EstateLocationMap
            latitude={estate.latitude}
            longitude={estate.longitude}
            title={estate.title}
          />
        </Box>
      )}
    </Paper>
  );
}

function FeaturesCard({ estate }: { estate: Estate }) {
  const booleanFeatures = [
    { key: "furnished" as const, label: "Furnished" },
    { key: "balcony" as const, label: "Balcony" },
    { key: "garden" as const, label: "Garden" },
    { key: "elevator" as const, label: "Elevator" },
    { key: "cellar" as const, label: "Cellar" },
  ];

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Features
      </Typography>
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Metric label="Heating Type" value={estate.heating_type} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Metric label="Energy Rating" value={estate.energy_rating} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Metric label="Condition" value={estate.condition} />
        </Grid>
      </Grid>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        {booleanFeatures.map(({ key, label }) => (
          <Chip
            key={key}
            label={label}
            size="small"
            variant={estate[key] ? "filled" : "outlined"}
            color={estate[key] ? "primary" : "default"}
            sx={{ opacity: estate[key] ? 1 : 0.5 }}
          />
        ))}
      </Box>
      <Metric label="Virtual Tour" value={estate.virtual_tour_url} />
    </Paper>
  );
}

export function EstateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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
        <Alert severity="warning">Estate not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Back */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/estates")}
        sx={{ mb: 2 }}
      >
        Estates
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
            Change Status
          </Button>
          <IconButton
            component="a"
            href={getEstateBrochureUrl(estate.id)}
            target="_blank"
            size="small"
          >
            <PictureAsPdfIcon />
          </IconButton>
          <IconButton size="small" onClick={() => setFormOpen(true)}>
            <EditIcon />
          </IconButton>
          {canDelete && (
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteOpen(true)}
            >
              <DeleteOutlineIcon />
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
            {/* Image Gallery */}
            <ImageGallery estate={estate} images={images} />

            {/* Description */}
            <DescriptionCard estate={estate} />

            {/* Key Metrics */}
            <KeyMetricsCard estate={estate} />

            {/* Location */}
            <LocationCard estate={estate} />

            {/* Features */}
            <FeaturesCard estate={estate} />

            {/* Images / Documents Tabs */}
            <Paper variant="outlined" sx={{ px: 3 }}>
              <Tabs value={tab} onChange={handleTabChange}>
                <Tab label="Images" />
                <Tab label="Documents" />
                <Tab label="Matches" />
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
            {/* Contacts */}
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Contacts
              </Typography>
              {id && <EstateContactsTab estateId={id} />}
            </Paper>

            {/* Activity */}
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Activity
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
