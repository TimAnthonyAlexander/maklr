import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import type { EmailAccount, EmailMessage } from "../api/types";
import { useTranslation } from "../contexts/LanguageContext";
import { useGetEmailList, useGetEmailAccountList } from "../api/hooks";
import { EmailList } from "../components/email/EmailList";
import { EmailDetail } from "../components/email/EmailDetail";
import { EmailCompose } from "../components/email/EmailCompose";
import { EmailSettingsDrawer } from "../components/email/EmailSettingsDrawer";
import { EmailFolderNav } from "../components/email/EmailFolderNav";
import { EmailToolbar } from "../components/email/EmailToolbar";
import { useEmailUrlState } from "../hooks/useEmailUrlState";
import { useEmailSync } from "../hooks/useEmailSync";

export function EmailPage() {
    const { t } = useTranslation();

    const {
        selectedEmailId,
        setSelectedEmailId,
        selectedAccountId,
        selectedFolder,
        handleAccountChange,
        handleFolderChange,
    } = useEmailUrlState();

    const [composeOpen, setComposeOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [replyTo, setReplyTo] = useState<EmailMessage | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [snackbar, setSnackbar] = useState<{
        message: string;
        severity: "success" | "error";
    } | null>(null);

    const { data: accountsData } = useGetEmailAccountList({ active: true });
    const accounts: EmailAccount[] = useMemo(
        () => accountsData?.items ?? [],
        [accountsData],
    );

    const emailQuery = useMemo(
        () => ({
            account_id: selectedAccountId !== "all" ? selectedAccountId : undefined,
            q: searchQuery || undefined,
            per_page: 200,
            ...(selectedFolder === "archived"
                ? { status: "archived", include_archived: "true" }
                : { folder: selectedFolder }),
        }),
        [selectedAccountId, searchQuery, selectedFolder],
    );

    const {
        data: emailsData,
        loading: emailsLoading,
        refetch: refetchEmails,
        setData: setEmailsData,
    } = useGetEmailList(emailQuery);
    const emails = useMemo(() => emailsData?.items ?? [], [emailsData]);

    const [unreadOnly, setUnreadOnly] = useState(
        () => localStorage.getItem("email_unread_filter") === "true",
    );

    const handleToggleUnreadOnly = useCallback(() => {
        setUnreadOnly((v) => {
            const next = !v;
            localStorage.setItem("email_unread_filter", String(next));
            return next;
        });
    }, []);

    // Track a version that only bumps on triggers that should recalculate the filter:
    // - folder change, filter toggle, or fresh server data (but NOT optimistic read marks)
    const serverDataRef = useRef(emailsData);
    const filterVersionRef = useRef(0);

    // Detect actual server data changes (refetch) vs optimistic setData updates.
    // When handleSelectEmail calls setData, it sets the flag to skip version bump.
    const skipNextVersionBump = useRef(false);

    useEffect(() => {
        if (emailsData !== serverDataRef.current) {
            serverDataRef.current = emailsData;
            if (skipNextVersionBump.current) {
                skipNextVersionBump.current = false;
            } else {
                filterVersionRef.current += 1;
            }
        }
    }, [emailsData]);

    // Snapshot the visible email IDs, only recalculated on filter/folder/server changes
    const visibleEmailIds = useMemo(() => {
        if (!unreadOnly) return null; // null = show all, no filtering
        return new Set(emails.filter((e) => !e.read).map((e) => e.id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unreadOnly, selectedFolder, filterVersionRef.current]);

    const displayEmails = useMemo(
        () =>
            visibleEmailIds === null
                ? emails
                : emails.filter((e) => visibleEmailIds.has(e.id)),
        [emails, visibleEmailIds],
    );

    const showSnackbar = useCallback(
        (message: string, severity: "success" | "error") => {
            setSnackbar({ message, severity });
        },
        [],
    );

    const { handleSync, syncLoading } = useEmailSync({
        accounts,
        selectedAccountId,
        refetchEmails,
        showSnackbar,
    });

    const unreadInboxCount = useMemo(
        () =>
            selectedFolder === "inbox"
                ? emails.filter((e) => !e.read).length
                : 0,
        [emails, selectedFolder],
    );

    const handleSelectEmail = useCallback(
        (id: string) => {
            setSelectedEmailId(id);
            if (emailsData) {
                const isUnread = emailsData.items.some(
                    (e) => e.id === id && e.read === false,
                );
                if (isUnread) {
                    skipNextVersionBump.current = true;
                    setEmailsData({
                        ...emailsData,
                        items: emailsData.items.map((e) =>
                            e.id === id ? { ...e, read: true } : e,
                        ),
                    });
                }
            }
        },
        [emailsData, setEmailsData, setSelectedEmailId],
    );

    const handleCompose = useCallback(() => {
        setReplyTo(null);
        setComposeOpen(true);
    }, []);

    const handleReply = useCallback((email: EmailMessage) => {
        setReplyTo(email);
        setComposeOpen(true);
    }, []);

    const handleComposeClose = useCallback(() => {
        setComposeOpen(false);
        setReplyTo(null);
    }, []);

    const handleSent = useCallback(() => {
        refetchEmails();
        showSnackbar(t("email.sent_success"), "success");
    }, [refetchEmails, showSnackbar, t]);

    const handleArchived = useCallback(() => {
        setSelectedEmailId(null);
        refetchEmails();
    }, [refetchEmails, setSelectedEmailId]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <EmailToolbar
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                onAccountChange={handleAccountChange}
                onCompose={handleCompose}
                onSync={handleSync}
                syncLoading={syncLoading}
                onOpenSettings={() => setSettingsOpen(true)}
            />

            <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <EmailFolderNav
                    selectedFolder={selectedFolder}
                    onSelectFolder={handleFolderChange}
                    unreadInboxCount={unreadInboxCount}
                />
                <EmailList
                    emails={displayEmails}
                    loading={emailsLoading}
                    selectedId={selectedEmailId}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onSelect={handleSelectEmail}
                    unreadOnly={unreadOnly}
                    onToggleUnreadOnly={handleToggleUnreadOnly}
                />
                <EmailDetail
                    emailId={selectedEmailId}
                    onReply={handleReply}
                    onArchived={handleArchived}
                />
            </Box>

            <EmailCompose
                open={composeOpen}
                onClose={handleComposeClose}
                onSent={handleSent}
                accounts={accounts}
                replyTo={replyTo}
                defaultAccountId={
                    selectedAccountId !== "all" ? selectedAccountId : undefined
                }
            />

            <EmailSettingsDrawer
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />

            <Snackbar
                open={snackbar != null}
                autoHideDuration={4000}
                onClose={() => setSnackbar(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                {snackbar ? (
                    <Alert
                        onClose={() => setSnackbar(null)}
                        severity={snackbar.severity}
                        variant="filled"
                        sx={{ width: "100%" }}
                    >
                        {snackbar.message}
                    </Alert>
                ) : undefined}
            </Snackbar>
        </Box>
    );
}
