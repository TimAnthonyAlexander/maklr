import { useState, useCallback, useMemo } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  IconButton,
  Divider,
  Collapse,
} from "@mui/material";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import type { Estate, PostEstateCreateRequestBody, PatchEstateUpdateByIdRequestBody } from "../../api/types";
import { usePostEstateCreate, usePatchEstateUpdateById } from "../../api/hooks";
import { useTranslation } from "../../contexts/LanguageContext";
import { CustomFieldsSection } from "../custom-fields/CustomFieldsSection";

interface EstateFormProps {
  open: boolean;
  onClose: () => void;
  estate?: Estate | null;
  onSuccess: () => void;
}

interface FormState {
  title: string;
  property_type: string;
  marketing_type: string;
  status: string;
  description: string;
  external_id: string;
  street: string;
  house_number: string;
  zip: string;
  city: string;
  country: string;
  price: string;
  area_total: string;
  area_living: string;
  area_plot: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  floors_total: string;
  year_built: string;
  parking_spaces: string;
  heating_type: string;
  energy_rating: string;
  condition: string;
  furnished: boolean;
  balcony: boolean;
  garden: boolean;
  elevator: boolean;
  cellar: boolean;
  latitude: string;
  longitude: string;
  virtual_tour_url: string;
  custom_fields: Record<string, unknown>;
}

function estateToFormState(estate?: Estate | null): FormState {
  return {
    title: estate?.title ?? "",
    property_type: estate?.property_type ?? "apartment",
    marketing_type: estate?.marketing_type ?? "sale",
    status: estate?.status ?? "draft",
    description: estate?.description ?? "",
    external_id: estate?.external_id ?? "",
    street: estate?.street ?? "",
    house_number: estate?.house_number ?? "",
    zip: estate?.zip ?? "",
    city: estate?.city ?? "",
    country: estate?.country ?? "",
    price: estate?.price != null ? String(estate.price) : "",
    area_total: estate?.area_total != null ? String(estate.area_total) : "",
    area_living: estate?.area_living != null ? String(estate.area_living) : "",
    area_plot: estate?.area_plot != null ? String(estate.area_plot) : "",
    rooms: estate?.rooms != null ? String(estate.rooms) : "",
    bedrooms: estate?.bedrooms != null ? String(estate.bedrooms) : "",
    bathrooms: estate?.bathrooms != null ? String(estate.bathrooms) : "",
    floor: estate?.floor != null ? String(estate.floor) : "",
    floors_total:
      estate?.floors_total != null ? String(estate.floors_total) : "",
    year_built: estate?.year_built != null ? String(estate.year_built) : "",
    parking_spaces:
      estate?.parking_spaces != null ? String(estate.parking_spaces) : "",
    heating_type: estate?.heating_type ?? "",
    energy_rating: estate?.energy_rating ?? "",
    condition: estate?.condition ?? "",
    furnished: estate?.furnished ?? false,
    balcony: estate?.balcony ?? false,
    garden: estate?.garden ?? false,
    elevator: estate?.elevator ?? false,
    cellar: estate?.cellar ?? false,
    latitude: estate?.latitude != null ? String(estate.latitude) : "",
    longitude: estate?.longitude != null ? String(estate.longitude) : "",
    virtual_tour_url: estate?.virtual_tour_url ?? "",
    custom_fields: (estate?.custom_fields as Record<string, unknown>) ?? {},
  };
}

function formStateToBody(form: FormState): PostEstateCreateRequestBody {
  const numOrNull = (v: string) => (v === "" ? null : Number(v));
  const strOrNull = (v: string) => (v === "" ? null : v);

  return {
    title: form.title,
    property_type: form.property_type,
    marketing_type: form.marketing_type,
    status: form.status,
    description: strOrNull(form.description),
    external_id: strOrNull(form.external_id),
    street: strOrNull(form.street),
    house_number: strOrNull(form.house_number),
    zip: strOrNull(form.zip),
    city: strOrNull(form.city),
    country: strOrNull(form.country),
    price: numOrNull(form.price),
    area_total: numOrNull(form.area_total),
    area_living: numOrNull(form.area_living),
    area_plot: numOrNull(form.area_plot),
    rooms: numOrNull(form.rooms),
    bedrooms: numOrNull(form.bedrooms),
    bathrooms: numOrNull(form.bathrooms),
    floor: numOrNull(form.floor),
    floors_total: numOrNull(form.floors_total),
    year_built: numOrNull(form.year_built),
    parking_spaces: numOrNull(form.parking_spaces),
    heating_type: strOrNull(form.heating_type),
    energy_rating: strOrNull(form.energy_rating),
    condition: strOrNull(form.condition),
    furnished: form.furnished,
    balcony: form.balcony,
    garden: form.garden,
    elevator: form.elevator,
    cellar: form.cellar,
    latitude: numOrNull(form.latitude),
    longitude: numOrNull(form.longitude),
    virtual_tour_url: strOrNull(form.virtual_tour_url),
  };
}

