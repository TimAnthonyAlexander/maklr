import { useState, useCallback } from "react";
import { Box, Typography, Button, Alert } from "@mui/material";
import { Plus } from "lucide-react";
import { useGetCustomFieldDefinitionList } from "../api/hooks";
import { CustomFieldDefinitionListView } from "../components/custom-fields/CustomFieldDefinitionListView";
import { CustomFieldDefinitionForm } from "../components/custom-fields/CustomFieldDefinitionForm";
import { CustomFieldDefinitionDeleteDialog } from "../components/custom-fields/CustomFieldDefinitionDeleteDialog";
import type { CustomFieldDefinition } from "../api/types";
import { useTranslation } from "../contexts/LanguageContext";

export function CustomFieldsPage() {
  const { t } = useTranslation();
  const { data, loading, error, refetch } =
    useGetCustomFieldDefinitionList(undefined);

  const definitions = data?.items ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editingDefinition, setEditingDefinition] =
    useState<CustomFieldDefinition | null>(null);
  const [deletingDefinition, setDeletingDefinition] =
    useState<CustomFieldDefinition | null>(null);

  const handleCreate = useCallback(() => {
    setEditingDefinition(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((def: CustomFieldDefinition) => {
    setEditingDefinition(def);
    setFormOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setEditingDefinition(null);
  }, []);

  const handleSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDeleteSuccess = useCallback(() => {
    setDeletingDefinition(null);
    refetch();
  }, [refetch]);

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t("custom_fields.page_title")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={handleCreate}
        >
          {t("custom_fields.add_field")}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <CustomFieldDefinitionListView
        definitions={definitions}
        loading={loading}
        onEdit={handleEdit}
        onDelete={setDeletingDefinition}
        onAddClick={handleCreate}
      />

      <CustomFieldDefinitionForm
        open={formOpen}
        onClose={handleFormClose}
        definition={editingDefinition}
        onSuccess={handleSuccess}
      />

      <CustomFieldDefinitionDeleteDialog
        definition={deletingDefinition}
        onClose={() => setDeletingDefinition(null)}
        onSuccess={handleDeleteSuccess}
      />
    </Box>
  );
}
