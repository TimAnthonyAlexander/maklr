import { useState, useCallback } from "react";
import { Box, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  useGetDocumentList,
  usePostDocumentCreate,
  useDeleteDocumentById,
} from "../../api/hooks";
import type { Document } from "../../api/types";
import { useAuth } from "../../contexts/AuthContext";
import { DocumentListTable } from "./DocumentListTable";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { DocumentDeleteDialog } from "./DocumentDeleteDialog";

interface EntityDocumentsTabProps {
  entityType: "estate" | "contact" | "appointment" | "email";
  entityId: string;
}

export function EntityDocumentsTab({
  entityType,
  entityId,
}: EntityDocumentsTabProps) {
  const { user } = useAuth();
  const canDelete = user?.role === "admin" || user?.role === "manager";

  const query = { [`${entityType}_id`]: entityId };
  const { data, loading, refetch } = useGetDocumentList(query);
  const uploadMutation = usePostDocumentCreate();
  const deleteMutation = useDeleteDocumentById();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);

  const handleUpload = useCallback(
    async (formData: FormData) => {
      await uploadMutation.mutate({ formData });
      setUploadOpen(false);
      refetch();
    },
    [uploadMutation, refetch],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteMutation.mutate({ path: { id: deleteTarget.id } });
      setDeleteTarget(null);
      refetch();
    } catch {
      // Error captured by mutation hook
    }
  }, [deleteTarget, deleteMutation, refetch]);

  const documents = data?.items ?? [];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setUploadOpen(true)}
        >
          Upload
        </Button>
      </Box>

      <DocumentListTable
        documents={documents}
        loading={loading}
        canDelete={canDelete}
        onDeleteClick={setDeleteTarget}
      />

      <DocumentUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
        loading={uploadMutation.loading}
        entityType={entityType}
        entityId={entityId}
      />

      <DocumentDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.loading}
        fileName={deleteTarget?.file_name ?? ""}
      />
    </Box>
  );
}