function computeDiff(
  original: FormState,
  current: FormState,
): PatchEstateUpdateByIdRequestBody {
  const originalBody = formStateToBody(original);
  const currentBody = formStateToBody(current);
  const diff: Record<string, unknown> = {};

  for (const key of Object.keys(
    currentBody,
  ) as (keyof PostEstateCreateRequestBody)[]) {
    if (currentBody[key] !== originalBody[key]) {
      diff[key] = currentBody[key];
    }
  }

  if (
    JSON.stringify(current.custom_fields) !==
    JSON.stringify(original.custom_fields)
  ) {
    diff.custom_fields = current.custom_fields;
  }

  return diff as PatchEstateUpdateByIdRequestBody;
}

interface SectionProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, open, onToggle, children }: SectionProps) {
  return (
    <Box>
      <Box
        onClick={onToggle}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          py: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {open ? (
          <ChevronUp size={20} />
        ) : (
          <ChevronDown size={20} />
        )}
      </Box>
      <Collapse in={open}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pb: 2 }}>
          {children}
        </Box>
      </Collapse>
      <Divider />
    </Box>
  );
}

export function EstateForm({
  open,
  onClose,
  estate,
  onSuccess,
}: EstateFormProps) {
  const { t } = useTranslation();
  const isEdit = estate != null;
  const initialState = useMemo(() => estateToFormState(estate), [estate]);
  const [form, setForm] = useState<FormState>(initialState);
  const [sections, setSections] = useState({
    location: !!isEdit,
    details: !!isEdit,
    features: false,
    links: false,
    customFields: false,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = usePostEstateCreate();
  const updateMutation = usePatchEstateUpdateById();

  const loading = createMutation.loading || updateMutation.loading;

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const toggleSection = useCallback((key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);

    try {
      if (isEdit && estate?.id) {
        const diff = computeDiff(initialState, form);
        if (Object.keys(diff).length === 0) {
          onClose();
          return;
        }
        await updateMutation.mutate({
          path: { id: estate.id },
          body: diff,
        });
      } else {
        await createMutation.mutate({
          body: formStateToBody(form),
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t("estate.form_error_generic"),
      );
    }
  }, [
    isEdit,
    estate,
    initialState,
    form,
    updateMutation,
    createMutation,
    onSuccess,
    onClose,
    t,
  ]);

  // Reset form when estate changes
  const handleEntered = useCallback(() => {
    setForm(estateToFormState(estate));
    setSubmitError(null);
  }, [estate]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 560, maxWidth: "100vw" } } }}
      SlideProps={{ onEntered: handleEntered }}
    >
      <Box
        sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Typography variant="h6">
            {isEdit ? t("estate.form_title_edit") : t("estate.form_title_new")}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Box>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {/* Basic — always open */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {t("estate.form_section_basic")}
            </Typography>
            <TextField
              label={t("estate.field_title")}
              required
              size="small"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t("estate.field_property_type")}</InputLabel>
                <Select
                  label={t("estate.field_property_type")}
                  value={form.property_type}
                  onChange={(e) => updateField("property_type", e.target.value)}
                >
                  <MenuItem value="apartment">{t("estate.property_type_apartment")}</MenuItem>
                  <MenuItem value="house">{t("estate.property_type_house")}</MenuItem>
                  <MenuItem value="commercial">{t("estate.property_type_commercial")}</MenuItem>
                  <MenuItem value="land">{t("estate.property_type_land")}</MenuItem>
                  <MenuItem value="garage">{t("estate.property_type_garage")}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>{t("estate.field_marketing_type")}</InputLabel>
                <Select
                  label={t("estate.field_marketing_type")}
                  value={form.marketing_type}
                  onChange={(e) =>
                    updateField("marketing_type", e.target.value)
                  }
                >
                  <MenuItem value="sale">{t("estate.marketing_type_sale")}</MenuItem>
                  <MenuItem value="rent">{t("estate.marketing_type_rent")}</MenuItem>
                  <MenuItem value="lease">{t("estate.marketing_type_lease")}</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              label={t("estate.field_description")}
              size="small"
              multiline
              rows={3}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
            <TextField
              label={t("estate.field_external_id")}
              size="small"
              value={form.external_id}
              onChange={(e) => updateField("external_id", e.target.value)}
            />
            <Divider />
          </Box>

          {/* Location */}
          <Section
            title={t("estate.form_section_location")}
            open={sections.location}
            onToggle={() => toggleSection("location")}
          >
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label={t("estate.field_street")}
                size="small"
                fullWidth
                value={form.street}
                onChange={(e) => updateField("street", e.target.value)}
              />
              <TextField
                label={t("estate.field_house_number")}
                size="small"
                sx={{ width: 120 }}
                value={form.house_number}
                onChange={(e) => updateField("house_number", e.target.value)}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label={t("estate.field_zip")}
                size="small"
                sx={{ width: 120 }}
                value={form.zip}
                onChange={(e) => updateField("zip", e.target.value)}
              />
              <TextField
                label={t("estate.field_city")}
                size="small"
                fullWidth
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
              <TextField
                label={t("estate.field_country")}
                size="small"
                sx={{ width: 120 }}
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Latitude"
                size="small"
                type="number"
                fullWidth
                value={form.latitude}
                onChange={(e) => updateField("latitude", e.target.value)}
                slotProps={{ htmlInput: { step: "any" } }}
              />
              <TextField
                label="Longitude"
                size="small"
                type="number"
                fullWidth
                value={form.longitude}
                onChange={(e) => updateField("longitude", e.target.value)}
                slotProps={{ htmlInput: { step: "any" } }}
              />
            </Box>
          </Section>

          {/* Details */}
          <Section
            title={t("estate.form_section_details")}
            open={sections.details}
            onToggle={() => toggleSection("details")}
          >
            <TextField
              label={t("estate.field_price")}
              size="small"
              type="number"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label={t("estate.field_area_total")}
                size="small"
                type="number"
                fullWidth
                value={form.area_total}
                onChange={(e) => updateField("area_total", e.target.value)}
              />
              <TextField
                label={t("estate.field_area_living")}
                size="small"
                type="number"
                fullWidth
                value={form.area_living}
                onChange={(e) => updateField("area_living", e.target.value)}
              />
              <TextField
                label={t("estate.field_area_plot")}
                size="small"
                type="number"
                fullWidth
                value={form.area_plot}
                onChange={(e) => updateField("area_plot", e.target.value)}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label={t("estate.field_rooms")}
                size="small"
                type="number"
                fullWidth
                value={form.rooms}
                onChange={(e) => updateField("rooms", e.target.value)}
              />
              <TextField
                label={t("estate.field_bedrooms")}
                size="small"
                type="number"
                fullWidth
                value={form.bedrooms}
                onChange={(e) => updateField("bedrooms", e.target.value)}
              />
              <TextField
                label={t("estate.field_bathrooms")}
                size="small"
                type="number"
                fullWidth
                value={form.bathrooms}
                onChange={(e) => updateField("bathrooms", e.target.value)}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label={t("estate.field_floor")}
                size="small"
                type="number"
                fullWidth
                value={form.floor}
                onChange={(e) => updateField("floor", e.target.value)}
              />
              <TextField
                label={t("estate.field_floors_total")}
                size="small"
                type="number"
                fullWidth
                value={form.floors_total}
                onChange={(e) => updateField("floors_total", e.target.value)}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label={t("estate.field_year_built")}
                size="small"
                type="number"
                fullWidth
                value={form.year_built}
                onChange={(e) => updateField("year_built", e.target.value)}
              />
              <TextField
                label={t("estate.field_parking_spaces")}
                size="small"
                type="number"
                fullWidth
                value={form.parking_spaces}
                onChange={(e) => updateField("parking_spaces", e.target.value)}
              />
            </Box>
          </Section>

          {/* Features */}
          <Section
            title={t("estate.form_section_features")}
            open={sections.features}
            onToggle={() => toggleSection("features")}
          >
            <TextField
              label={t("estate.field_heating_type")}
              size="small"
              value={form.heating_type}
              onChange={(e) => updateField("heating_type", e.target.value)}
            />
            <TextField
              label={t("estate.field_energy_rating")}
              size="small"
              value={form.energy_rating}
              onChange={(e) => updateField("energy_rating", e.target.value)}
            />
            <TextField
              label={t("estate.field_condition")}
              size="small"
              value={form.condition}
              onChange={(e) => updateField("condition", e.target.value)}
            />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.furnished}
                    onChange={(e) => updateField("furnished", e.target.checked)}
                    size="small"
                  />
                }
                label={t("estate.field_furnished")}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.balcony}
                    onChange={(e) => updateField("balcony", e.target.checked)}
                    size="small"
                  />
                }
                label={t("estate.field_balcony")}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.garden}
                    onChange={(e) => updateField("garden", e.target.checked)}
                    size="small"
                  />
                }
                label={t("estate.field_garden")}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.elevator}
                    onChange={(e) => updateField("elevator", e.target.checked)}
                    size="small"
                  />
                }
                label={t("estate.field_elevator")}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.cellar}
                    onChange={(e) => updateField("cellar", e.target.checked)}
                    size="small"
                  />
                }
                label={t("estate.field_cellar")}
              />
            </Box>
          </Section>

          {/* Links */}
          <Section
            title={t("estate.form_section_links")}
            open={sections.links}
            onToggle={() => toggleSection("links")}
          >
            <TextField
              label={t("estate.field_virtual_tour_url")}
              size="small"
              value={form.virtual_tour_url}
              onChange={(e) => updateField("virtual_tour_url", e.target.value)}
            />
          </Section>

          {/* Custom Fields */}
          <Section
            title={t("custom_fields.card_title")}
            open={sections.customFields}
            onToggle={() => toggleSection("customFields")}
          >
            <CustomFieldsSection
              entityType="estate"
              values={form.custom_fields}
              onChange={(values) => updateField("custom_fields", values)}
            />
          </Section>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            pt: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button onClick={onClose} fullWidth disabled={loading}>
            {t("estate.form_cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth
            disabled={loading || !form.title}
          >
            {loading
              ? t("estate.form_saving")
              : isEdit
                ? t("estate.form_save_changes")
                : t("estate.form_create_estate")}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
