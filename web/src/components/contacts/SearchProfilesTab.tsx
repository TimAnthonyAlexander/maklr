import { useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Chip,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { Contact, SearchProfile } from "../../api/types";
import { usePatchContactUpdateById } from "../../api/hooks";
import { SearchProfileForm } from "./SearchProfileForm";

interface SearchProfilesTabProps {
  contact: Contact;
  onProfilesUpdated: (updated: Contact) => void;
}

function summarizeProfile(profile: SearchProfile): string {
  const parts: string[] = [];

  if (profile.property_types.length > 0) {
    parts.push(profile.property_types.join(", "));
  }
  if (profile.marketing_type) {
    parts.push(profile.marketing_type);
  }
  if (profile.price_min != null || profile.price_max != null) {
    const min = profile.price_min != null ? `${profile.price_min}` : "0";
    const max = profile.price_max != null ? `${profile.price_max}` : "\u221E";
    parts.push(`${min}\u2013${max} \u20AC`);
  }
  if (profile.cities.length > 0) {
    parts.push(profile.cities.join(", "));
  }
  if (profile.rooms_min != null || profile.rooms_max != null) {
    const min = profile.rooms_min ?? 0;
    const max = profile.rooms_max != null ? `${profile.rooms_max}` : "+";
    parts.push(`${min}\u2013${max} rooms`);
  }

  return parts.length > 0 ? parts.join(" \u00B7 ") : "No criteria defined";
}

function featureChips(profile: SearchProfile): string[] {
  const features: string[] = [];
  if (profile.furnished === true) features.push("Furnished");
  if (profile.balcony === true) features.push("Balcony");
  if (profile.garden === true) features.push("Garden");
  if (profile.elevator === true) features.push("Elevator");
  if (profile.cellar === true) features.push("Cellar");
  return features;
}

export function SearchProfilesTab({
  contact,
  onProfilesUpdated,
}: SearchProfilesTabProps) {
  const profiles = useMemo(
    () => contact.search_profiles ?? [],
    [contact.search_profiles],
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SearchProfile | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const patchMutation = usePatchContactUpdateById();

  const saveProfiles = useCallback(
    async (updatedProfiles: SearchProfile[]) => {
      if (!contact.id) return;
      setError(null);
      try {
        const result = await patchMutation.mutate({
          path: { id: contact.id },
          body: { search_profiles: updatedProfiles },
        });
        onProfilesUpdated(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save profiles",
        );
      }
    },
    [contact.id, patchMutation, onProfilesUpdated],
  );

  const handleSave = useCallback(
    (profile: SearchProfile) => {
      const existing = profiles.findIndex((p) => p.id === profile.id);
      const updatedProfiles =
        existing >= 0
          ? profiles.map((p) => (p.id === profile.id ? profile : p))
          : [...profiles, profile];
      saveProfiles(updatedProfiles);
    },
    [profiles, saveProfiles],
  );

  const handleDelete = useCallback(
    (profileId: string) => {
      const updatedProfiles = profiles.filter((p) => p.id !== profileId);
      saveProfiles(updatedProfiles);
    },
    [profiles, saveProfiles],
  );

  const handleEdit = useCallback((profile: SearchProfile) => {
    setEditingProfile(profile);
    setFormOpen(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingProfile(null);
    setFormOpen(true);
  }, []);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {profiles.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No search profiles defined. Add a profile to describe what this
            contact is looking for.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Search Profile
          </Button>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {profiles.length} profile{profiles.length !== 1 ? "s" : ""}
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Add Profile
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {profiles.map((profile) => (
              <Paper
                key={profile.id}
                variant="outlined"
                sx={{ p: 2 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {profile.name}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(profile)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(profile.id)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {summarizeProfile(profile)}
                </Typography>
                {featureChips(profile).length > 0 && (
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {featureChips(profile).map((feat) => (
                      <Chip
                        key={feat}
                        label={feat}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        </>
      )}

      <SearchProfileForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        profile={editingProfile}
        onSave={handleSave}
      />
    </Box>
  );
}
