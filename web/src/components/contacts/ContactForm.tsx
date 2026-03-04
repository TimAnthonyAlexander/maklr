import { useState, useCallback, useMemo } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  IconButton,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import type { Contact, PostContactCreateRequestBody } from "../../api/types";
import {
  usePostContactCreate,
  usePatchContactUpdateById,
} from "../../api/hooks";

interface ContactFormProps {
  open: boolean;
  onClose: () => void;
  contact?: Contact | null;
  /** Pre-fill fields for a new contact (ignored when editing). */
  prefill?: Partial<Contact> | null;
  onSuccess: () => void;
  /** Called with the newly created contact (create mode only). */
  onCreated?: (contact: Contact) => void;
}

interface FormState {
  entity_type: string;
  type: string;
  salutation: string;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
  mobile: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  stage: string;
  notes: string;
  gdpr_consent: boolean;
  gdpr_consent_date: string;
}

function contactToFormState(contact?: Contact | null): FormState {
  return {
    entity_type: contact?.entity_type ?? "person",
    type: contact?.type ?? "buyer",
    salutation: contact?.salutation ?? "",
    first_name: contact?.first_name ?? "",
    last_name: contact?.last_name ?? "",
    company_name: contact?.company_name ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    mobile: contact?.mobile ?? "",
    street: contact?.street ?? "",
    zip: contact?.zip ?? "",
    city: contact?.city ?? "",
    country: contact?.country ?? "",
    stage: contact?.stage ?? "cold",
    notes: contact?.notes ?? "",
    gdpr_consent: contact?.gdpr_consent ?? false,
    gdpr_consent_date: contact?.gdpr_consent_date ?? "",
  };
}

function formStateToBody(form: FormState): PostContactCreateRequestBody {
  const strOrNull = (v: string) => (v === "" ? null : v);

  return {
    entity_type: form.entity_type,
    type: form.type,
    salutation: strOrNull(form.salutation),
    first_name: strOrNull(form.first_name),
    last_name: strOrNull(form.last_name),
    company_name: strOrNull(form.company_name),
    email: strOrNull(form.email),
    phone: strOrNull(form.phone),
    mobile: strOrNull(form.mobile),
    street: strOrNull(form.street),
    zip: strOrNull(form.zip),
    city: strOrNull(form.city),
    country: strOrNull(form.country),
    stage: form.stage,
    notes: strOrNull(form.notes),
    gdpr_consent: form.gdpr_consent,
    gdpr_consent_date: strOrNull(form.gdpr_consent_date),
  };
}

function computeDiff(
  original: FormState,
  current: FormState,
): Partial<PostContactCreateRequestBody> {
  const originalBody = formStateToBody(original);
  const currentBody = formStateToBody(current);
  const diff: Record<string, unknown> = {};

  for (const key of Object.keys(
    currentBody,
  ) as (keyof PostContactCreateRequestBody)[]) {
    if (currentBody[key] !== originalBody[key]) {
      diff[key] = currentBody[key];
    }
  }

  return diff as Partial<PostContactCreateRequestBody>;
}

const SALUTATION_OPTIONS = [
  { value: "", label: "None" },
  { value: "mr", label: "Mr." },
  { value: "mrs", label: "Mrs." },
  { value: "ms", label: "Ms." },
  { value: "dr", label: "Dr." },
];

