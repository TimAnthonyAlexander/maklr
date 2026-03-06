import { useRef, useCallback } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { X } from "lucide-react";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  type DocumentListQueryParams,
} from "../../api/types";

interface DocumentFiltersProps {
  filters: DocumentListQueryParams;
  onFilterChange: (filters: DocumentListQueryParams) => void;
}

export function DocumentFilters({
  filters,
  onFilterChange,
}: DocumentFiltersProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onFilterChange({ ...filters, q: value || undefined, page: 1 });
      }, 300);
    },
    [filters, onFilterChange],
  );

  const hasActiveFilters = !!(filters.q || filters.category);

  return (
    <Box
      sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}
    >
      <TextField
        size="small"
        placeholder="Search files..."
        defaultValue={filters.q ?? ""}
        onChange={handleSearchChange}
        sx={{ minWidth: 220 }}
      />

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Category</InputLabel>
        <Select
          value={filters.category ?? ""}
          label="Category"
          onChange={(e) =>
            onFilterChange({
              ...filters,
              category: e.target.value || undefined,
              page: 1,
            })
          }
        >
          <MenuItem value="">All</MenuItem>
          {DOCUMENT_CATEGORIES.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {DOCUMENT_CATEGORY_LABELS[cat]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {hasActiveFilters && (
        <Button
          size="small"
          startIcon={<X size={18} />}
          onClick={() =>
            onFilterChange({ page: 1, per_page: filters.per_page })
          }
        >
          Clear
        </Button>
      )}
    </Box>
  );
}
