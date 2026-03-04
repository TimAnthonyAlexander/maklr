import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Skeleton,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ReplyIcon from "@mui/icons-material/Reply";
import ForwardOutlinedIcon from "@mui/icons-material/ForwardOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CallMadeIcon from "@mui/icons-material/CallMade";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import CloseIcon from "@mui/icons-material/Close";
import {
  useGetEmailShowById,
  useDeleteEmailById,
  usePatchEmailUpdateById,
} from "../../api/hooks";
import { getContactList, getEstateList } from "../../api/client";
import type { EmailMessage, Contact, Estate } from "../../api/types";
import type { TaskFormInitialValues } from "../tasks/TaskForm";
import { TaskForm } from "../tasks/TaskForm";
import { ContactForm } from "../contacts/ContactForm";
import { useTranslation } from "../../contexts/LanguageContext";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

interface EmailDetailProps {
  emailId: string | null;
  onReply: (email: EmailMessage) => void;
  onArchived: () => void;
}

export function EmailDetail({
  emailId,
  onReply,
  onArchived,
}: EmailDetailProps) {
  const { t } = useTranslation();
  const { data: email, loading } = useGetEmailShowById(
    { id: emailId ?? "" },
    { enabled: emailId !== null && emailId !== "" },
    [emailId],
  );
  const archiveMutation = useDeleteEmailById();
  const patchMutation = usePatchEmailUpdateById();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [emailMenuAnchor, setEmailMenuAnchor] = useState<HTMLElement | null>(null);
  const [actionsMenuAnchor, setActionsMenuAnchor] = useState<HTMLElement | null>(null);
  const [linkDialog, setLinkDialog] = useState<"contact" | "estate" | null>(
    null,
  );
  const [searchResults, setSearchResults] = useState<
    (Contact | Estate)[]
  >([]);
  const [searching, setSearching] = useState(false);

  // Mark as read when email loads
  useEffect(() => {
    if (email && email.id && email.read === false) {
      patchMutation.mutate({ path: { id: email.id }, body: { read: true } });
    }
  }, [email?.id, email?.read]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleArchive = useCallback(async () => {
    if (!emailId) return;
    try {
      await archiveMutation.mutate({ path: { id: emailId } });
      onArchived();
    } catch {
      // error surfaced via archiveMutation.error
    }
  }, [emailId, archiveMutation, onArchived]);

  const handleOpenTaskForm = useCallback(() => {
    setTaskFormOpen(true);
  }, []);

  const handleTaskCreated = useCallback(() => {
    setTaskFormOpen(false);
    setSnackbar(t("email.task_created"));
  }, [t]);

  const taskInitialValues = useMemo((): TaskFormInitialValues | null => {
    if (!email) return null;
    const bodyText =
      email.body_text ||
      (email.body_html
        ? email.body_html.replace(/<[^>]*>/g, "").substring(0, 1000)
        : "");
    return {
      title: email.subject || "",
      description: bodyText,
      type: "follow_up",
      estate_id: email.estate_id,
      contact_id: email.contact_id,
    };
  }, [email]);

  const contactPrefill = useMemo((): Partial<Contact> | null => {
    if (!email || email.direction === "outgoing") return null;
    const nameParts = email.from_name?.trim().split(/\s+/) ?? [];
    return {
      email: email.from_address ?? undefined,
      first_name: nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : (nameParts[0] ?? undefined),
      last_name: nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined,
      entity_type: "person",
    };
  }, [email]);

  const handleContactCreated = useCallback(
    async (contact: Contact) => {
      if (!emailId || !contact.id) return;
      try {
        await patchMutation.mutate({
          path: { id: emailId },
          body: { contact_id: contact.id },
        });
        setSnackbar(t("email.contact_created_linked"));
      } catch {
        // linking failed but contact was created
        setSnackbar(t("email.contact_linked"));
      }
    },
    [emailId, patchMutation, t],
  );

  const handleLinkSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        if (linkDialog === "contact") {
          const result = await getContactList({ q: query, per_page: 10 });
          setSearchResults(result.items);
        } else if (linkDialog === "estate") {
          const result = await getEstateList({ q: query, per_page: 10 });
          setSearchResults(result.items);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [linkDialog],
  );

  const handleLinkEntity = useCallback(
    async (entityId: string) => {
      if (!emailId) return;
      const body =
        linkDialog === "contact"
          ? { contact_id: entityId }
          : { estate_id: entityId };
      try {
        const result = await patchMutation.mutate({
          path: { id: emailId },
          body,
        });
        if (result) {
          setSnackbar(
            linkDialog === "contact"
              ? t("email.contact_linked")
              : t("email.estate_linked"),
          );
        }
      } catch {
        // error surfaced via mutation
      }
      setLinkDialog(null);
      setSearchResults([]);
    },
    [emailId, linkDialog, patchMutation, t],
  );

  const handleUnlinkEntity = useCallback(
    async (type: "contact" | "estate") => {
      if (!emailId) return;
      const body =
        type === "contact"
          ? { contact_id: null }
          : { estate_id: null };
      try {
        await patchMutation.mutate({
          path: { id: emailId },
          body,
        });
      } catch {
        // error surfaced via mutation
      }
    },
    [emailId, patchMutation],
  );

  const bodyHtml = useMemo(() => {
    if (!email?.body_html) return null;
    return email.body_html;
  }, [email?.body_html]);

  useEffect(() => {
    if (!iframeRef.current || !bodyHtml) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'LINE Seed JP', -apple-system, sans-serif;
            font-size: 14px;
            color: #1A1A1A;
            margin: 0;
            padding: 16px;
            line-height: 1.6;
          }
          img { max-width: 100%; height: auto; }
          a { color: #1A1A1A; }
          blockquote {
            border-left: 3px solid #e0e0e0;
            margin: 8px 0;
            padding-left: 12px;
            color: #6B6B6B;
          }
        </style>
      </head>
      <body>${bodyHtml}</body>
      </html>
    `);
    doc.close();
  }, [bodyHtml]);

  if (!emailId) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "text.secondary",
        }}
      >
        <EmailOutlinedIcon sx={{ fontSize: 64, mb: 2, opacity: 0.2 }} />
        <Typography variant="body1">{t("email.select_to_read")}</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ flex: 1, p: 3 }}>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="40%" sx={{ mt: 1 }} />
        <Skeleton variant="text" width="30%" />
        <Skeleton
          variant="rectangular"
          height={300}
          sx={{ mt: 3, borderRadius: 2 }}
        />
      </Box>
    );
  }

  if (!email) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.secondary",
        }}
      >
        <Typography variant="body1">{t("email.not_found")}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
            {email.subject || t("email.no_subject")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          {email.direction === "outgoing" ? (
            <CallMadeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          ) : (
            <CallReceivedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          )}
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, color: "text.primary" }}
          >
            {email.from_name || email.from_address}
            {email.from_name && (
              <Typography component="span" variant="body2" sx={{ color: "text.secondary", ml: 0.5 }}>
                &lt;{email.from_address}&gt;
              </Typography>
            )}
          </Typography>
          <Chip
            label={email.direction === "outgoing" ? t("email.direction_sent") : t("email.direction_received")}
            size="small"
            variant="outlined"
            sx={{ height: 20, fontSize: "0.7rem" }}
          />
        </Box>

        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {t("email.to")} {email.to_names ? `${email.to_names} <${email.to_addresses}>` : email.to_addresses}
        </Typography>
        {email.cc_addresses && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("email.cc")} {email.cc_names ? `${email.cc_names} <${email.cc_addresses}>` : email.cc_addresses}
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", mt: 0.5, display: "block" }}
        >
          {email.received_at
            ? dateFormatter.format(new Date(email.received_at))
            : "\u2014"}
        </Typography>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {bodyHtml ? (
          <iframe
            ref={iframeRef}
            sandbox="allow-same-origin"
            title={t("email.content_title")}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "pre-wrap",
                color: "text.primary",
                lineHeight: 1.6,
              }}
            >
              {email.body_text || "\u2014"}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Actions bar */}
      <Box sx={{ px: 2, py: 1.5, borderTop: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ReplyIcon />}
          onMouseEnter={(e) => setEmailMenuAnchor(e.currentTarget)}
          onClick={() => onReply(email)}
        >
          {t("email.reply")}
        </Button>
        <Menu
          anchorEl={emailMenuAnchor}
          open={emailMenuAnchor !== null}
          onClose={() => setEmailMenuAnchor(null)}
          slotProps={{ list: { onMouseLeave: () => setEmailMenuAnchor(null) } }}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <MenuItem onClick={() => { onReply(email); setEmailMenuAnchor(null); }}>
            <ListItemIcon><ReplyIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t("email.reply")}</ListItemText>
          </MenuItem>
          <MenuItem disabled>
            <ListItemIcon><ForwardOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t("email.forward")} ({t("email.coming_soon")})</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => { handleArchive(); setEmailMenuAnchor(null); }}
            disabled={archiveMutation.loading}
          >
            <ListItemIcon><ArchiveOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t("email.archive")}</ListItemText>
          </MenuItem>
        </Menu>

        <Button
          variant="outlined"
          size="small"
          startIcon={<LinkIcon />}
          onMouseEnter={(e) => setActionsMenuAnchor(e.currentTarget)}
          onClick={(e) => setActionsMenuAnchor(e.currentTarget)}
        >
          {t("email.actions")}
        </Button>
        <Menu
          anchorEl={actionsMenuAnchor}
          open={actionsMenuAnchor !== null}
          onClose={() => setActionsMenuAnchor(null)}
          slotProps={{ list: { onMouseLeave: () => setActionsMenuAnchor(null) } }}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <MenuItem onClick={() => { handleOpenTaskForm(); setActionsMenuAnchor(null); }}>
            <ListItemIcon><AssignmentOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t("email.create_task")}</ListItemText>
          </MenuItem>
          {email.contact ? (
            <MenuItem onClick={() => { handleUnlinkEntity("contact"); setActionsMenuAnchor(null); }}>
              <ListItemIcon><LinkOffIcon fontSize="small" /></ListItemIcon>
              <ListItemText>
                {t("email.unlink_contact")}: {
                  email.contact.first_name || email.contact.last_name
                    ? `${email.contact.first_name ?? ""} ${email.contact.last_name ?? ""}`.trim()
                    : email.contact.company_name ?? t("activity.entity.contact")
                }
              </ListItemText>
            </MenuItem>
          ) : (
            <>
              <MenuItem onClick={() => { setLinkDialog("contact"); setActionsMenuAnchor(null); }}>
                <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
                <ListItemText>{t("email.link_contact")}</ListItemText>
              </MenuItem>
              {email.direction === "incoming" && (
                <MenuItem onClick={() => { setContactFormOpen(true); setActionsMenuAnchor(null); }}>
                  <ListItemIcon><PersonAddAlt1OutlinedIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>{t("email.create_contact_from_sender")}</ListItemText>
                </MenuItem>
              )}
            </>
          )}
          {email.estate ? (
            <MenuItem onClick={() => { handleUnlinkEntity("estate"); setActionsMenuAnchor(null); }}>
              <ListItemIcon><LinkOffIcon fontSize="small" /></ListItemIcon>
              <ListItemText>
                {t("email.unlink_estate")}: {email.estate.title ?? t("activity.entity.estate")}
              </ListItemText>
            </MenuItem>
          ) : (
            <MenuItem onClick={() => { setLinkDialog("estate"); setActionsMenuAnchor(null); }}>
              <ListItemIcon><HomeOutlinedIcon fontSize="small" /></ListItemIcon>
              <ListItemText>{t("email.link_estate")}</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </Box>

      {/* Link entity dialog */}
      <Dialog
        open={linkDialog !== null}
        onClose={() => {
          setLinkDialog(null);
          setSearchResults([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {linkDialog === "contact"
            ? t("email.link_contact")
            : t("email.link_estate")}
          <IconButton
            size="small"
            onClick={() => {
              setLinkDialog(null);
              setSearchResults([]);
            }}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Autocomplete
            options={searchResults}
            getOptionLabel={(option) => {
              if (linkDialog === "contact") {
                const c = option as Contact;
                return (
                  [c.first_name, c.last_name].filter(Boolean).join(" ") ||
                  c.company_name ||
                  c.email ||
                  ""
                );
              }
              return (option as Estate).title ?? "";
            }}
            onInputChange={(_, value) => handleLinkSearch(value)}
            onChange={(_, value) => {
              if (value?.id) {
                handleLinkEntity(value.id);
              }
            }}
            loading={searching}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                placeholder={
                  linkDialog === "contact"
                    ? t("email.search_contact")
                    : t("email.search_estate")
                }
                sx={{ mt: 1 }}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {searching && (
                          <CircularProgress size={20} />
                        )}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setLinkDialog(null);
              setSearchResults([]);
            }}
          >
            {t("email.cancel")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task creation drawer */}
      <TaskForm
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        initialValues={taskInitialValues}
        onSuccess={handleTaskCreated}
      />

      {/* Contact creation drawer */}
      <ContactForm
        open={contactFormOpen}
        onClose={() => setContactFormOpen(false)}
        prefill={contactPrefill}
        onSuccess={() => {}}
        onCreated={handleContactCreated}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar !== null}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          onClose={() => setSnackbar(null)}
          sx={{ width: "100%" }}
        >
          {snackbar}
        </Alert>
      </Snackbar>
    </Box>
  );
}
