import { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import { CloudUpload } from "lucide-react";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  type DocumentCategory,
} from "../../api/types";

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<void>;
  loading: boolean;
  entityType?: "estate" | "contact" | "appointment" | "email";
  entityId?: string;
}

export function DocumentUploadDialog({
  open,
  onClose,
  onUpload,
  loading,
  entityType,
  entityId,
}: DocumentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory | "">("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (category) {
      formData.append("category", category);
    }
    if (entityType && entityId) {
      formData.append(`${entityType}_id`, entityId);
    }

    try {
      await onUpload(formData);
      handleReset();
    } catch {
      // Error handled by parent
    }
  };

  const handleReset = () => {
    setFile(null);
    setCategory("");
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Document</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box
            sx={{
              border: "2px dashed",
              borderColor: file ? "primary.main" : "divider",
              borderRadius: 2,
              p: 3,
              textAlign: "center",
              cursor: "pointer",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "action.hover",
              },
            }}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <CloudUpload
              size={40}
              style={{ marginBottom: 8 }}
            />
            {file ? (
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Click to select a file (max 25 MB)
              </Typography>
            )}
          </Box>

          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {DOCUMENT_CATEGORY_LABELS[cat]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !file}
        >
          {loading ? "Uploading..." : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
