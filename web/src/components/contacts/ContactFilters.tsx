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
import type { ContactListQueryParams } from "../../api/types";

interface ContactFiltersProps {
  filters: ContactListQueryParams;
  onFilterChange: (filters: ContactListQueryParams) => void;
}

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "tenant", label: "Tenant" },
  { value: "landlord", label: "Landlord" },
  { value: "misc", label: "Misc" },
];

const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "All Entities" },
  { value: "person", label: "Person" },
  { value: "company", label: "Company" },
];

const STAGE_OPTIONS = [
  { value: "", label: "All Stages" },
  { value: "cold", label: "Cold" },
  { value: "warm", label: "Warm" },
  { value: "hot", label: "Hot" },
  { value: "customer", label: "Customer" },
  { value: "lost", label: "Lost" },
];

export function ContactFilters({
  filters,
  onFilterChange,
}: ContactFiltersProps) {
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
    (key: keyof ContactListQueryParams, value: string) => {
      onFilterChange({ ...filters, [key]: value || undefined, page: 1 });
    },
    [filters, onFilterChange],
  );

  const hasActiveFilters =
    filters.q || filters.type || filters.entity_type || filters.stage;

  const handleClear = useCallback(() => {
    onFilterChange({ page: 1, per_page: filters.per_page });
  }, [filters.per_page, onFilterChange]);

  return (
    <Box
      sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}
    >
      <TextField
        size="small"
        placeholder="Search contacts..."
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

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Type</InputLabel>
        <Select
          label="Type"
          value={filters.type ?? ""}
          onChange={(e) => handleSelectChange("type", e.target.value)}
        >
          {TYPE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Entity</InputLabel>
        <Select
          label="Entity"
          value={filters.entity_type ?? ""}
          onChange={(e) => handleSelectChange("entity_type", e.target.value)}
        >
          {ENTITY_TYPE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Stage</InputLabel>
        <Select
          label="Stage"
          value={filters.stage ?? ""}
          onChange={(e) => handleSelectChange("stage", e.target.value)}
        >
          {STAGE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
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
          Clear
        </Button>
      )}
    </Box>
  );
}
