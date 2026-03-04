import { useCallback, useEffect, useRef } from "react";
import type { EmailAccount } from "../api/types";
import { usePostEmailAccountSyncById } from "../api/hooks";
import { useTranslation } from "../contexts/LanguageContext";

const SYNC_STORAGE_KEY = "maklr:email:lastSync";
const SYNC_INTERVAL_MS = 5 * 60 * 1000;

interface UseEmailSyncOptions {
    accounts: EmailAccount[];
    selectedAccountId: string;
    refetchEmails: () => void;
    showSnackbar: (message: string, severity: "success" | "error") => void;
}

export function useEmailSync({
    accounts,
    selectedAccountId,
    refetchEmails,
    showSnackbar,
}: UseEmailSyncOptions) {
    const { t } = useTranslation();
    const syncMutation = usePostEmailAccountSyncById();

    const handleSync = useCallback(
        async (options?: { silent?: boolean }) => {
            const accountsToSync =
                selectedAccountId !== "all"
                    ? accounts.filter((a) => a.id === selectedAccountId)
                    : accounts;

            if (accountsToSync.length === 0) {
                if (!options?.silent) {
                    showSnackbar(t("email.no_accounts_to_sync"), "error");
                }
                return;
            }

            let totalSynced = 0;
            let hasError = false;

            for (const account of accountsToSync) {
                if (!account.id) continue;
                try {
                    const result = await syncMutation.mutate({
                        path: { id: account.id },
                    });
                    if (result.success) {
                        totalSynced += result.synced;
                    } else {
                        hasError = true;
                    }
                } catch {
                    hasError = true;
                }
            }

            localStorage.setItem(SYNC_STORAGE_KEY, Date.now().toString());

            if (!options?.silent) {
                if (hasError) {
                    showSnackbar(
                        t("email.sync_with_errors", { count: String(totalSynced) }),
                        "error",
                    );
                } else {
                    showSnackbar(
                        t("email.synced_count", { count: String(totalSynced) }),
                        "success",
                    );
                }
            }

            refetchEmails();
        },
        [selectedAccountId, accounts, syncMutation, refetchEmails, showSnackbar, t],
    );

    // Auto-sync on mount if stale, and every 5 minutes while idle
    const autoSyncTriggered = useRef(false);
    useEffect(() => {
        if (accounts.length === 0 || syncMutation.loading) return;

        const isSyncStale = () => {
            const last = localStorage.getItem(SYNC_STORAGE_KEY);
            if (!last) return true;
            return Date.now() - Number(last) >= SYNC_INTERVAL_MS;
        };

        // Sync on mount if stale (once)
        if (!autoSyncTriggered.current && isSyncStale()) {
            autoSyncTriggered.current = true;
            handleSync({ silent: true });
        }

        // Periodic sync while on the page
        const interval = setInterval(() => {
            if (isSyncStale()) {
                handleSync({ silent: true });
            }
        }, SYNC_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [accounts.length, syncMutation.loading, handleSync]);

    return {
        handleSync,
        syncLoading: syncMutation.loading,
    };
}
