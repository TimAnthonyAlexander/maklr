import { Navigate, Outlet, useLocation } from "react-router";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  publicRoute?: boolean;
}

export function ProtectedRoute({ publicRoute }: ProtectedRouteProps) {
  const { user, loading, needsOnboarding } = useAuth();
  const location = useLocation();

  if (publicRoute) {
    return <Outlet />;
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (needsOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
