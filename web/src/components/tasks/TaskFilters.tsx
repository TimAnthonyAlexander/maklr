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
import type { TaskListQueryParams } from "../../api/types";
import { useTranslation } from "../../contexts/LanguageContext";

interface TaskFiltersProps {
  filters: TaskListQueryParams;
  onFilterChange: (filters: TaskListQueryParams) => void;
}

const STATUS_KEYS = ["open", "in_progress", "done", "cancelled"] as const;
const PRIORITY_KEYS = ["low", "medium", "high", "urgent"] as const;
const TYPE_KEYS = [
  "task",
  "follow_up",
  "viewing",
  "call",
  "document_request",
  "maintenance",
] as const;

export function TaskFilters({ filters, onFilterChange }: TaskFiltersProps) {
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
    (key: keyof TaskListQueryParams, value: string) => {
      onFilterChange({ ...filters, [key]: value || undefined, page: 1 });
    },
    [filters, onFilterChange],
  );

  const hasActiveFilters =
    filters.q || filters.status || filters.priority || filters.type;

  const handleClear = useCallback(() => {
    onFilterChange({ page: 1, per_page: filters.per_page });
  }, [filters.per_page, onFilterChange]);

  return (
    <Box
      sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}
    >
      <TextField
        size="small"
        placeholder={t("tasks.filters.search_placeholder")}
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

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>{t("tasks.filters.status")}</InputLabel>
        <Select
          label={t("tasks.filters.status")}
          value={filters.status ?? ""}
          onChange={(e) => handleSelectChange("status", e.target.value)}
        >
          <MenuItem value="">{t("tasks.filters.all_statuses")}</MenuItem>
          {STATUS_KEYS.map((key) => (
            <MenuItem key={key} value={key}>
              {t(`tasks.status.${key}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>{t("tasks.filters.priority")}</InputLabel>
        <Select
          label={t("tasks.filters.priority")}
          value={filters.priority ?? ""}
          onChange={(e) => handleSelectChange("priority", e.target.value)}
        >
          <MenuItem value="">{t("tasks.filters.all_priorities")}</MenuItem>
          {PRIORITY_KEYS.map((key) => (
            <MenuItem key={key} value={key}>
              {t(`tasks.priority.${key}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>{t("tasks.filters.type")}</InputLabel>
        <Select
          label={t("tasks.filters.type")}
          value={filters.type ?? ""}
          onChange={(e) => handleSelectChange("type", e.target.value)}
        >
          <MenuItem value="">{t("tasks.filters.all_types")}</MenuItem>
          {TYPE_KEYS.map((key) => (
            <MenuItem key={key} value={key}>
              {t(`tasks.type.${key}`)}
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
          {t("tasks.filters.clear")}
        </Button>
      )}
    </Box>
  );
}
