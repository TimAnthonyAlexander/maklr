import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
} from "@mui/material";
import { Unlink, UserPlus, X } from "lucide-react";
import {
  useGetEstateContactList,
  usePostEstateContactLink,
  useDeleteEstateContactUnlink,
} from "../../api/hooks";
import { getContactList } from "../../api/client";
import type { Contact } from "../../api/types";
import { useTranslation } from "../../contexts/LanguageContext";

const ROLES = [
  "owner",
  "buyer",
  "tenant",
  "landlord",
  "interested",
  "agent",
  "other",
] as const;

const ROLE_KEYS: Record<string, string> = {
  owner: "estate.role_owner",
  buyer: "estate.role_buyer",
  tenant: "estate.role_tenant",
  landlord: "estate.role_landlord",
  interested: "estate.role_interested",
  agent: "estate.role_agent",
  other: "estate.role_other",
};

interface EstateContactsTabProps {
  estateId: string;
}

export function EstateContactsTab({ estateId }: EstateContactsTabProps) {
  const { t } = useTranslation();
  const { data, loading, refetch } = useGetEstateContactList(
    { id: estateId },
    undefined,
    [estateId],
  );
  const linkMutation = usePostEstateContactLink();
  const unlinkMutation = useDeleteEstateContactUnlink();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("interested");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const result = await getContactList({ q: query, per_page: 10 });
      setSearchResults(result.items);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleLink = useCallback(async () => {
    if (!selectedContact?.id) return;
    try {
      await linkMutation.mutate({
        path: { id: estateId },
        body: { contact_id: selectedContact.id, role: selectedRole },
      });
      refetch();
      setDialogOpen(false);
      setSelectedContact(null);
      setSelectedRole("interested");
      setSearchResults([]);
    } catch {
      // error surfaced via mutation
    }
  }, [estateId, selectedContact, selectedRole, linkMutation, refetch]);

  const handleUnlink = useCallback(
    async (contactId: string, role?: string) => {
      try {
        await unlinkMutation.mutate({
          path: { id: estateId },
          body: { contact_id: contactId, role },
        });
        refetch();
      } catch {
        // error surfaced via mutation
      }
    },
    [estateId, unlinkMutation, refetch],
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={56} />
        ))}
      </Box>
    );
  }

  const items = data?.items ?? [];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {t("estate.contacts_tab")} ({items.length})
        </Typography>
        <Button
          size="small"
          startIcon={<UserPlus size={18} />}
          onClick={() => setDialogOpen(true)}
        >
          {t("estate.link_contact")}
        </Button>
      </Box>

      {items.length === 0 ? (
        <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
          <Typography variant="body2">
            {t("estate.no_linked_contacts")}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {items.map((item) => {
            const contact = item.contact;
            const name = contact
              ? [contact.first_name, contact.last_name]
                  .filter(Boolean)
                  .join(" ") ||
                contact.company_name ||
                contact.email ||
                "\u2014"
              : "\u2014";

            return (
              <Box
                key={item.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {name}
                  </Typography>
                  {contact?.email && (
                    <Typography variant="caption" color="text.secondary">
                      {contact.email}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={item.role ?? "interested"}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem" }}
                />
                <IconButton
                  size="small"
                  onClick={() =>
                    handleUnlink(item.contact_id ?? "", item.role)
                  }
                  disabled={unlinkMutation.loading}
                >
                  <Unlink size={20} />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Link Contact Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSearchResults([]);
          setSelectedContact(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t("estate.link_contact")}
          <IconButton
            size="small"
            onClick={() => {
              setDialogOpen(false);
              setSearchResults([]);
              setSelectedContact(null);
            }}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Autocomplete
              options={searchResults}
              getOptionLabel={(option) =>
                [option.first_name, option.last_name]
                  .filter(Boolean)
                  .join(" ") ||
                option.company_name ||
                option.email ||
                ""
              }
              onInputChange={(_, value) => handleSearch(value)}
              onChange={(_, value) => setSelectedContact(value)}
              value={selectedContact}
              loading={searching}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("email.search_contact")}
                  autoFocus
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {searching && <CircularProgress size={20} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
            <FormControl size="small">
              <InputLabel>{t("estate.role")}</InputLabel>
              <Select
                value={selectedRole}
                label={t("estate.role")}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {ROLE_KEYS[role] ? t(ROLE_KEYS[role]) : role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setSearchResults([]);
              setSelectedContact(null);
            }}
          >
            {t("estate.form_cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleLink}
            disabled={!selectedContact || linkMutation.loading}
          >
            {t("estate.link_contact")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
