import { useState, useEffect, type FormEvent } from "react";
import {
  useParams,
  useNavigate,
  Link as RouterLink,
  Navigate,
} from "react-router";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  CircularProgress,
} from "@mui/material";
import { useAuth, ApiError } from "../contexts/AuthContext";
import { getInvitationByToken, postAcceptInvitation } from "../api/client";

interface InvitationInfo {
  email: string;
  role: string;
  office_name: string;
}

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState("");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidationError("Invalid invitation link");
      setLoading(false);
      return;
    }

    getInvitationByToken(token)
      .then((res) => {
        setInvitation(res);
      })
      .catch((err) => {
        if (err instanceof ApiError) {
          setValidationError(err.message);
        } else {
          setValidationError("Failed to validate invitation");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token || !invitation) return;

    setSubmitting(true);
    try {
      const res = await postAcceptInvitation(token, {
        name,
        email: invitation.email,
        password,
      });
      const userData =
        res as unknown as import("../contexts/AuthContext").AuthUser;
      updateUser(userData);
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

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (validationError) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 64px)",
          px: 2,
        }}
      >
        <Paper
          sx={{
            width: "100%",
            maxWidth: 400,
            p: 4,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="h5" sx={{ mb: 2 }}>
            Invalid Invitation
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            {validationError}
          </Alert>
          <Typography variant="body2">
            <Link component={RouterLink} to="/signup" underline="hover">
              Sign up instead
            </Link>
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 64px)",
        px: 2,
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: 400,
          p: 4,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" sx={{ mb: 1, textAlign: "center" }}>
          Join {invitation?.office_name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, textAlign: "center" }}
        >
          You've been invited as {invitation?.role}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          autoFocus
          sx={{ mb: 2 }}
        />

        <TextField
          label="Email"
          type="email"
          value={invitation?.email ?? ""}
          fullWidth
          disabled
          sx={{ mb: 2 }}
        />

        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />

        <TextField
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          required
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disableElevation
          disabled={submitting}
          sx={{
            mb: 2,
          }}
        >
          {submitting ? "Creating account..." : "Join workspace"}
        </Button>

        <Typography variant="body2" sx={{ textAlign: "center" }}>
          Already have an account?{" "}
          <Link component={RouterLink} to="/login" underline="hover">
            Log in
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
