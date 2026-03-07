import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Box, Typography, Avatar, Popover } from "@mui/material";
import {
  Home,
  Building2,
  Users,
  Activity,
  Calendar,
  CheckSquare,
  Mail,
  FileText,
  Globe,
  Radio,
  Workflow,
  LayoutTemplate,
  ShieldCheck,
  ClipboardList,
  SlidersHorizontal,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/LanguageContext";

const EXPANDED_WIDTH = 232;
const COLLAPSED_WIDTH = 60;

interface NavItem {
  path: string;
  translationKey: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  roles?: string[];
}

const mainItems: NavItem[] = [
  { translationKey: "sidebar.nav.dashboard", path: "/dashboard", icon: Home },
  { translationKey: "sidebar.nav.estates", path: "/estates", icon: Building2 },
  { translationKey: "sidebar.nav.contacts", path: "/contacts", icon: Users },
  {
    translationKey: "sidebar.nav.activity_log",
    path: "/activity",
    icon: Activity,
  },
];

const organizeItems: NavItem[] = [
  { translationKey: "sidebar.nav.calendar", path: "/calendar", icon: Calendar },
  { translationKey: "sidebar.nav.tasks", path: "/tasks", icon: CheckSquare },
  { translationKey: "sidebar.nav.email", path: "/email", icon: Mail },
  {
    translationKey: "sidebar.nav.email_templates",
    path: "/email-templates",
    icon: LayoutTemplate,
  },
  {
    translationKey: "sidebar.nav.documents",
    path: "/documents",
    icon: FileText,
  },
  {
    translationKey: "sidebar.nav.websites",
    path: "/websites",
    icon: Globe,
  },
  {
    translationKey: "sidebar.nav.portals",
    path: "/portals",
    icon: Radio,
  },
  {
    translationKey: "sidebar.nav.processes",
    path: "/processes",
    icon: Workflow,
  },
];

const adminItems: NavItem[] = [
  {
    translationKey: "sidebar.nav.audit_log",
    path: "/audit-log",
    icon: ClipboardList,
    roles: ["admin", "manager"],
  },
  {
    translationKey: "sidebar.nav.users",
    path: "/users",
    icon: ShieldCheck,
    roles: ["admin", "manager"],
  },
  {
    translationKey: "sidebar.nav.custom_fields",
    path: "/custom-fields",
    icon: SlidersHorizontal,
    roles: ["admin", "manager"],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [labelsVisible, setLabelsVisible] = useState(!collapsed);
  const [userPopoverAnchor, setUserPopoverAnchor] =
    useState<HTMLElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (collapsed) {
      setLabelsVisible(false);
    } else {
      timeoutRef.current = setTimeout(() => setLabelsVisible(true), 150);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [collapsed]);

  const handleLogout = async () => {
    setUserPopoverAnchor(null);
    await logout();
    navigate("/");
  };

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const visibleAdminItems = adminItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.path);
    const Icon = item.icon;

    return (
      <Box
        key={item.path}
        onClick={() => navigate(item.path)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          height: 36,
          px: 1.25,
          borderRadius: "8px",
          cursor: "pointer",
          position: "relative",
          justifyContent: collapsed ? "center" : "flex-start",
          bgcolor: active ? "rgba(0,0,0,0.06)" : "transparent",
          color: active ? "text.primary" : "text.secondary",
          fontWeight: active ? 600 : 400,
          transition: "background-color 0.15s ease, color 0.15s ease",
          "&:hover": {
            bgcolor: active ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.03)",
            color: "text.primary",
          },
          userSelect: "none",
        }}
      >
        {active && (
          <Box
            sx={{
              position: "absolute",
              left: -4,
              top: "50%",
              transform: "translateY(-50%)",
              width: 3,
              height: 16,
              borderRadius: "0 2px 2px 0",
              bgcolor: "primary.main",
            }}
          />
        )}
        <Icon size={20} strokeWidth={active ? 2 : 1.5} />
        {labelsVisible && !collapsed && (
          <Typography
            sx={{
              fontSize: "0.825rem",
              whiteSpace: "nowrap",
              opacity: labelsVisible ? 1 : 0,
              transition: "opacity 0.12s ease",
              lineHeight: 1.2,
            }}
          >
            {t(item.translationKey)}
          </Typography>
        )}
      </Box>
    );
  };

  const renderSectionLabel = (label: string) => {
    if (collapsed) return <Box sx={{ height: 12 }} />;
    return (
      <Typography
        sx={{
          fontSize: "0.625rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "text.secondary",
          px: 1.25,
          pt: 1.5,
          pb: 0.5,
          opacity: labelsVisible ? 0.6 : 0,
          transition: "opacity 0.12s ease",
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
    );
  };

  const userPopoverOpen = Boolean(userPopoverAnchor);

  return (
    <Box
      component="nav"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        minWidth: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: "#F6F6F4",
        transition: "width 0.2s ease, min-width 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          px: collapsed ? 0 : 1.75,
          gap: 1,
        }}
      >
        {collapsed ? (
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "7px",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                color: "#fff",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              M
            </Typography>
          </Box>
        ) : (
          <Box
            component="img"
            src="/maklr-logo.svg"
            alt="Maklr"
            sx={{
              height: 30,
              opacity: labelsVisible ? 1 : 0,
              transition: "opacity 0.12s ease",
            }}
          />
        )}
      </Box>

      {/* Main nav */}
      <Box
        sx={{
          flex: 1,
          px: 1,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {mainItems.map(renderNavItem)}

        {renderSectionLabel(t("sidebar.section.organize"))}
        {organizeItems.map(renderNavItem)}

        {visibleAdminItems.length > 0 && (
          <>
            {renderSectionLabel(t("sidebar.section.admin"))}
            {visibleAdminItems.map(renderNavItem)}
          </>
        )}
      </Box>

      {/* Collapse toggle — subtle, shown on hover */}
      <Box
        sx={{
          px: 1,
          pb: 0.5,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      >
        <Box
          onClick={onToggle}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 1.25,
            height: 32,
            px: 1.25,
            borderRadius: "8px",
            cursor: "pointer",
            color: "text.secondary",
            transition: "background-color 0.15s ease",
            "&:hover": {
              bgcolor: "rgba(0,0,0,0.03)",
            },
            userSelect: "none",
          }}
        >
          {collapsed ? (
            <ChevronsRight size={18} strokeWidth={1.5} />
          ) : (
            <ChevronsLeft size={18} strokeWidth={1.5} />
          )}
          {labelsVisible && !collapsed && (
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "text.secondary",
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
            >
              {t("sidebar.collapse")}
            </Typography>
          )}
        </Box>
      </Box>

      {/* User section */}
      {user && (
        <Box
          sx={{
            px: 1,
            pb: 1.5,
          }}
        >
          <Box
            onClick={(e) =>
              collapsed ? setUserPopoverAnchor(e.currentTarget) : undefined
            }
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              px: 1.25,
              py: 0.75,
              borderRadius: "8px",
              cursor: collapsed ? "pointer" : "default",
              justifyContent: collapsed ? "center" : "flex-start",
              transition: "background-color 0.15s ease",
              "&:hover": collapsed
                ? {
                    bgcolor: "rgba(0,0,0,0.03)",
                  }
                : {},
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "transparent",
                color: "text.primary",
                fontSize: "0.8rem",
                fontWeight: 600,
                border: "1.5px solid",
                borderColor: "rgba(0,0,0,0.15)",
                flexShrink: 0,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            {labelsVisible && !collapsed && (
              <Box sx={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.2,
                    color: "text.primary",
                  }}
                >
                  {user.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.675rem",
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.2,
                    mt: 0.25,
                    textTransform: "capitalize",
                  }}
                >
                  {user.role}
                </Typography>
              </Box>
            )}
            {labelsVisible && !collapsed && (
              <Box
                onClick={handleLogout}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: "text.secondary",
                  flexShrink: 0,
                  transition: "background-color 0.15s ease, color 0.15s ease",
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.05)",
                    color: "text.primary",
                  },
                }}
              >
                <LogOut size={16} strokeWidth={1.5} />
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Collapsed user popover */}
      <Popover
        open={userPopoverOpen}
        anchorEl={userPopoverAnchor}
        onClose={() => setUserPopoverAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "10px",
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
              p: 1.5,
              minWidth: 180,
            },
          },
        }}
      >
        {user && (
          <Box>
            <Box sx={{ px: 0.75, pb: 1 }}>
              <Typography sx={{ fontSize: "0.825rem", fontWeight: 500 }}>
                {user.name}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  color: "text.secondary",
                  textTransform: "capitalize",
                }}
              >
                {user.role}
              </Typography>
            </Box>
            <Box
              onClick={handleLogout}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                height: 34,
                px: 0.75,
                borderRadius: "6px",
                cursor: "pointer",
                color: "text.secondary",
                fontSize: "0.8rem",
                transition: "background-color 0.15s ease, color 0.15s ease",
                "&:hover": {
                  bgcolor: "rgba(0,0,0,0.04)",
                  color: "text.primary",
                },
              }}
            >
              <LogOut size={16} strokeWidth={1.5} />
              <Typography sx={{ fontSize: "0.8rem" }}>
                {t("sidebar.logout")}
              </Typography>
            </Box>
          </Box>
        )}
      </Popover>
    </Box>
  );
}
