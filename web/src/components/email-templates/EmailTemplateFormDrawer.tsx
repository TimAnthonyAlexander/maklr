import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { X, Save, Braces } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import type { EmailTemplate } from "../../api/types";
import {
  usePostEmailTemplateCreate,
  usePatchEmailTemplateUpdateById,
  useGetEmailTemplatePlaceholders,
} from "../../api/hooks";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "../../contexts/LanguageContext";

interface EmailTemplateFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  template: EmailTemplate | null;
}

const CATEGORIES = [
  "general",
  "follow_up",
  "listing",
  "viewing",
  "offer",
  "contract",
];

export function EmailTemplateFormDrawer({
  open,
  onClose,
  onSuccess,
  template,
}: EmailTemplateFormDrawerProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isEdit = template !== null;
  const canManageOffice =
    user?.role === "admin" || user?.role === "manager";

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [scope, setScope] = useState<string>("personal");
  const [active, setActive] = useState(true);
  const [placeholderAnchor, setPlaceholderAnchor] =
    useState<HTMLElement | null>(null);

  const { data: placeholders } = useGetEmailTemplatePlaceholders({
    enabled: open,
  });
  const createMutation = usePostEmailTemplateCreate();
  const updateMutation = usePatchEmailTemplateUpdateById();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: t("email_templates.body_placeholder"),
      }),
    ],
    content: "",
  });

  // Reset form when opening
  useEffect(() => {
    if (!open) return;

    if (template) {
      setName(template.name ?? "");
      setSubject(template.subject ?? "");
      setCategory(template.category ?? "");
      setScope(template.scope ?? "personal");
      setActive(template.active ?? true);
      editor?.commands.setContent(template.body_html ?? "");
    } else {
      setName("");
      setSubject("");
      setCategory("");
      setScope("personal");
      setActive(true);
      editor?.commands.setContent("");
    }
    createMutation.reset();
    updateMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template]);

  const handleInsertPlaceholder = useCallback(
    (key: string) => {
      editor?.commands.insertContent(key);
      setPlaceholderAnchor(null);
    },
    [editor],
  );

  const placeholderGroups = useMemo(() => {
    if (!placeholders) return [];
    return Object.entries(placeholders).map(([group, items]) => ({
      group,
      items,
    }));
  }, [placeholders]);

  const handleSave = useCallback(async () => {
    if (!name || !subject) return;

    const bodyHtml = editor?.getHTML() ?? "";
    const bodyText = editor?.getText() ?? "";

    try {
      if (isEdit && template?.id) {
        await updateMutation.mutate({
          path: { id: template.id },
          body: {
            name,
            subject,
            body_html: bodyHtml || null,
            body_text: bodyText || null,
            category: category || null,
            active,
          },
        });
      } else {
        await createMutation.mutate({
          body: {
            name,
            subject,
            body_html: bodyHtml || null,
            body_text: bodyText || null,
            category: category || null,
            scope,
          },
        });
      }
      onSuccess();
    } catch {
      // error surfaced via mutation
    }
  }, [
    name,
    subject,
    category,
    scope,
    active,
    editor,
    isEdit,
    template,
    createMutation,
    updateMutation,
    onSuccess,
  ]);

  const mutationError = createMutation.error ?? updateMutation.error;
  const saving = createMutation.loading || updateMutation.loading;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 640, maxWidth: "100vw" } }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {isEdit
              ? t("email_templates.edit")
              : t("email_templates.new")}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Box>

        {/* Form */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              px: 3,
              pt: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {mutationError && (
              <Alert severity="error">{mutationError.message}</Alert>
            )}

            <TextField
              size="small"
              fullWidth
              label={t("email_templates.name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <TextField
              size="small"
              fullWidth
              label={t("email_templates.subject")}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>{t("email_templates.category")}</InputLabel>
                <Select
                  value={category}
                  label={t("email_templates.category")}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <MenuItem value="">
                    <em>{t("email_templates.no_category")}</em>
                  </MenuItem>
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {!isEdit && (
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>{t("email_templates.scope")}</InputLabel>
                  <Select
                    value={scope}
                    label={t("email_templates.scope")}
                    onChange={(e) => setScope(e.target.value)}
                  >
                    <MenuItem value="personal">
                      {t("email_templates.scope_personal")}
                    </MenuItem>
                    {canManageOffice && (
                      <MenuItem value="office">
                        {t("email_templates.scope_office")}
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              )}

              {isEdit && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                    />
                  }
                  label={t("email_templates.active")}
                />
              )}
            </Box>
          </Box>

          {/* Placeholder insert button */}
          <Box sx={{ px: 3, pt: 2 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Braces size={18} />}
              onClick={(e) => setPlaceholderAnchor(e.currentTarget)}
            >
              {t("email_templates.insert_placeholder")}
            </Button>
          </Box>

          {/* TipTap Editor */}
          <Box
            sx={{
              flex: 1,
              px: 3,
              py: 2,
              "& .tiptap": {
                outline: "none",
                minHeight: 200,
                fontFamily: '"LINE Seed JP", sans-serif',
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "#1A1A1A",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                p: 2,
              },
              "& .tiptap p.is-editor-empty:first-child::before": {
                color: "#adb5bd",
                content: "attr(data-placeholder)",
                float: "left",
                height: 0,
                pointerEvents: "none",
              },
            }}
          >
            <EditorContent editor={editor} />
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Button variant="outlined" onClick={onClose} size="small">
            {t("email_templates.cancel")}
          </Button>
          <Button
            variant="contained"
            startIcon={<Save size={18} />}
            onClick={handleSave}
            disabled={!name || !subject || saving}
            size="small"
          >
            {saving ? t("email_templates.saving") : t("email_templates.save")}
          </Button>
        </Box>
      </Box>

      {/* Placeholder popover */}
      <Popover
        open={!!placeholderAnchor}
        anchorEl={placeholderAnchor}
        onClose={() => setPlaceholderAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <List sx={{ width: 280, maxHeight: 400, overflow: "auto" }} dense>
          {placeholderGroups.map(({ group, items }) => (
            <Box key={group}>
              <ListSubheader sx={{ lineHeight: "32px", fontWeight: 600 }}>
                {group.charAt(0).toUpperCase() + group.slice(1)}
              </ListSubheader>
              {items.map((item) => (
                <ListItem key={item.key} disablePadding>
                  <ListItemButton
                    onClick={() => handleInsertPlaceholder(item.key)}
                  >
                    <ListItemText
                      primary={item.label}
                      secondary={item.key}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{
                        variant: "caption",
                        fontFamily: "monospace",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </Box>
          ))}
        </List>
      </Popover>
    </Drawer>
  );
}
