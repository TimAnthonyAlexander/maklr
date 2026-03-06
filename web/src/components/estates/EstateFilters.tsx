import { useRef, useCallback } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  InputAdornment,
} from "@mui/material";
import { Search, X } from "lucide-react";
import type { EstateListQueryParams } from "../../api/types";
import { useTranslation } from "../../contexts/LanguageContext";

interface EstateFiltersProps {
  filters: EstateListQueryParams;
  onFilterChange: (filters: EstateListQueryParams) => void;
}

const STATUS_OPTIONS_KEYS = [
  { value: "", labelKey: "estate.filter_all_statuses" },
  { value: "draft", labelKey: "estate.status_draft" },
  { value: "active", labelKey: "estate.status_active" },
  { value: "reserved", labelKey: "estate.status_reserved" },
  { value: "sold", labelKey: "estate.status_sold" },
  { value: "rented", labelKey: "estate.status_rented" },
  { value: "archived", labelKey: "estate.status_archived" },
];

const PROPERTY_TYPE_OPTIONS_KEYS = [
  { value: "", labelKey: "estate.filter_all_types" },
  { value: "apartment", labelKey: "estate.property_type_apartment" },
  { value: "house", labelKey: "estate.property_type_house" },
  { value: "commercial", labelKey: "estate.property_type_commercial" },
  { value: "land", labelKey: "estate.property_type_land" },
  { value: "garage", labelKey: "estate.property_type_garage" },
];

const MARKETING_TYPE_OPTIONS_KEYS = [
  { value: "", labelKey: "estate.filter_all_marketing" },
  { value: "sale", labelKey: "estate.marketing_type_sale" },
  { value: "rent", labelKey: "estate.marketing_type_rent" },
  { value: "lease", labelKey: "estate.marketing_type_lease" },
];

export function EstateFilters({ filters, onFilterChange }: EstateFiltersProps) {
  const { t } = useTranslation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onFilterChange({ ...filters, q: value || undefined, page: 1 });
      }, 300);
    },
    [filters, onFilterChange],
  );

  const handleSelectChange = useCallback(
    (key: keyof EstateListQueryParams, value: string) => {
      onFilterChange({ ...filters, [key]: value || undefined, page: 1 });
    },
    [filters, onFilterChange],
  );

  const hasActiveFilters =
    filters.q ||
    filters.status ||
    filters.property_type ||
    filters.marketing_type;

  const handleClear = useCallback(() => {
    onFilterChange({ page: 1, per_page: filters.per_page });
  }, [filters.per_page, onFilterChange]);

  return (
    <Box
      sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}
    >
      <TextField
        size="small"
        placeholder={t("estate.search_placeholder")}
        defaultValue={filters.q ?? ""}
        onChange={(e) => handleSearchChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            ),
          },
        }}
        sx={{ minWidth: 220 }}
      />

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>{t("estate.filter_status")}</InputLabel>
        <Select
          label={t("estate.filter_status")}
          value={filters.status ?? ""}
          onChange={(e) => handleSelectChange("status", e.target.value)}
        >
          {STATUS_OPTIONS_KEYS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>{t("estate.field_property_type")}</InputLabel>
        <Select
          label={t("estate.field_property_type")}
          value={filters.property_type ?? ""}
          onChange={(e) => handleSelectChange("property_type", e.target.value)}
        >
          {PROPERTY_TYPE_OPTIONS_KEYS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>{t("estate.filter_marketing")}</InputLabel>
        <Select
          label={t("estate.filter_marketing")}
          value={filters.marketing_type ?? ""}
          onChange={(e) => handleSelectChange("marketing_type", e.target.value)}
        >
          {MARKETING_TYPE_OPTIONS_KEYS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {hasActiveFilters && (
        <Button
          size="small"
          startIcon={<X size={18} />}
          onClick={handleClear}
          sx={{ textTransform: "none" }}
        >
          {t("estate.filter_clear")}
        </Button>
      )}
    </Box>
  );
}
