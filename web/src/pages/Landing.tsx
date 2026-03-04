import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Popover,
} from "@mui/material";
import {
  Building2,
  Users,
  Search,
  Activity,
  Calendar,
  CheckSquare,
  Mail,
  FileText,
  ShieldCheck,
  Github,
  Globe,
  ArrowRight,
  Terminal,
  SlidersHorizontal,
  LayoutList,
  Server,
  UserPlus,
  Puzzle,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "../contexts/LanguageContext";
import { colors } from "../theme/colors";

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  nl: "Nederlands",
  zh: "中文",
};

// -- Data --

interface ModuleConfig {
  icon: ReactNode;
  key: string;
  featured?: boolean;
}

interface HighlightConfig {
  icon: ReactNode;
  key: string;
}

const highlights: HighlightConfig[] = [
  {
    icon: <SlidersHorizontal size={20} strokeWidth={1.5} />,
    key: "custom_fields",
  },
  { icon: <LayoutList size={20} strokeWidth={1.5} />, key: "saved_views" },
  { icon: <Github size={20} strokeWidth={1.5} />, key: "open_source" },
];

const featuredModules: ModuleConfig[] = [
  {
    icon: <Building2 size={22} strokeWidth={1.5} />,
    key: "estates",
    featured: true,
  },
  {
    icon: <Users size={22} strokeWidth={1.5} />,
    key: "contacts",
    featured: true,
  },
  {
    icon: <Search size={22} strokeWidth={1.5} />,
    key: "matching",
    featured: true,
  },
];

const otherModules: ModuleConfig[] = [
  { icon: <Activity size={18} strokeWidth={1.5} />, key: "activity_log" },
  { icon: <Calendar size={18} strokeWidth={1.5} />, key: "calendar" },
  { icon: <CheckSquare size={18} strokeWidth={1.5} />, key: "tasks" },
  { icon: <Mail size={18} strokeWidth={1.5} />, key: "email" },
  { icon: <FileText size={18} strokeWidth={1.5} />, key: "documents" },
  { icon: <ShieldCheck size={18} strokeWidth={1.5} />, key: "users" },
];

// -- Product mockup (stylized dashboard preview) --

