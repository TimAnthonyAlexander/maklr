import { Box, Typography, IconButton } from "@mui/material";
import { Plus, FileText, Trash2 } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import type { WebsitePage } from "../../api/types";

interface WebsitePageListProps {
  pages: WebsitePage[];
  selectedPageId: string | null;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDeletePage: (pageId: string) => void;
}

export function WebsitePageList({
  pages,
  selectedPageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
}: WebsitePageListProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        width: 200,
        minWidth: 200,
        borderRight: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{
          p: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="caption" fontWeight={600} textTransform="uppercase" color="text.secondary">
          {t("websites.editor.pages")}
        </Typography>
        <IconButton size="small" onClick={onAddPage}>
          <Plus size={16} />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", p: 0.5 }}>
        {pages.map((page) => (
          <Box
            key={page.id}
            onClick={() => onSelectPage(page.id)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 1,
              borderRadius: 1,
              cursor: "pointer",
              bgcolor: selectedPageId === page.id ? "rgba(0,0,0,0.06)" : "transparent",
              "&:hover": { bgcolor: selectedPageId === page.id ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.03)" },
              group: "page-item",
            }}
          >
            <FileText size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
            <Typography
              sx={{
                fontSize: "0.8rem",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: selectedPageId === page.id ? 600 : 400,
              }}
            >
              {page.title}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDeletePage(page.id);
              }}
              sx={{ opacity: 0, ".MuiBox-root:hover &": { opacity: 1 }, p: 0.25 }}
            >
              <Trash2 size={12} />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
