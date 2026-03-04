import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import type { EmailFolder } from "../components/email/EmailFolderNav";

const VALID_FOLDERS: EmailFolder[] = ["inbox", "sent", "spam", "trash", "archived"];

export function useEmailUrlState() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(
        searchParams.get("id") || null,
    );
    const [selectedAccountId, setSelectedAccountId] = useState<string>(
        searchParams.get("account") || "all",
    );
    const [selectedFolder, setSelectedFolder] = useState<EmailFolder>(() => {
        const param = searchParams.get("folder");
        return param && VALID_FOLDERS.includes(param as EmailFolder)
            ? (param as EmailFolder)
            : "inbox";
    });

    // Sync state changes to URL
    useEffect(() => {
        const params: Record<string, string> = {};
        if (selectedFolder !== "inbox") params.folder = selectedFolder;
        if (selectedAccountId !== "all") params.account = selectedAccountId;
        if (selectedEmailId) params.id = selectedEmailId;
        setSearchParams(params, { replace: true });
    }, [selectedEmailId, selectedAccountId, selectedFolder, setSearchParams]);

    const handleAccountChange = useCallback((accountId: string) => {
        setSelectedAccountId(accountId);
        setSelectedEmailId(null);
    }, []);

    const handleFolderChange = useCallback((folder: EmailFolder) => {
        setSelectedFolder(folder);
        setSelectedEmailId(null);
    }, []);

    return {
        selectedEmailId,
        setSelectedEmailId,
        selectedAccountId,
        selectedFolder,
        handleAccountChange,
        handleFolderChange,
    };
}
