import { useState, useCallback, useMemo, useEffect } from "react";
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
    } = useGetEmailList(emailQuery);
    const emails = useMemo(() => emailsData?.items ?? [], [emailsData]);

    // Track emails the user has opened this session (for visual read state only).
    // Kept separate from emailsData so clicking an email never mutates the list data.
    const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());

    // Clear local read tracking when server data refreshes (it already reflects read state)
    useEffect(() => {
        setLocalReadIds(new Set());
    }, [emailsData]);

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

    // Snapshot which emails to show when unread filter is active.
    // Recalculates on: initial data load, filter toggle, folder switch, server refetch.
    // Does NOT recalculate when an email is clicked (emails reference is stable).
    const visibleEmailIds = useMemo(() => {
        if (!unreadOnly) return null;
        return new Set(emails.filter((e) => !e.read).map((e) => e.id));
    }, [unreadOnly, selectedFolder, emails]);

    // Merge server data with local read marks, then apply the unread filter
    const displayEmails = useMemo(() => {
        const base = visibleEmailIds === null
            ? emails
            : emails.filter((e) => visibleEmailIds.has(e.id));

        if (localReadIds.size === 0) return base;
        return base.map((e) =>
            localReadIds.has(e.id) && !e.read ? { ...e, read: true } : e,
        );
    }, [emails, visibleEmailIds, localReadIds]);

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
            setLocalReadIds((prev) => {
                if (prev.has(id)) return prev;
                const next = new Set(prev);
                next.add(id);
                return next;
            });
        },
        [setSelectedEmailId],
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
