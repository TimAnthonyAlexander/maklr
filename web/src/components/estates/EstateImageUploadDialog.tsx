import { useState, useRef, useCallback } from "react";
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
  IconButton,
  LinearProgress,
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import {
  ESTATE_IMAGE_CATEGORIES,
  ESTATE_IMAGE_CATEGORY_LABELS,
  type EstateImageCategory,
} from "../../api/types";
import { useTranslation } from "../../contexts/LanguageContext";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

interface FileUploadItem {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface EstateImageUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<void>;
}

export function EstateImageUploadDialog({
  open,
  onClose,
  onUpload,
}: EstateImageUploadDialogProps) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [category, setCategory] = useState<EstateImageCategory>("photo");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setError(null);

    const validFiles: FileUploadItem[] = [];
    for (const file of selected) {
      if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
        setError(t("estate.upload_invalid_type", { name: file.name }));
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(t("estate.upload_too_large", { name: file.name }));
        continue;
      }
      validFiles.push({ file, status: "pending" });
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = useCallback(async () => {
    if (files.length === 0) {
      setError(t("estate.upload_no_files"));
      return;
    }

    setUploading(true);
    setError(null);

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if (item.status === "success") continue;

      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f)),
      );

      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("category", category);

      try {
        await onUpload(formData);
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "success" } : f)),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : t("estate.upload_failed");
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error", error: msg } : f,
          ),
        );
      }
    }

    setUploading(false);
  }, [files, category, onUpload, t]);

  const handleReset = () => {
    setFiles([]);
    setCategory("photo");
    setError(null);
    setUploading(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const allDone =
    files.length > 0 && files.every((f) => f.status === "success");
  const hasErrors = files.some((f) => f.status === "error");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles: FileUploadItem[] = [];

    for (const file of droppedFiles) {
      if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
        setError(t("estate.upload_invalid_type_short", { name: file.name }));
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(t("estate.upload_too_large_short", { name: file.name }));
        continue;
      }
      validFiles.push({ file, status: "pending" });
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("estate.upload_dialog_title")}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box
            sx={{
              border: "2px dashed",
              borderColor: files.length > 0 ? "primary.main" : "divider",
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
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <CloudUploadOutlinedIcon
              sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {t("estate.upload_drag_text")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("estate.upload_file_types")}
            </Typography>
          </Box>

          {files.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {files.map((item, index) => (
                <Box
                  key={`${item.file.name}-${index}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1,
                    border: "1px solid",
                    borderColor:
                      item.status === "error"
                        ? "error.main"
                        : item.status === "success"
                          ? "success.main"
                          : "divider",
                    borderRadius: 1,
                  }}
                >
                  <Box
                    component="img"
                    src={URL.createObjectURL(item.file)}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      objectFit: "cover",
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                    {item.status === "uploading" && (
                      <LinearProgress sx={{ mt: 0.5 }} />
                    )}
                    {item.status === "error" && (
                      <Typography variant="caption" color="error">
                        {item.error}
                      </Typography>
                    )}
                  </Box>
                  {item.status === "success" && (
                    <CheckCircleOutlineIcon
                      color="success"
                      sx={{ fontSize: 20 }}
                    />
                  )}
                  {item.status === "error" && (
                    <ErrorOutlineIcon color="error" sx={{ fontSize: 20 }} />
                  )}
                  {(item.status === "pending" || item.status === "error") &&
                    !uploading && (
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                </Box>
              ))}
            </Box>
          )}

          <FormControl fullWidth size="small">
            <InputLabel>{t("estate.upload_category")}</InputLabel>
            <Select
              value={category}
              label={t("estate.upload_category")}
              onChange={(e) =>
                setCategory(e.target.value as EstateImageCategory)
              }
              disabled={uploading}
            >
              {ESTATE_IMAGE_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {ESTATE_IMAGE_CATEGORY_LABELS[cat]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={uploading}>
          {allDone ? t("estate.upload_done") : t("estate.upload_cancel")}
        </Button>
        {!allDone && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              uploading || files.length === 0 || (allDone && !hasErrors)
            }
          >
            {uploading
              ? t("estate.upload_uploading")
              : hasErrors
                ? t("estate.upload_retry")
                : t("estate.upload_button")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
