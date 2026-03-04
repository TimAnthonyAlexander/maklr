import {
    Box,
    Button,
    Select,
    MenuItem,
    FormControl,
    IconButton,
    Tooltip,
    CircularProgress,
} from "@mui/material";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import SyncIcon from "@mui/icons-material/Sync";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import type { EmailAccount } from "../../api/types";
import { useTranslation } from "../../contexts/LanguageContext";

interface EmailToolbarProps {
    accounts: EmailAccount[];
    selectedAccountId: string;
    onAccountChange: (accountId: string) => void;
    onCompose: () => void;
    onSync: () => void;
    syncLoading: boolean;
    onOpenSettings: () => void;
}

export function EmailToolbar({
    accounts,
    selectedAccountId,
    onAccountChange,
    onCompose,
    onSync,
    syncLoading,
    onOpenSettings,
}: EmailToolbarProps) {
    const { t } = useTranslation();

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
            }}
        >
            <FormControl size="small" sx={{ minWidth: 180 }}>
                <Select
                    value={selectedAccountId}
                    onChange={(e) => onAccountChange(e.target.value)}
                    sx={{ "& .MuiSelect-select": { py: 0.75 } }}
                >
                    <MenuItem value="all">{t("email.all_accounts")}</MenuItem>
                    {accounts.map((acc) => (
                        <MenuItem key={acc.id} value={acc.id}>
                            {acc.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Button
                variant="contained"
                size="small"
                startIcon={<CreateOutlinedIcon />}
                onClick={onCompose}
            >
                {t("email.compose")}
            </Button>

            <Tooltip title={t("email.sync")}>
                <IconButton
                    size="small"
                    onClick={onSync}
                    disabled={syncLoading}
                >
                    {syncLoading ? (
                        <CircularProgress size={20} />
                    ) : (
                        <SyncIcon fontSize="small" />
                    )}
                </IconButton>
            </Tooltip>

            <Box sx={{ flex: 1 }} />

            <Tooltip title={t("email.settings")}>
                <IconButton size="small" onClick={onOpenSettings}>
                    <SettingsOutlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
}
