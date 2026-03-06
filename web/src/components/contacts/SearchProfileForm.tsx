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
  Button,
  Alert,
  IconButton,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { X } from "lucide-react";
import type { SearchProfile } from "../../api/types";

interface SearchProfileFormProps {
  open: boolean;
  onClose: () => void;
  profile?: SearchProfile | null;
  onSave: (profile: SearchProfile) => void;
}

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
  { value: "garage", label: "Garage" },
];

type TriState = "any" | "required";

interface FormState {
  name: string;
  property_types: string[];
  marketing_type: string;
  price_min: string;
  price_max: string;
  area_min: string;
  area_max: string;
  rooms_min: string;
  rooms_max: string;
  bedrooms_min: string;
  bedrooms_max: string;
  cities: string;
  furnished: TriState;
  balcony: TriState;
  garden: TriState;
  elevator: TriState;
  cellar: TriState;
}

function profileToFormState(profile?: SearchProfile | null): FormState {
  return {
    name: profile?.name ?? "",
    property_types: profile?.property_types ?? [],
    marketing_type: profile?.marketing_type ?? "",
    price_min: profile?.price_min != null ? String(profile.price_min) : "",
    price_max: profile?.price_max != null ? String(profile.price_max) : "",
    area_min: profile?.area_min != null ? String(profile.area_min) : "",
    area_max: profile?.area_max != null ? String(profile.area_max) : "",
    rooms_min: profile?.rooms_min != null ? String(profile.rooms_min) : "",
    rooms_max: profile?.rooms_max != null ? String(profile.rooms_max) : "",
    bedrooms_min:
      profile?.bedrooms_min != null ? String(profile.bedrooms_min) : "",
    bedrooms_max:
      profile?.bedrooms_max != null ? String(profile.bedrooms_max) : "",
    cities: profile?.cities?.join(", ") ?? "",
    furnished: profile?.furnished === true ? "required" : "any",
    balcony: profile?.balcony === true ? "required" : "any",
    garden: profile?.garden === true ? "required" : "any",
    elevator: profile?.elevator === true ? "required" : "any",
    cellar: profile?.cellar === true ? "required" : "any",
  };
}

function parseNum(val: string): number | null {
  if (val === "") return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

function formStateToProfile(
  form: FormState,
  existingId?: string,
  existingCreatedAt?: string,
): SearchProfile {
  return {
    id: existingId ?? crypto.randomUUID(),
    name: form.name,
    property_types: form.property_types,
    marketing_type: form.marketing_type || null,
    price_min: parseNum(form.price_min),
    price_max: parseNum(form.price_max),
    area_min: parseNum(form.area_min),
    area_max: parseNum(form.area_max),
    rooms_min: parseNum(form.rooms_min),
    rooms_max: parseNum(form.rooms_max),
    bedrooms_min: parseNum(form.bedrooms_min),
    bedrooms_max: parseNum(form.bedrooms_max),
    cities: form.cities
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
    furnished: form.furnished === "required" ? true : null,
    balcony: form.balcony === "required" ? true : null,
    garden: form.garden === "required" ? true : null,
    elevator: form.elevator === "required" ? true : null,
    cellar: form.cellar === "required" ? true : null,
    created_at: existingCreatedAt ?? new Date().toISOString(),
  };
}

export function SearchProfileForm({
  open,
  onClose,
  profile,
  onSave,
}: SearchProfileFormProps) {
  const isEdit = profile != null;
  const initialState = useMemo(() => profileToFormState(profile), [profile]);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    setSubmitError(null);
    if (!form.name.trim()) {
      setSubmitError("Name is required");
      return;
    }
    const result = formStateToProfile(
      form,
      profile?.id,
      profile?.created_at,
    );
    onSave(result);
    onClose();
  }, [form, profile, onSave, onClose]);

  const handleEntered = useCallback(() => {
    setForm(profileToFormState(profile));
    setSubmitError(null);
  }, [profile]);

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
            {isEdit ? "Edit Search Profile" : "New Search Profile"}
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
            gap: 2,
          }}
        >
          <TextField
            label="Profile Name"
            size="small"
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder='e.g. "City apartment"'
          />

          <Divider />

          {/* Property Types */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Property Types
          </Typography>
          <ToggleButtonGroup
            value={form.property_types}
            onChange={(_, val) => updateField("property_types", val ?? [])}
            size="small"
            sx={{ flexWrap: "wrap", gap: 0.5 }}
          >
            {PROPERTY_TYPES.map((pt) => (
              <ToggleButton key={pt.value} value={pt.value}>
                {pt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* Marketing Type */}
          <FormControl size="small" fullWidth>
            <InputLabel>Marketing Type</InputLabel>
            <Select
              label="Marketing Type"
              value={form.marketing_type}
              onChange={(e) => updateField("marketing_type", e.target.value)}
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="sale">Sale</MenuItem>
              <MenuItem value="rent">Rent</MenuItem>
            </Select>
          </FormControl>

          <Divider />

          {/* Price Range */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Price Range
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Min"
              size="small"
              type="number"
              fullWidth
              value={form.price_min}
              onChange={(e) => updateField("price_min", e.target.value)}
            />
            <TextField
              label="Max"
              size="small"
              type="number"
              fullWidth
              value={form.price_max}
              onChange={(e) => updateField("price_max", e.target.value)}
            />
          </Box>

          {/* Area Range */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Living Area (m²)
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Min"
              size="small"
              type="number"
              fullWidth
              value={form.area_min}
              onChange={(e) => updateField("area_min", e.target.value)}
            />
            <TextField
              label="Max"
              size="small"
              type="number"
              fullWidth
              value={form.area_max}
              onChange={(e) => updateField("area_max", e.target.value)}
            />
          </Box>

          {/* Rooms Range */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Rooms
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Min"
              size="small"
              type="number"
              fullWidth
              value={form.rooms_min}
              onChange={(e) => updateField("rooms_min", e.target.value)}
            />
            <TextField
              label="Max"
              size="small"
              type="number"
              fullWidth
              value={form.rooms_max}
              onChange={(e) => updateField("rooms_max", e.target.value)}
            />
          </Box>

          {/* Bedrooms Range */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Bedrooms
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Min"
              size="small"
              type="number"
              fullWidth
              value={form.bedrooms_min}
              onChange={(e) => updateField("bedrooms_min", e.target.value)}
            />
            <TextField
              label="Max"
              size="small"
              type="number"
              fullWidth
              value={form.bedrooms_max}
              onChange={(e) => updateField("bedrooms_max", e.target.value)}
            />
          </Box>

          <Divider />

          {/* Cities */}
          <TextField
            label="Cities"
            size="small"
            value={form.cities}
            onChange={(e) => updateField("cities", e.target.value)}
            helperText="Comma-separated, e.g. Berlin, Munich"
          />

          <Divider />

          {/* Feature Requirements */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Feature Requirements
          </Typography>
          {(
            [
              ["furnished", "Furnished"],
              ["balcony", "Balcony"],
              ["garden", "Garden"],
              ["elevator", "Elevator"],
              ["cellar", "Cellar"],
            ] as const
          ).map(([key, label]) => (
            <Box
              key={key}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body2">{label}</Typography>
              <ToggleButtonGroup
                value={form[key]}
                exclusive
                onChange={(_, val) => {
                  if (val) updateField(key, val as TriState);
                }}
                size="small"
              >
                <ToggleButton value="any">Any</ToggleButton>
                <ToggleButton value="required">Required</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          ))}
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
          <Button onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth
            disabled={!form.name.trim()}
          >
            {isEdit ? "Save Changes" : "Add Profile"}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
