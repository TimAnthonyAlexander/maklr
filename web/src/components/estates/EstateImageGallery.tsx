import { Box, Grid } from "@mui/material";
import { getEstateImageUrl } from "../../api/client";
import type { Estate, EstateImage } from "../../api/types";

interface EstateImageGalleryProps {
  estate: Estate;
  images: EstateImage[];
}

export function EstateImageGallery({ estate, images }: EstateImageGalleryProps) {
  const sortedImages = [...images].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  if (sortedImages.length === 0 || !estate.id) return null;

  return (
    <Grid container spacing={1.5}>
      {sortedImages.map((img) => (
        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={img.id}>
          <Box
            component="img"
            src={getEstateImageUrl(estate.id!, img.id ?? "")}
            alt={img.alt_text ?? img.title ?? img.file_name ?? ""}
            sx={{
              width: "100%",
              aspectRatio: "4/3",
              objectFit: "cover",
              display: "block",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          />
        </Grid>
      ))}
    </Grid>
  );
}