function ProductMockup() {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 520,
        aspectRatio: "4 / 3",
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "rgba(0,0,0,0.08)",
        bgcolor: "#fff",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Title bar */}
      <Box
        sx={{
          height: 36,
          bgcolor: "#F6F6F4",
          borderBottom: "1px solid",
          borderColor: "rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          px: 1.5,
          gap: 0.75,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "rgba(0,0,0,0.12)",
          }}
        />
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "rgba(0,0,0,0.12)",
          }}
        />
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "rgba(0,0,0,0.12)",
          }}
        />
      </Box>

      <Box sx={{ display: "flex", flex: 1 }}>
        {/* Mini sidebar */}
        <Box
          sx={{
            width: 48,
            bgcolor: "#F6F6F4",
            borderRight: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            py: 1.5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {[...Array(6)].map((_, i) => (
            <Box
              key={i}
              sx={{
                width: 24,
                height: 24,
                borderRadius: "6px",
                bgcolor: i === 0 ? "rgba(0,0,0,0.08)" : "transparent",
              }}
            />
          ))}
        </Box>

        {/* Content area */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          {/* Header row */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 14,
                borderRadius: "4px",
                bgcolor: "rgba(0,0,0,0.08)",
              }}
            />
            <Box
              sx={{
                width: 60,
                height: 24,
                borderRadius: "6px",
                bgcolor: colors.neutral.text,
              }}
            />
          </Box>

          {/* Stat cards */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {[1, 2, 3].map((i) => (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  height: 48,
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                  p: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 6,
                    borderRadius: "3px",
                    bgcolor: "rgba(0,0,0,0.06)",
                  }}
                />
                <Box
                  sx={{
                    width: 20,
                    height: 10,
                    borderRadius: "3px",
                    bgcolor: "rgba(0,0,0,0.1)",
                  }}
                />
              </Box>
            ))}
          </Box>

          {/* Table rows */}
          <Box
            sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.5 }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <Box
                key={i}
                sx={{
                  height: 28,
                  borderRadius: "6px",
                  bgcolor: i === 1 ? "rgba(0,0,0,0.03)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1,
                }}
              >
                <Box
                  sx={{
                    width: i === 1 ? "40%" : `${25 + i * 5}%`,
                    height: 6,
                    borderRadius: "3px",
                    bgcolor: `rgba(0,0,0,${i === 1 ? 0.1 : 0.05})`,
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// -- Sections --

function Hero() {
  const { t } = useTranslation();

  return (
    <Box sx={{ pt: { xs: 14, md: 20 }, pb: { xs: 8, md: 14 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "center", md: "center" },
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 6, md: 8 },
          }}
        >
          {/* Left: Copy */}
          <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" } }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 600,
                letterSpacing: "-0.04em",
                fontSize: { xs: "2.25rem", sm: "2.75rem", md: "3.5rem" },
                lineHeight: 1.08,
                mb: 2.5,
              }}
            >
              {t("landing.hero.title_line1")}
              <br />
              <Box component="span" sx={{ color: "text.secondary" }}>
                {t("landing.hero.title_line2")}
              </Box>
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "1rem", md: "1.1rem" },
                color: "text.secondary",
                maxWidth: 440,
                mx: { xs: "auto", md: 0 },
                lineHeight: 1.65,
                mb: 4,
              }}
            >
              {t("landing.hero.subtitle")}
            </Typography>
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent={{ xs: "center", md: "flex-start" }}
            >
              <Button
                variant="contained"
                disableElevation
                size="large"
                endIcon={<ArrowRight size={18} />}
                sx={{
                  px: 3.5,
                  py: 1.25,
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  borderRadius: "10px",
                  transition:
                    "transform 0.15s ease, background-color 0.15s ease",
                  "&:hover": {
                    transform: "translateY(-1px)",
                  },
                  "& .MuiButton-endIcon": {
                    transition: "transform 0.15s ease",
                  },
                  "&:hover .MuiButton-endIcon": {
                    transform: "translateX(2px)",
                  },
                }}
              >
                {t("landing.hero.cta")}
              </Button>
              <Button
                size="large"
                startIcon={<Github size={18} />}
                sx={{
                  color: "text.secondary",
                  fontSize: "0.9rem",
                  fontWeight: 400,
                  px: 2,
                  "&:hover": { bgcolor: "transparent", color: "text.primary" },
                }}
              >
                {t("landing.hero.github")}
              </Button>
            </Stack>
          </Box>

          {/* Right: Product mockup */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: { xs: "center", md: "flex-end" },
            }}
          >
            <ProductMockup />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function Highlights() {
  const { t } = useTranslation();

  return (
    <Box id="features" sx={{ py: { xs: 6, md: 10 }, bgcolor: "#F6F6F4" }}>
      <Container maxWidth="lg">
        <Stack spacing={0}>
          {highlights.map((h, i) => (
            <Box
              key={h.key}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2.5,
                py: 3,
                borderBottom: i < highlights.length - 1 ? "1px solid" : "none",
                borderColor: "rgba(0,0,0,0.06)",
              }}
            >
              <Box
                sx={{
                  color: "text.secondary",
                  mt: 0.25,
                  flexShrink: 0,
                }}
              >
                {h.icon}
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    mb: 0.5,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {t(`landing.highlights.${h.key}.title`)}
                </Typography>
                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.875rem",
                    lineHeight: 1.65,
                    maxWidth: 520,
                  }}
                >
                  {t(`landing.highlights.${h.key}.description`)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}

function Modules() {
  const { t } = useTranslation();

  return (
    <Box id="modules" sx={{ py: { xs: 8, md: 14 } }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: { xs: 5, md: 7 } }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 600,
              letterSpacing: "-0.035em",
              mb: 1.5,
              fontSize: { xs: "1.75rem", md: "2.25rem" },
            }}
          >
            {t("landing.modules.heading")}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "1rem" }}>
            {t("landing.modules.subheading")}
          </Typography>
        </Box>

        {/* Featured modules — larger cards, 3-col */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 2,
            mb: 2,
          }}
        >
          {featuredModules.map((m) => (
            <Box
              key={m.key}
              sx={{
                p: 3,
                borderRadius: "14px",
                border: "1px solid",
                borderColor: "rgba(0,0,0,0.06)",
                bgcolor: "#fff",
                transition: "border-color 0.2s ease, transform 0.2s ease",
                "&:hover": {
                  borderColor: "rgba(0,0,0,0.15)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box sx={{ color: "text.secondary", mb: 2 }}>{m.icon}</Box>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  mb: 0.75,
                  letterSpacing: "-0.01em",
                }}
              >
                {t(`landing.modules.${m.key}.title`)}
              </Typography>
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: "0.85rem",
                  lineHeight: 1.65,
                }}
              >
                {t(`landing.modules.${m.key}.description`)}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Other modules — compact inline list */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 0,
            borderRadius: "14px",
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            bgcolor: "#fff",
            overflow: "hidden",
          }}
        >
          {otherModules.map((m, i) => (
            <Box
              key={m.key}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                p: 2.5,
                borderBottom: {
                  xs: i < otherModules.length - 1 ? "1px solid" : "none",
                  sm: i < otherModules.length - 2 ? "1px solid" : "none",
                  md: i < otherModules.length - 3 ? "1px solid" : "none",
                },
                borderRight: {
                  xs: "none",
                  sm: (i + 1) % 2 !== 0 ? "1px solid" : "none",
                  md: (i + 1) % 3 !== 0 ? "1px solid" : "none",
                },
                borderColor: "rgba(0,0,0,0.06)",
              }}
            >
              <Box sx={{ color: "text.secondary", mt: 0.125, flexShrink: 0 }}>
                {m.icon}
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    mb: 0.25,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {t(`landing.modules.${m.key}.title`)}
                </Typography>
                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.8rem",
                    lineHeight: 1.55,
                  }}
                >
                  {t(`landing.modules.${m.key}.description`)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

function OpenSource() {
  const { t } = useTranslation();

  const points = [
    {
      icon: <Server size={18} strokeWidth={1.5} />,
      title: t("landing.open_source.self_host"),
      desc: t("landing.open_source.self_host_desc"),
    },
    {
      icon: <UserPlus size={18} strokeWidth={1.5} />,
      title: t("landing.open_source.no_fees"),
      desc: t("landing.open_source.no_fees_desc"),
    },
    {
      icon: <Puzzle size={18} strokeWidth={1.5} />,
      title: t("landing.open_source.extensible"),
      desc: t("landing.open_source.extensible_desc"),
    },
  ];

  return (
    <Box id="open-source" sx={{ py: { xs: 8, md: 14 }, bgcolor: "#F6F6F4" }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 5, md: 8 },
            alignItems: { md: "center" },
          }}
        >
          {/* Left: text */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 600,
                letterSpacing: "-0.035em",
                mb: 2,
                fontSize: { xs: "1.75rem", md: "2.25rem" },
              }}
            >
              {t("landing.open_source.heading")}
            </Typography>
            <Typography
              sx={{
                color: "text.secondary",
                fontSize: "1rem",
                lineHeight: 1.65,
                mb: 4,
                maxWidth: 420,
              }}
            >
              {t("landing.open_source.description")}
            </Typography>

            <Stack spacing={2.5}>
              {points.map((p) => (
                <Box
                  key={p.title}
                  sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}
                >
                  <Box sx={{ color: "text.secondary", mt: 0.125 }}>
                    {p.icon}
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        letterSpacing: "-0.01em",
                        mb: 0.25,
                      }}
                    >
                      {p.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.825rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {p.desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Right: terminal-style clone block */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: { xs: "center", md: "flex-end" },
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: 460,
                borderRadius: "14px",
                bgcolor: colors.neutral.text,
                overflow: "hidden",
              }}
            >
              {/* Terminal bar */}
              <Box
                sx={{
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  px: 1.5,
                  gap: 0.75,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "rgba(255,255,255,0.15)",
                  }}
                />
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "rgba(255,255,255,0.15)",
                  }}
                />
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "rgba(255,255,255,0.15)",
                  }}
                />
              </Box>

              {/* Terminal content */}
              <Box sx={{ px: 2.5, pb: 3, pt: 0.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Terminal
                    size={14}
                    strokeWidth={1.5}
                    color="rgba(255,255,255,0.4)"
                  />
                  <Typography
                    component="code"
                    sx={{
                      fontFamily: '"SF Mono", "Fira Code", monospace',
                      fontSize: "0.8rem",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {t("landing.open_source.clone")}
                  </Typography>
                </Box>
                <Typography
                  component="code"
                  sx={{
                    fontFamily: '"SF Mono", "Fira Code", monospace',
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.3)",
                    display: "block",
                    mb: 0.5,
                  }}
                >
                  cd maklr && ./mason serve
                </Typography>
                <Typography
                  component="code"
                  sx={{
                    fontFamily: '"SF Mono", "Fira Code", monospace',
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  Server running on http://localhost:8080
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* GitHub button */}
        <Box
          sx={{
            mt: 5,
            display: "flex",
            justifyContent: { xs: "center", md: "flex-start" },
          }}
        >
          <Button
            variant="outlined"
            startIcon={<Github size={18} />}
            sx={{
              borderColor: "rgba(0,0,0,0.12)",
              color: "text.primary",
              px: 2.5,
              py: 1,
              fontSize: "0.875rem",
              fontWeight: 500,
              borderRadius: "10px",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.3)",
                bgcolor: "transparent",
              },
            }}
          >
            {t("landing.open_source.github")}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          cursor: "pointer",
          color: "text.secondary",
          fontSize: "0.8rem",
          px: 1,
          py: 0.5,
          borderRadius: "6px",
          transition: "color 0.15s ease",
          "&:hover": { color: "text.primary" },
          userSelect: "none",
        }}
      >
        <Globe size={14} strokeWidth={1.5} />
        <Typography sx={{ fontSize: "0.8rem" }}>
          {LANGUAGE_LABELS[language] ?? language}
        </Typography>
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "10px",
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
              p: 0.75,
              minWidth: 140,
            },
          },
        }}
      >
        {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
          <Box
            key={code}
            onClick={() => {
              setLanguage(code);
              setAnchorEl(null);
            }}
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.825rem",
              fontWeight: code === language ? 600 : 400,
              color: code === language ? "text.primary" : "text.secondary",
              transition: "background-color 0.15s ease",
              "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
            }}
          >
            {label}
          </Box>
        ))}
      </Popover>
    </>
  );
}

function Footer() {
  const { t } = useTranslation();

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
            {t("landing.footer.name")}
          </Typography>
          <LanguageSwitcher />
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
            {t("landing.footer.tagline")}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

// -- Page --

export function Landing() {
  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <Hero />
      <Highlights />
      <Modules />
      <OpenSource />
      <Footer />
    </Box>
  );
}
