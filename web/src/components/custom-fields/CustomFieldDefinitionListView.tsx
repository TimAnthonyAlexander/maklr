import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
} from "@mui/material";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { CustomFieldDefinition } from "../../api/types";
import { useTranslation } from "../../contexts/LanguageContext";

interface CustomFieldDefinitionListViewProps {
  definitions: CustomFieldDefinition[];
  loading: boolean;
  onEdit: (def: CustomFieldDefinition) => void;
  onDelete: (def: CustomFieldDefinition) => void;
  onAddClick: () => void;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  number: "Number",
  select: "Select",
  boolean: "Boolean",
  date: "Date",
  textarea: "Textarea",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  estate: "Estate",
  contact: "Contact",
  both: "Both",
};

export function CustomFieldDefinitionListView({
  definitions,
  loading,
  onEdit,
  onDelete,
  onAddClick,
}: CustomFieldDefinitionListViewProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Paper variant="outlined">
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ px: 3, py: 2 }}>
            <Skeleton variant="text" width="60%" />
          </Box>
        ))}
      </Paper>
    );
  }

  if (definitions.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 6,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography color="text.secondary">
          {t("custom_fields.empty_state")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={onAddClick}
        >
          {t("custom_fields.add_field")}
        </Button>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("custom_fields.column_name")}</TableCell>
            <TableCell>{t("custom_fields.column_label")}</TableCell>
            <TableCell>{t("custom_fields.column_type")}</TableCell>
            <TableCell>{t("custom_fields.column_entity")}</TableCell>
            <TableCell>{t("custom_fields.column_required")}</TableCell>
            <TableCell>{t("custom_fields.column_active")}</TableCell>
            <TableCell>{t("custom_fields.column_order")}</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {definitions.map((def) => (
            <TableRow
              key={def.id}
              hover
              sx={{ cursor: "pointer" }}
              onClick={() => onEdit(def)}
            >
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {def.name}
                </Typography>
              </TableCell>
              <TableCell>{def.label}</TableCell>
              <TableCell>
                <Chip
                  label={FIELD_TYPE_LABELS[def.field_type ?? "text"] ?? def.field_type}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                {ENTITY_TYPE_LABELS[def.entity_type ?? "estate"] ?? def.entity_type}
              </TableCell>
              <TableCell>{def.required ? "Yes" : "No"}</TableCell>
              <TableCell>
                <Chip
                  label={def.active ? "Active" : "Inactive"}
                  size="small"
                  color={def.active ? "success" : "default"}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>{def.sort_order}</TableCell>
              <TableCell align="right">
                <Box
                  sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconButton size="small" onClick={() => onEdit(def)}>
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(def)}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
