import { useCallback } from "react";
import { Box, TextField, MenuItem, InputAdornment } from "@mui/material";
import { Search } from "lucide-react";
import type { ActivityListQueryParams } from "../../api/types";
import { useTranslation } from "../../contexts/LanguageContext";

const ACTIVITY_TYPES = [
  { value: "", labelKey: "activity.filters.all_types" },
  { value: "estate_created", labelKey: "activity.type.estate_created" },
  {
    value: "estate_status_changed",
    labelKey: "activity.type.estate_status_changed",
  },
  { value: "estate_deleted", labelKey: "activity.type.estate_deleted" },
  { value: "contact_created", labelKey: "activity.type.contact_created" },
  {
    value: "contact_stage_changed",
    labelKey: "activity.type.contact_stage_changed",
  },
  { value: "contact_deleted", labelKey: "activity.type.contact_deleted" },
  { value: "task_created", labelKey: "activity.type.task_created" },
  {
    value: "task_status_changed",
    labelKey: "activity.type.task_status_changed",
  },
  { value: "task_deleted", labelKey: "activity.type.task_deleted" },
  {
    value: "appointment_created",
    labelKey: "activity.type.appointment_created",
  },
  {
    value: "appointment_updated",
    labelKey: "activity.type.appointment_updated",
  },
  {
    value: "appointment_deleted",
    labelKey: "activity.type.appointment_deleted",
  },
  { value: "phone_call", labelKey: "activity.type.phone_call" },
  { value: "meeting", labelKey: "activity.type.meeting" },
  { value: "note", labelKey: "activity.type.note" },
  { value: "viewing", labelKey: "activity.type.viewing" },
];

interface ActivityFiltersProps {
  filters: ActivityListQueryParams;
  onFilterChange: (filters: ActivityListQueryParams) => void;
}

export function ActivityFilters({
  filters,
  onFilterChange,
}: ActivityFiltersProps) {
  const { t } = useTranslation();

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange({ ...filters, q: e.target.value || undefined, page: 1 });
    },
    [filters, onFilterChange],
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange({
        ...filters,
        type: e.target.value || undefined,
        page: 1,
      });
    },
    [filters, onFilterChange],
  );

  const handleDateFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange({
        ...filters,
        date_from: e.target.value || undefined,
        page: 1,
      });
    },
    [filters, onFilterChange],
  );

  const handleDateToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange({
        ...filters,
        date_to: e.target.value || undefined,
        page: 1,
      });
    },
    [filters, onFilterChange],
  );

  return (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      <TextField
        size="small"
        placeholder={t("activity.filters.search_placeholder")}
        value={filters.q ?? ""}
        onChange={handleSearchChange}
        sx={{ minWidth: 220 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        select
        size="small"
        value={filters.type ?? ""}
        onChange={handleTypeChange}
        sx={{ minWidth: 180 }}
        label={t("activity.filters.type")}
      >
        {ACTIVITY_TYPES.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {t(opt.labelKey)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        type="date"
        size="small"
        label={t("activity.filters.date_from")}
        value={filters.date_from ?? ""}
        onChange={handleDateFromChange}
        sx={{ minWidth: 160 }}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <TextField
        type="date"
        size="small"
        label={t("activity.filters.date_to")}
        value={filters.date_to ?? ""}
        onChange={handleDateToChange}
        sx={{ minWidth: 160 }}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </Box>
  );
}
