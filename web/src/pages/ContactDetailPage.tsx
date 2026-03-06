import { useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import {
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Skeleton,
  Alert,
  Grid,
  IconButton,
  Chip,
} from "@mui/material";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useGetContactShowById, useDeleteContactById } from "../api/hooks";
import type { Contact, ContactWithRelations } from "../api/types";
import { useAuth } from "../contexts/AuthContext";
import {
  ContactStageChip,
  ContactTypeChip,
} from "../components/contacts/ContactStageChip";
import { ContactForm } from "../components/contacts/ContactForm";
import { ContactDeleteDialog } from "../components/contacts/ContactDeleteDialog";
import { EntityDocumentsTab } from "../components/documents/EntityDocumentsTab";
import { EntityActivityTimeline } from "../components/activity/ActivityTimeline";
import { getContactDisplayName } from "../utils/contactHelpers";
import { SearchProfilesTab } from "../components/contacts/SearchProfilesTab";
import { ContactMatchesTab } from "../components/contacts/ContactMatchesTab";
import { ContactRelationshipsTab } from "../components/contacts/ContactRelationshipsTab";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

interface MetricProps {
  label: string;
  value: string | number | null | undefined;
}

function Metric({ label, value }: MetricProps) {
  const isEmpty = value == null || value === "";
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontWeight: 500,
          color: isEmpty ? "text.disabled" : "text.primary",
        }}
      >
        {isEmpty ? "\u2014" : value}
      </Typography>
    </Box>
  );
}

function ContactInfoCard({ contact }: { contact: Contact }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Contact Information
      </Typography>
      <Grid container spacing={3}>
        {contact.entity_type === "person" && (
          <>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Metric label="Salutation" value={contact.salutation} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Metric label="First Name" value={contact.first_name} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Metric label="Last Name" value={contact.last_name} />
            </Grid>
          </>
        )}
        {contact.entity_type === "company" && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Metric label="Company Name" value={contact.company_name} />
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Metric label="Email" value={contact.email} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Metric label="Phone" value={contact.phone} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Metric label="Mobile" value={contact.mobile} />
        </Grid>
      </Grid>
    </Paper>
  );
}

function AddressCard({ contact }: { contact: Contact }) {
  const streetLine = [contact.street].filter(Boolean).join(" ");
  const cityLine = [contact.zip, contact.city].filter(Boolean).join(" ");

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Address
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Metric label="Street" value={streetLine || null} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Metric label="City" value={cityLine || null} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Metric label="Country" value={contact.country} />
        </Grid>
      </Grid>
    </Paper>
  );
}

function NotesCard({ contact }: { contact: Contact }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Notes
      </Typography>
      {contact.notes ? (
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {contact.notes}
        </Typography>
      ) : (
        <Typography variant="body2" sx={{ color: "text.disabled" }}>
          {"\u2014"}
        </Typography>
      )}
    </Paper>
  );
}

function GdprCard({ contact }: { contact: Contact }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        GDPR
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Chip
          label={contact.gdpr_consent ? "Consent given" : "No consent"}
          size="small"
          color={contact.gdpr_consent ? "success" : "default"}
          variant={contact.gdpr_consent ? "filled" : "outlined"}
        />
        {contact.gdpr_consent_date && (
          <Chip
            label={`Since ${contact.gdpr_consent_date}`}
            size="small"
            variant="outlined"
          />
        )}
        {contact.gdpr_deletion_requested && (
          <Chip label="Deletion requested" size="small" color="error" />
        )}
      </Box>
    </Paper>
  );
}

