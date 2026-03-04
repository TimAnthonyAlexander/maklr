import { useNavigate, useLocation } from "react-router";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

const anchorLinks = [
  { label: "Features", href: "#features" },
  { label: "Modules", href: "#modules" },
  { label: "Open Source", href: "#open-source" },
];

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isLanding = location.pathname === "/";

  const handleAnchor = (href: string) => {
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "rgba(250,250,250,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ height: 64 }}>
          <Box
            component="img"
            src="/maklr-logo.svg"
            alt="Maklr"
            onClick={() => navigate("/")}
            sx={{
              height: 36,
              cursor: "pointer",
              mr: 6,
            }}
          />

          {isLanding && (
            <Box sx={{ display: "flex", gap: 1 }}>
              {anchorLinks.map((link) => (
                <Button
                  key={link.href}
                  onClick={() => handleAnchor(link.href)}
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.85rem",
                    fontWeight: 450,
                    "&:hover": {
                      color: "text.primary",
                      bgcolor: "transparent",
                    },
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {user ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                sx={{ fontSize: "0.85rem", color: "text.secondary", mr: 1 }}
              >
                {user.name}
              </Typography>
              <Button
                onClick={() => navigate("/dashboard")}
                sx={{
                  color: "text.primary",
                  fontSize: "0.85rem",
                  fontWeight: 450,
                }}
              >
                Dashboard
              </Button>
              <Button
                onClick={handleLogout}
                sx={{
                  color: "text.secondary",
                  fontSize: "0.85rem",
                  fontWeight: 450,
                }}
              >
                Log out
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              disableElevation
              onClick={() => navigate("/login")}
              sx={{
                fontSize: "0.85rem",
                px: 2.5,
              }}
            >
              Get started
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
