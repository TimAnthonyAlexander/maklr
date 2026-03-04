import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Autocomplete,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import ClearIcon from "@mui/icons-material/Clear";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  usePostEmailSend,
  useGetEmailTemplateList,
  useGetContactList,
  useGetEstateList,
  usePostEmailTemplatePreviewById,
} from "../../api/hooks";
import type {
  Contact,
  EmailAccount,
  EmailMessage,
  EmailTemplate,
  Estate,
} from "../../api/types";
import { useTranslation } from "../../contexts/LanguageContext";

interface EmailComposeProps {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
  accounts: EmailAccount[];
  replyTo?: EmailMessage | null;
  defaultAccountId?: string;
}

function buildQuotedBody(email: EmailMessage, t: (key: string, params?: Record<string, string>) => string): string {
  const date = email.received_at
    ? new Date(email.received_at).toLocaleString("de-DE")
    : "";
  const headerText = t("email.quoted_header", { date, from: email.from_address ?? "" });
  const header = `<br/><br/><div style="border-left:3px solid #e0e0e0;padding-left:12px;color:#6B6B6B;margin-top:16px"><p>${headerText}</p>${email.body_html ?? email.body_text ?? ""}</div>`;
  return header;
}

export function EmailCompose({
  open,
  onClose,
  onSent,
  accounts,
  replyTo,
  defaultAccountId,
}: EmailComposeProps) {
  const { t } = useTranslation();
  const [accountId, setAccountId] = useState(defaultAccountId ?? "");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedEstate, setSelectedEstate] = useState<Estate | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [estateSearch, setEstateSearch] = useState("");

  const sendMutation = usePostEmailSend();
  const { data: templateData } = useGetEmailTemplateList(
    { active: "true", per_page: 100 },
    { enabled: open },
  );
  const templates = templateData?.items ?? [];

  const { data: contactData, loading: contactsLoading } = useGetContactList(
    { q: contactSearch, per_page: 10 },
    { enabled: open && !!selectedTemplate },
    [contactSearch],
  );
  const contactOptions = contactData?.items ?? [];

  const { data: estateData, loading: estatesLoading } = useGetEstateList(
    { q: estateSearch, per_page: 10 },
    { enabled: open && !!selectedTemplate },
    [estateSearch],
  );
  const estateOptions = estateData?.items ?? [];

  const previewMutation = usePostEmailTemplatePreviewById();

  const initialContent = useMemo(() => {
    if (!replyTo) return "";
    return buildQuotedBody(replyTo, t);
  }, [replyTo, t]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: t("email.compose_placeholder") }),
    ],
    content: initialContent,
  });

  // Reset form when opening
  useEffect(() => {
    if (!open) return;

    if (replyTo) {
      setTo(
        replyTo.direction === "outgoing"
          ? (replyTo.to_addresses ?? "")
          : (replyTo.from_address ?? ""),
      );
      setSubject(
        replyTo.subject?.startsWith("Re: ")
          ? (replyTo.subject ?? "")
          : `Re: ${replyTo.subject ?? ""}`,
      );
      setAccountId(replyTo.email_account_id ?? defaultAccountId ?? "");
      editor?.commands.setContent(buildQuotedBody(replyTo, t));
    } else {
      setTo("");
      setSubject("");
      setAccountId(defaultAccountId ?? accounts[0]?.id ?? "");
      editor?.commands.setContent("");
    }
    setCc("");
    setBcc("");
    setShowCcBcc(false);
    setSelectedTemplate(null);
    setSelectedContact(replyTo?.contact_id ? ({ id: replyTo.contact_id, ...replyTo.contact } as Contact) : null);
    setSelectedEstate(null);
    setContactSearch("");
    setEstateSearch("");
    sendMutation.reset();
    previewMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, replyTo]);

  // Fetch template preview when template + context changes
  useEffect(() => {
    if (!selectedTemplate?.id) return;
    const contactId = selectedContact?.id ?? null;
    const estateId = selectedEstate?.id ?? null;
    if (!contactId && !estateId) return;

    previewMutation.mutate({
      path: { id: selectedTemplate.id },
      body: {
        contact_id: contactId,
        estate_id: estateId,
      },
    }).then((preview) => {
      if (preview.subject) setSubject(preview.subject);
      if (preview.body_html) editor?.commands.setContent(preview.body_html);
    }).catch(() => {
      // error surfaced via previewMutation.error
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate?.id, selectedContact?.id, selectedEstate?.id]);

  const handleSend = useCallback(async () => {
    if (!accountId || !to || !subject) return;

    const bodyHtml = editor?.getHTML() ?? "";
    const bodyText = editor?.getText() ?? "";

    try {
      await sendMutation.mutate({
        body: {
          email_account_id: accountId,
          to,
          cc: cc || undefined,
          bcc: bcc || undefined,
          subject,
          body_html: bodyHtml,
          body_text: bodyText,
          in_reply_to: replyTo?.message_id ?? undefined,
          contact_id: replyTo?.contact_id ?? undefined,
          email_template_id: selectedTemplate?.id ?? undefined,
        },
      });
      onSent();
      onClose();
    } catch {
      // error surfaced via sendMutation.error
    }
  }, [
    accountId,
    to,
    cc,
    bcc,
    subject,
    editor,
    sendMutation,
    replyTo,
    selectedTemplate,
    onSent,
    onClose,
  ]);

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
            {replyTo ? t("email.reply") : t("email.new_email")}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
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
              gap: 1.5,
            }}
          >
            {sendMutation.error && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {sendMutation.error.message}
              </Alert>
            )}

            {/* Account selector */}
            <FormControl size="small" fullWidth>
              <InputLabel>{t("email.from")}</InputLabel>
              <Select
                value={accountId}
                label={t("email.from")}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {accounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>
                    {acc.name} ({acc.email_address})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Template picker */}
            {templates.length > 0 && (
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>{t("email_templates.template")}</InputLabel>
                  <Select
                    value={selectedTemplate?.id ?? ""}
                    label={t("email_templates.template")}
                    onChange={(e) => {
                      const tmpl = templates.find((t) => t.id === e.target.value) ?? null;
                      setSelectedTemplate(tmpl);
                      if (tmpl) {
                        if (tmpl.subject) setSubject(tmpl.subject);
                        if (tmpl.body_html) editor?.commands.setContent(tmpl.body_html);
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>{t("email_templates.no_template")}</em>
                    </MenuItem>
                    {templates.map((tmpl) => (
                      <MenuItem key={tmpl.id} value={tmpl.id}>
                        {tmpl.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectedTemplate && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setSelectedContact(null);
                      setSelectedEstate(null);
                      setContactSearch("");
                      setEstateSearch("");
                      setSubject("");
                      editor?.commands.setContent("");
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            )}

            {/* Contact/Estate pickers (shown when template selected) */}
            {selectedTemplate && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Autocomplete
                  size="small"
                  fullWidth
                  options={contactOptions}
                  value={selectedContact}
                  getOptionLabel={(option) =>
                    [option.first_name, option.last_name].filter(Boolean).join(" ") ||
                    option.company_name ||
                    option.email ||
                    ""
                  }
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onInputChange={(_, value, reason) => {
                    if (reason === "input") setContactSearch(value);
                  }}
                  onChange={(_, value) => setSelectedContact(value)}
                  loading={contactsLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t("email.select_contact")}
                      placeholder={t("email.search_contact")}
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {contactsLoading && <CircularProgress size={18} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                />
                <Autocomplete
                  size="small"
                  fullWidth
                  options={estateOptions}
                  value={selectedEstate}
                  getOptionLabel={(option) => option.title ?? ""}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onInputChange={(_, value, reason) => {
                    if (reason === "input") setEstateSearch(value);
                  }}
                  onChange={(_, value) => setSelectedEstate(value)}
                  loading={estatesLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t("email.select_estate")}
                      placeholder={t("email.search_estate")}
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {estatesLoading && <CircularProgress size={18} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                />
              </Box>
            )}

            <TextField
              size="small"
              fullWidth
              label={t("email.to_label")}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder={t("email.to_placeholder")}
            />

            {!showCcBcc && (
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  cursor: "pointer",
                  "&:hover": { color: "text.primary" },
                }}
                onClick={() => setShowCcBcc(true)}
              >
                {t("email.cc_bcc_toggle")}
              </Typography>
            )}

            {showCcBcc && (
              <>
                <TextField
                  size="small"
                  fullWidth
                  label={t("email.cc_label")}
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                />
                <TextField
                  size="small"
                  fullWidth
                  label={t("email.bcc_label")}
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                />
              </>
            )}

            <TextField
              size="small"
              fullWidth
              label={t("email.subject")}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
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
              },
              "& .tiptap p.is-editor-empty:first-child::before": {
                color: "#adb5bd",
                content: "attr(data-placeholder)",
                float: "left",
                height: 0,
                pointerEvents: "none",
              },
              "& .tiptap blockquote": {
                borderLeft: "3px solid #e0e0e0",
                paddingLeft: "12px",
                color: "#6B6B6B",
                marginLeft: 0,
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
            {t("email.discard")}
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSend}
            disabled={!accountId || !to || !subject || sendMutation.loading}
            size="small"
          >
            {sendMutation.loading ? t("email.sending") : t("email.send")}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
