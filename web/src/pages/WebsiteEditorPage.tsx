import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Skeleton,
  Alert,
} from "@mui/material";
import { Settings, ExternalLink, History } from "lucide-react";
import {
  useGetWebsiteShowById,
  useGetWebsitePageList,
  useGetWebsiteChatList,
  usePostWebsiteChatSend,
  useDeleteWebsitePageById,
  usePatchWebsiteUpdateById,
} from "../api/hooks";
import { useTranslation } from "../contexts/LanguageContext";
import { WebsitePageList } from "../components/websites/WebsitePageList";
import { WebsiteChatPanel } from "../components/websites/WebsiteChatPanel";
import { WebsitePreviewPane } from "../components/websites/WebsitePreviewPane";
import { WebsitePageCreateDialog } from "../components/websites/WebsitePageCreateDialog";
import { WebsiteSettingsDrawer } from "../components/websites/WebsiteSettingsDrawer";
import { WebsiteVersionHistory } from "../components/websites/WebsiteVersionHistory";
import type { WebsiteChatMessage } from "../api/types";

export function WebsiteEditorPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);

  const {
    data: website,
    loading: websiteLoading,
    error: websiteError,
    setData: setWebsite,
  } = useGetWebsiteShowById({ id: id ?? "" }, { enabled: !!id });

  const {
    data: pagesData,
    loading: pagesLoading,
    refetch: refetchPages,
  } = useGetWebsitePageList(
    { websiteId: id ?? "" },
    { enabled: !!id },
  );

  const pages = useMemo(() => pagesData?.items ?? [], [pagesData]);

  // Auto-select first page
  const effectivePageId = selectedPageId ?? pages[0]?.id ?? null;
  const activePage = useMemo(
    () => pages.find((p) => p.id === effectivePageId) ?? null,
    [pages, effectivePageId],
  );

  const {
    data: chatData,
    refetch: refetchChat,
  } = useGetWebsiteChatList(
    { websiteId: id ?? "" },
    effectivePageId ? { page_id: effectivePageId } : undefined,
    { enabled: !!id },
    [effectivePageId],
  );

  const chatMessages: WebsiteChatMessage[] = chatData?.items ?? [];

  const chatSend = usePostWebsiteChatSend();
  const deletePageMutation = useDeleteWebsitePageById();
  const updateWebsiteMutation = usePatchWebsiteUpdateById();

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!id || !effectivePageId) return;
      try {
        const result = await chatSend.mutate({
          path: { websiteId: id },
          body: { message, page_id: effectivePageId },
        });
        refetchChat();
        if (result.page) {
          refetchPages();
        }
      } catch {
        // Error handled by mutation hook
      }
    },
    [id, effectivePageId, chatSend, refetchChat, refetchPages],
  );

  const handleDeletePage = useCallback(
    async (pageId: string) => {
      if (!id) return;
      try {
        await deletePageMutation.mutate({
          path: { websiteId: id, id: pageId },
        });
        if (selectedPageId === pageId) {
          setSelectedPageId(null);
        }
        refetchPages();
      } catch {
        // Error handled by mutation hook
      }
    },
    [id, selectedPageId, deletePageMutation, refetchPages],
  );

  const handlePublishToggle = useCallback(async () => {
    if (!website || !id) return;
    try {
      const result = await updateWebsiteMutation.mutate({
        path: { id },
        body: { published: !website.published },
      });
      setWebsite(result);
    } catch {
      // Error handled by mutation hook
    }
  }, [website, id, updateWebsiteMutation, setWebsite]);

  const handlePageCreated = useCallback(() => {
    refetchPages();
  }, [refetchPages]);

  const handleVersionRestored = useCallback(() => {
    refetchPages();
  }, [refetchPages]);

  if (websiteLoading || pagesLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton width={300} height={40} />
        <Skeleton sx={{ mt: 2 }} height={500} />
      </Box>
    );
  }

  if (websiteError || !website) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{websiteError?.message ?? "Website not found"}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 0px)" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          minHeight: 52,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h6" fontWeight={600}>
            {website.name}
          </Typography>
          <Chip
            label={
              website.published
                ? t("websites.status.published")
                : t("websites.status.draft")
            }
            size="small"
            color={website.published ? "success" : "default"}
            variant="outlined"
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            size="small"
            variant={website.published ? "outlined" : "contained"}
            onClick={handlePublishToggle}
            disabled={updateWebsiteMutation.loading}
          >
            {website.published
              ? t("websites.editor.unpublish")
              : t("websites.editor.publish")}
          </Button>
          {effectivePageId && (
            <IconButton
              size="small"
              onClick={() => setVersionsOpen(true)}
              title={t("websites.versions.title")}
            >
              <History size={18} />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={() => setSettingsOpen(true)}
            title={t("websites.editor.settings")}
          >
            <Settings size={18} />
          </IconButton>
          {website.published && (
            <IconButton
              size="small"
              component="a"
              href={`/sites/${website.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title={t("websites.editor.view_live")}
            >
              <ExternalLink size={18} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Three-panel layout */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: Page List */}
        <WebsitePageList
          pages={pages}
          selectedPageId={effectivePageId}
          onSelectPage={setSelectedPageId}
          onAddPage={() => setAddPageOpen(true)}
          onDeletePage={handleDeletePage}
        />

        {/* Center: Chat Panel */}
        <Box sx={{ width: 360, minWidth: 360 }}>
          {effectivePageId ? (
            <WebsiteChatPanel
              messages={chatMessages}
              loading={chatSend.loading}
              onSend={handleSendMessage}
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                borderRight: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography color="text.secondary">
                {t("websites.editor.no_page_selected")}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Right: Preview Pane */}
        <WebsitePreviewPane
          html={activePage?.html_content ?? null}
          websiteName={website.name}
        />
      </Box>

      {/* Dialogs */}
      <WebsitePageCreateDialog
        open={addPageOpen}
        onClose={() => setAddPageOpen(false)}
        websiteId={id ?? ""}
        onSuccess={handlePageCreated}
      />

      <WebsiteSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        website={website}
        onUpdated={(updated) => {
          setWebsite(updated);
          setSettingsOpen(false);
        }}
        onDeleted={() => navigate("/websites")}
      />

      {effectivePageId && (
        <WebsiteVersionHistory
          open={versionsOpen}
          onClose={() => setVersionsOpen(false)}
          websiteId={id ?? ""}
          pageId={effectivePageId}
          onRestored={handleVersionRestored}
        />
      )}
    </Box>
  );
}
