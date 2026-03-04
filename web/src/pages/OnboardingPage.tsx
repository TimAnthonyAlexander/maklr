import { useState, type FormEvent } from "react";
import { useNavigate, Navigate } from "react-router";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { useAuth, ApiError } from "../contexts/AuthContext";
import { postOnboardingWorkspace } from "../api/client";
import type { AuthUser } from "../contexts/AuthContext";

export function OnboardingPage() {
  const { user, needsOnboarding, updateUser } = useAuth();
  const navigate = useNavigate();
  const [officeName, setOfficeName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user && !needsOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await postOnboardingWorkspace({
        office_name: officeName,
        address: address || null,
        city: city || null,
        zip: zip || null,
        country: country || null,
        phone: phone || null,
        email: email || null,
      });
      const updatedUser = res.user as unknown as AuthUser;
      updateUser(updatedUser);
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        px: 2,
        bgcolor: "background.default",
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: 480,
          p: 4,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" sx={{ mb: 1, textAlign: "center" }}>
          Create your workspace
        </Typography>
        <Typography
          variant="body2"
          sx={{ mb: 3, textAlign: "center", color: "text.secondary" }}
        >
          Set up your office to get started
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Office name"
          value={officeName}
          onChange={(e) => setOfficeName(e.target.value)}
          fullWidth
          required
          autoFocus
          sx={{ mb: 2 }}
        />

        <TextField
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            fullWidth
          />
          <TextField
            label="ZIP"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            sx={{ width: 140, flexShrink: 0 }}
          />
        </Box>

        <TextField
          label="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
          />
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disableElevation
          disabled={submitting}
          sx={{}}
        >
          {submitting ? "Creating workspace..." : "Create workspace"}
        </Button>
      </Paper>
    </Box>
  );
}
