import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
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
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";
import {
  usePostContactRelationship,
  useDeleteContactRelationship,
} from "../../api/hooks";
import { getContactList } from "../../api/client";
import type { Contact, ContactRelationship } from "../../api/types";

const RELATIONSHIP_TYPES = [
  "spouse",
  "partner",
  "employer",
  "employee",
  "referral",
  "colleague",
  "relative",
  "other",
] as const;

const TYPE_LABELS: Record<string, string> = {
  spouse: "Spouse",
  partner: "Partner",
  employer: "Employer",
  employee: "Employee",
  referral: "Referral",
  colleague: "Colleague",
  relative: "Relative",
  other: "Other",
};

function getContactName(
  contact: ContactRelationship["related_contact"],
): string {
  if (!contact) return "\u2014";
  const name = [contact.first_name, contact.last_name]
    .filter(Boolean)
    .join(" ");
  return name || contact.company_name || contact.email || "\u2014";
}

interface ContactRelationshipsTabProps {
  contactId: string;
  relationships: ContactRelationship[];
  onRelationshipsChanged: () => void;
}

export function ContactRelationshipsTab({
  contactId,
  relationships,
  onRelationshipsChanged,
}: ContactRelationshipsTabProps) {
  const navigate = useNavigate();
  const createMutation = usePostContactRelationship();
  const deleteMutation = useDeleteContactRelationship();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedType, setSelectedType] = useState<string>("referral");
  const [notes, setNotes] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const result = await getContactList({ q: query, per_page: 10 });
        setSearchResults(
          result.items.filter((c) => c.id !== contactId),
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [contactId],
  );

  const handleCreate = useCallback(async () => {
    if (!selectedContact?.id) return;
    try {
      await createMutation.mutate({
        path: { id: contactId },
        body: {
          related_contact_id: selectedContact.id,
          type: selectedType,
          notes: notes || null,
        },
      });
      onRelationshipsChanged();
      setDialogOpen(false);
      setSelectedContact(null);
      setSelectedType("referral");
      setNotes("");
      setSearchResults([]);
    } catch {
      // error surfaced via mutation
    }
  }, [
    contactId,
    selectedContact,
    selectedType,
    notes,
    createMutation,
    onRelationshipsChanged,
  ]);

  const handleDelete = useCallback(
    async (relationshipId: string) => {
      try {
        await deleteMutation.mutate({
          path: { contactId, id: relationshipId },
        });
        onRelationshipsChanged();
      } catch {
        // error surfaced via mutation
      }
    },
    [contactId, deleteMutation, onRelationshipsChanged],
  );

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setSearchResults([]);
    setSelectedContact(null);
    setNotes("");
  }, []);

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
          Relationships ({relationships.length})
        </Typography>
        <Button
          size="small"
          startIcon={<PersonAddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add Relationship
        </Button>
      </Box>

      {relationships.length === 0 ? (
        <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
          <Typography variant="body2">No relationships yet</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {relationships.map((rel) => {
            const name = getContactName(rel.related_contact);

            return (
              <Box
                key={rel.id}
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
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      cursor: "pointer",
                      "&:hover": { textDecoration: "underline" },
                    }}
                    onClick={() =>
                      navigate(`/contacts/${rel.related_contact_id}`)
                    }
                  >
                    {name}
                  </Typography>
                  {rel.notes && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {rel.notes}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={TYPE_LABELS[rel.type] ?? rel.type}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem" }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleDelete(rel.id)}
                  disabled={deleteMutation.loading}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Add Relationship Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add Relationship
          <IconButton
            size="small"
            onClick={closeDialog}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
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
                  label="Search contacts"
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
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedType}
                label="Type"
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {RELATIONSHIP_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {TYPE_LABELS[type]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Notes"
              size="small"
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!selectedContact || createMutation.loading}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
