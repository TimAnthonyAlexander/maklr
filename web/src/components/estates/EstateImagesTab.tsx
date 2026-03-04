import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { EstateImage } from "../../api/types";
import {
  ESTATE_IMAGE_CATEGORY_LABELS,
  type EstateImageCategory,
} from "../../api/types";
import { getEstateImageUrl } from "../../api/client";
import {
  usePostEstateImageUpload,
  usePatchEstateImageUpdate,
  useDeleteEstateImage,
} from "../../api/hooks";
import { useTranslation } from "../../contexts/LanguageContext";
import { EstateImageUploadDialog } from "./EstateImageUploadDialog";
import { EstateImageDeleteDialog } from "./EstateImageDeleteDialog";

interface EstateImagesTabProps {
  estateId: string;
  images: EstateImage[];
  onImagesChanged: () => void;
}

export function EstateImagesTab({
  estateId,
  images,
  onImagesChanged,
}: EstateImagesTabProps) {
  const { t } = useTranslation();
  const uploadMutation = usePostEstateImageUpload();
  const updateMutation = usePatchEstateImageUpdate();
  const deleteMutation = useDeleteEstateImage();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EstateImage | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuImage, setMenuImage] = useState<EstateImage | null>(null);

  const handleUpload = useCallback(
    async (formData: FormData) => {
      await uploadMutation.mutate({ estateId, formData });
      onImagesChanged();
    },
    [estateId, uploadMutation, onImagesChanged],
  );

  const handleSetPrimary = useCallback(
    async (image: EstateImage) => {
      if (!image.id) return;
      try {
        await updateMutation.mutate({
          path: { id: estateId, imageId: image.id },
          body: { is_primary: true },
        });
        onImagesChanged();
      } catch {
        // error surfaced via mutation
      }
    },
    [estateId, updateMutation, onImagesChanged],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteMutation.mutate({
        path: { id: estateId, imageId: deleteTarget.id },
      });
      setDeleteTarget(null);
      onImagesChanged();
    } catch {
      // error surfaced via mutation
    }
  }, [estateId, deleteTarget, deleteMutation, onImagesChanged]);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    image: EstateImage,
  ) => {
    setMenuAnchor(event.currentTarget);
    setMenuImage(image);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuImage(null);
  };

  const sortedImages = [...images].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {t("estate.images_title", { count: String(images.length) })}
        </Typography>
        <Button
          size="small"
          startIcon={<AddPhotoAlternateOutlinedIcon />}
          onClick={() => setUploadOpen(true)}
        >
          {t("estate.upload_image")}
        </Button>
      </Box>

      {sortedImages.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 6,
            color: "text.secondary",
          }}
        >
          <ImageOutlinedIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
          <Typography variant="body2">{t("estate.no_images")}</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {sortedImages.map((img) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={img.id}>
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: img.is_primary ? "primary.main" : "divider",
                  position: "relative",
                }}
              >
                <Box
                  component="img"
                  src={getEstateImageUrl(estateId, img.id ?? "")}
                  alt={img.alt_text ?? img.file_name ?? ""}
                  sx={{
                    width: "100%",
                    aspectRatio: "4/3",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                {img.is_primary && (
                  <Chip
                    label={t("estate.image_primary")}
                    size="small"
                    color="primary"
                    sx={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      fontSize: "0.7rem",
                      height: 22,
                    }}
                  />
                )}
                <IconButton
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "rgba(255,255,255,0.85)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
                  }}
                  onClick={(e) => handleMenuOpen(e, img)}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
                <Box sx={{ p: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 500,
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {img.title ?? img.file_name ?? "\u2014"}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Chip
                      label={
                        ESTATE_IMAGE_CATEGORY_LABELS[
                          (img.category ?? "photo") as EstateImageCategory
                        ] ?? img.category
                      }
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.65rem", height: 20 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {img.file_size
                        ? `${(img.file_size / 1024).toFixed(0)} KB`
                        : ""}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context menu */}
      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={handleMenuClose}
      >
        {menuImage && !menuImage.is_primary && (
          <MenuItem
            onClick={() => {
              if (menuImage) handleSetPrimary(menuImage);
              handleMenuClose();
            }}
          >
            <StarIcon sx={{ fontSize: 18, mr: 1 }} />
            {t("estate.image_set_primary")}
          </MenuItem>
        )}
        {menuImage?.is_primary && (
          <MenuItem disabled>
            <StarBorderIcon sx={{ fontSize: 18, mr: 1 }} />
            {t("estate.image_is_primary")}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            if (menuImage) setDeleteTarget(menuImage);
            handleMenuClose();
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteOutlineIcon sx={{ fontSize: 18, mr: 1 }} />
          {t("estate.image_delete")}
        </MenuItem>
      </Menu>

      {/* Upload dialog */}
      <EstateImageUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
      />

      {/* Delete confirm dialog */}
      <EstateImageDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.loading}
        imageName={deleteTarget?.file_name ?? ""}
      />
    </Box>
  );
}
