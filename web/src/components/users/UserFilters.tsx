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
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import type { UserListQueryParams } from "../../api/types";

interface UserFiltersProps {
  filters: UserListQueryParams;
  onFilterChange: (filters: UserListQueryParams) => void;
}

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "agent", label: "Agent" },
  { value: "readonly", label: "Read-only" },
  { value: "guest", label: "Guest" },
];

const ACTIVE_OPTIONS = [
  { value: "1", label: "Active" },
  { value: "0", label: "Inactive" },
  { value: "all", label: "All" },
];

export function UserFilters({ filters, onFilterChange }: UserFiltersProps) {
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
    (key: keyof UserListQueryParams, value: string) => {
      onFilterChange({ ...filters, [key]: value || undefined, page: 1 });
    },
    [filters, onFilterChange],
  );

  const hasActiveFilters =
    filters.q || filters.role || (filters.active && filters.active !== "1");

  const handleClear = useCallback(() => {
    onFilterChange({ page: 1, per_page: filters.per_page });
  }, [filters.per_page, onFilterChange]);

  return (
    <Box
      sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}
    >
      <TextField
        size="small"
        placeholder="Search users..."
        defaultValue={filters.q ?? ""}
        onChange={(e) => handleSearchChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ minWidth: 220 }}
      />

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Role</InputLabel>
        <Select
          label="Role"
          value={filters.role ?? ""}
          onChange={(e) => handleSelectChange("role", e.target.value)}
        >
          {ROLE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Status</InputLabel>
        <Select
          label="Status"
          value={filters.active ?? "1"}
          onChange={(e) => handleSelectChange("active", e.target.value)}
        >
          {ACTIVE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {hasActiveFilters && (
        <Button
          size="small"
          startIcon={<ClearIcon />}
          onClick={handleClear}
          sx={{ textTransform: "none" }}
        >
          Clear
        </Button>
      )}
    </Box>
  );
}