const CONTACT_TABS = [
  "relationships",
  "documents",
  "search-profiles",
  "matches",
] as const;

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, loading, error, refetch, setData } = useGetContactShowById(
    { id: id ?? "" },
    { enabled: !!id },
  );
  const deleteMutation = useDeleteContactById();

  const contact = data ?? null;

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = Math.max(
    0,
    CONTACT_TABS.indexOf(
      searchParams.get("tab") as (typeof CONTACT_TABS)[number],
    ),
  );
  const [tab, setTab] = useState(initialTab);

  const handleTabChange = useCallback(
    (_: unknown, newTab: number) => {
      setTab(newTab);
      const newParams = new URLSearchParams(searchParams);
      if (newTab === 0) {
        newParams.delete("tab");
      } else {
        newParams.set("tab", CONTACT_TABS[newTab]);
      }
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canDelete = user?.role === "admin" || user?.role === "manager";

  const handleDelete = useCallback(async () => {
    if (!id) return;
    try {
      await deleteMutation.mutate({ path: { id } });
      navigate("/contacts");
    } catch {
      // Error captured by mutation hook
    }
  }, [id, deleteMutation, navigate]);

  const handleFormSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton
          variant="rectangular"
          height={300}
          sx={{ mt: 2, borderRadius: 2 }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error.message}</Alert>
      </Box>
    );
  }

  if (!contact) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Contact not found</Alert>
      </Box>
    );
  }

  const displayName = getContactDisplayName(contact);

  return (
    <Box sx={{ p: 3 }}>
      {/* Back */}
      <Button
        startIcon={<ArrowLeft size={18} />}
        onClick={() => navigate("/contacts")}
        sx={{ mb: 2 }}
      >
        Contacts
      </Button>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {displayName}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <ContactTypeChip type={contact.type ?? "misc"} />
            <ContactStageChip stage={contact.stage ?? "cold"} />
            <Chip
              label={contact.entity_type === "company" ? "Company" : "Person"}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 500, fontSize: "0.75rem" }}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton size="small" onClick={() => setFormOpen(true)}>
            <Pencil size={20} />
          </IconButton>
          {canDelete && (
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={20} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Main content + Sidebar */}
      <Grid container spacing={3}>
        {/* Main content */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Contact Information */}
            <ContactInfoCard contact={contact} />

            {/* Address */}
            <AddressCard contact={contact} />

            {/* Notes */}
            <NotesCard contact={contact} />

            {/* Documents / Search Profiles / Matches Tabs */}
            <Paper variant="outlined" sx={{ px: 3 }}>
              <Tabs value={tab} onChange={handleTabChange}>
                <Tab label="Relationships" />
                <Tab label="Documents" />
                <Tab label="Search Profiles" />
                <Tab label="Matches" />
              </Tabs>

              {tab === 0 && (
                <Box sx={{ pt: 3, pb: 3 }}>
                  {id && (
                    <ContactRelationshipsTab
                      contactId={id}
                      relationships={contact.relationships ?? []}
                      onRelationshipsChanged={refetch}
                    />
                  )}
                </Box>
              )}
              {tab === 1 && (
                <Box sx={{ pt: 3, pb: 3 }}>
                  {id && (
                    <EntityDocumentsTab entityType="contact" entityId={id} />
                  )}
                </Box>
              )}
              {tab === 2 && (
                <Box sx={{ pt: 3, pb: 3 }}>
                  <SearchProfilesTab
                    contact={contact}
                    onProfilesUpdated={(updated) =>
                      setData(updated as ContactWithRelations)
                    }
                  />
                </Box>
              )}
              {tab === 3 && (
                <Box sx={{ pt: 3, pb: 3 }}>
                  {id && (
                    <ContactMatchesTab
                      contactId={id}
                      contactType={contact.type}
                      hasProfiles={
                        (contact.search_profiles ?? []).length > 0
                      }
                    />
                  )}
                </Box>
              )}
            </Paper>
          </Box>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box
            sx={{
              position: "sticky",
              top: 24,
              alignSelf: "flex-start",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {/* Details */}
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Details
              </Typography>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Type
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <ContactTypeChip type={contact.type ?? "misc"} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Stage
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <ContactStageChip stage={contact.stage ?? "cold"} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Entity Type
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, mt: 0.5 }}
                  >
                    {contact.entity_type === "company" ? "Company" : "Person"}
                  </Typography>
                </Box>
                {contact.created_at && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {dateFormatter.format(new Date(contact.created_at))}
                    </Typography>
                  </Box>
                )}
                {contact.updated_at && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Updated
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {dateFormatter.format(new Date(contact.updated_at))}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* GDPR */}
            <GdprCard contact={contact} />

            {/* Activity */}
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Activity
              </Typography>
              {id && (
                <EntityActivityTimeline entityType="contact" entityId={id} />
              )}
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Edit drawer */}
      <ContactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        contact={contact}
        onSuccess={handleFormSuccess}
      />

      {/* Delete dialog */}
      <ContactDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteMutation.loading}
        contactName={displayName}
      />
    </Box>
  );
}
