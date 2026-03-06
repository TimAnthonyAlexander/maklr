import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Download, Trash2, FileText } from "lucide-react";
import {
  type Document,
  DOCUMENT_CATEGORY_LABELS,
  type DocumentCategory,
} from "../../api/types";
import { getDocumentDownloadUrl } from "../../api/client";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface DocumentListTableProps {
  documents: Document[];
  loading: boolean;
  canDelete: boolean;
  onDeleteClick: (doc: Document) => void;
}

export function DocumentListTable({
  documents,
  loading,
  canDelete,
  onDeleteClick,
}: DocumentListTableProps) {
  if (loading) {
    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Size</TableCell>
              <TableCell>Uploaded By</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (documents.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 6,
          color: "text.secondary",
        }}
      >
        <FileText size={48} style={{ marginBottom: 8, opacity: 0.5 }} />
        <Typography variant="body1">No documents yet</Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>File Name</TableCell>
            <TableCell>Category</TableCell>
            <TableCell align="right">Size</TableCell>
            <TableCell>Uploaded By</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {doc.file_name}
                </Typography>
              </TableCell>
              <TableCell>
                {doc.category ? (
                  <Chip
                    label={
                      DOCUMENT_CATEGORY_LABELS[
                        doc.category as DocumentCategory
                      ] ?? doc.category
                    }
                    size="small"
                    variant="outlined"
                  />
                ) : (
                  "\u2014"
                )}
              </TableCell>
              <TableCell align="right">
                {doc.file_size != null
                  ? formatFileSize(doc.file_size)
                  : "\u2014"}
              </TableCell>
              <TableCell>{doc.uploaded_by_user?.name ?? "\u2014"}</TableCell>
              <TableCell>
                {doc.created_at
                  ? dateFormatter.format(new Date(doc.created_at))
                  : "\u2014"}
              </TableCell>
              <TableCell align="right">
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}
                >
                  <Tooltip title="Download">
                    <IconButton
                      size="small"
                      component="a"
                      href={getDocumentDownloadUrl(doc.id ?? "")}
                      target="_blank"
                      rel="noopener"
                    >
                      <Download size={20} />
                    </IconButton>
                  </Tooltip>
                  {canDelete && (
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteClick(doc)}
                      >
                        <Trash2 size={20} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