export function ContactForm({
  open,
  onClose,
  contact,
  prefill,
  onSuccess,
  onCreated,
}: ContactFormProps) {
  const isEdit = contact != null;
  const initialState = useMemo(
    () => contactToFormState(isEdit ? contact : prefill),
    [contact, prefill, isEdit],
  );
  const [form, setForm] = useState<FormState>(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = usePostContactCreate();
  const updateMutation = usePatchContactUpdateById();

  const loading = createMutation.loading || updateMutation.loading;

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const isPerson = form.entity_type === "person";

  const hasRequiredFields = isPerson
    ? form.first_name || form.last_name
    : form.company_name;

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);

    try {
      if (isEdit && contact?.id) {
        const diff = computeDiff(initialState, form);
        if (Object.keys(diff).length === 0) {
          onClose();
          return;
        }
        await updateMutation.mutate({
          path: { id: contact.id },
          body: diff,
        });
      } else {
        const created = await createMutation.mutate({
          body: formStateToBody(form),
        });
        if (created && onCreated) {
          onCreated(created);
        }
      }
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    }
  }, [
    isEdit,
    contact,
    initialState,
    form,
    updateMutation,
    createMutation,
    onSuccess,
    onClose,
  ]);

  const handleEntered = useCallback(() => {
    setForm(contactToFormState(isEdit ? contact : prefill));
    setSubmitError(null);
  }, [contact, prefill, isEdit]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 560, maxWidth: "100vw" } } }}
      SlideProps={{ onEntered: handleEntered }}
    >
      <Box
        sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Typography variant="h6">
            {isEdit ? "Edit Contact" : "New Contact"}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Entity Type Toggle */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Contact Type
            </Typography>
            <ToggleButtonGroup
              value={form.entity_type}
              exclusive
              onChange={(_, val) => {
                if (val) updateField("entity_type", val);
              }}
              size="small"
              fullWidth
            >
              <ToggleButton value="person">
                <PersonIcon sx={{ mr: 0.5 }} fontSize="small" />
                Person
              </ToggleButton>
              <ToggleButton value="company">
                <BusinessIcon sx={{ mr: 0.5 }} fontSize="small" />
                Company
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Divider />

          {/* Name Fields */}
          {isPerson ? (
            <>
              <FormControl size="small" fullWidth>
                <InputLabel>Salutation</InputLabel>
                <Select
                  label="Salutation"
                  value={form.salutation}
                  onChange={(e) => updateField("salutation", e.target.value)}
                >
                  {SALUTATION_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="First Name"
                  size="small"
                  fullWidth
                  value={form.first_name}
                  onChange={(e) => updateField("first_name", e.target.value)}
                />
                <TextField
                  label="Last Name"
                  size="small"
                  fullWidth
                  value={form.last_name}
                  onChange={(e) => updateField("last_name", e.target.value)}
                />
              </Box>
            </>
          ) : (
            <TextField
              label="Company Name"
              required
              size="small"
              value={form.company_name}
              onChange={(e) => updateField("company_name", e.target.value)}
            />
          )}

          {/* Type & Stage */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
              >
                <MenuItem value="buyer">Buyer</MenuItem>
                <MenuItem value="seller">Seller</MenuItem>
                <MenuItem value="tenant">Tenant</MenuItem>
                <MenuItem value="landlord">Landlord</MenuItem>
                <MenuItem value="misc">Misc</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Stage</InputLabel>
              <Select
                label="Stage"
                value={form.stage}
                onChange={(e) => updateField("stage", e.target.value)}
              >
                <MenuItem value="cold">Cold</MenuItem>
                <MenuItem value="warm">Warm</MenuItem>
                <MenuItem value="hot">Hot</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="lost">Lost</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Divider />

          {/* Contact Info */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Contact Info
          </Typography>
          <TextField
            label="Email"
            size="small"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Phone"
              size="small"
              fullWidth
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
            <TextField
              label="Mobile"
              size="small"
              fullWidth
              value={form.mobile}
              onChange={(e) => updateField("mobile", e.target.value)}
            />
          </Box>

          <Divider />

          {/* Address */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Address
          </Typography>
          <TextField
            label="Street"
            size="small"
            value={form.street}
            onChange={(e) => updateField("street", e.target.value)}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="ZIP"
              size="small"
              sx={{ width: 120 }}
              value={form.zip}
              onChange={(e) => updateField("zip", e.target.value)}
            />
            <TextField
              label="City"
              size="small"
              fullWidth
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
            <TextField
              label="Country"
              size="small"
              sx={{ width: 120 }}
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
            />
          </Box>

          <Divider />

          {/* Notes */}
          <TextField
            label="Notes"
            size="small"
            multiline
            rows={3}
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />

          <Divider />

          {/* GDPR */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            GDPR
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={form.gdpr_consent}
                onChange={(e) => updateField("gdpr_consent", e.target.checked)}
                size="small"
              />
            }
            label="Consent given"
          />
          {form.gdpr_consent && (
            <TextField
              label="Consent Date"
              size="small"
              type="date"
              value={form.gdpr_consent_date}
              onChange={(e) => updateField("gdpr_consent_date", e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            pt: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button onClick={onClose} fullWidth disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth
            disabled={loading || !hasRequiredFields}
          >
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Contact"}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
