import { Box, Paper, Typography, Skeleton } from "@mui/material";
import { Building2, Users, ListTodo, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "../../contexts/LanguageContext";
import type { DashboardStatsResponse } from "../../api/types";
import { colors } from "../../theme/colors";

const DIVIDER = colors.neutral.divider;

interface DomainConfig {
    readonly icon: LucideIcon;
    readonly tint: string;
    readonly iconColor: string;
    readonly primaryLabel: string;
    readonly secondaryLabel: string;
    readonly href: string;
    readonly getPrimary: (s: DashboardStatsResponse) => number | undefined;
    readonly getSecondary: (s: DashboardStatsResponse) => number | undefined;
}

const DOMAINS: readonly DomainConfig[] = [
    {
        icon: Building2,
        tint: colors.brand.taupeTint,
        iconColor: colors.brand.sage,
        primaryLabel: "dashboard.stats.estates",
        secondaryLabel: "dashboard.stats.active",
        href: "/estates",
        getPrimary: (s) => s.total_estates,
        getSecondary: (s) => s.estates_by_status?.["active"],
    },
    {
        icon: Users,
        tint: colors.brand.sageTint,
        iconColor: colors.brand.sage,
        primaryLabel: "dashboard.stats.contacts",
        secondaryLabel: "dashboard.stats.cold_leads",
        href: "/contacts",
        getPrimary: (s) => s.contacts?.total,
        getSecondary: (s) => s.contacts?.by_stage?.["cold"],
    },
    {
        icon: ListTodo,
        tint: colors.brand.goldenTint,
        iconColor: colors.brand.golden,
        primaryLabel: "dashboard.stats.open_tasks",
        secondaryLabel: "dashboard.stats.overdue",
        href: "/tasks?status=open",
        getPrimary: (s) => s.tasks?.open,
        getSecondary: (s) => s.tasks?.overdue,
    },
    {
        icon: Mail,
        tint: colors.brand.slateTint,
        iconColor: colors.brand.slate,
        primaryLabel: "dashboard.stats.inbox",
        secondaryLabel: "dashboard.stats.unread",
        href: "/email",
        getPrimary: (s) => s.emails?.total,
        getSecondary: (s) => s.emails?.unread,
    },
];

interface DashboardPulseProps {
    stats: DashboardStatsResponse | undefined;
    loading: boolean;
}

export function DashboardPulse({ stats, loading }: DashboardPulseProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
                }}
            >
                {DOMAINS.map((domain, index) => {
                    const Icon = domain.icon;
                    const primaryValue = stats
                        ? domain.getPrimary(stats)
                        : undefined;
                    const secondaryValue = stats
                        ? domain.getSecondary(stats)
                        : undefined;

                    return (
                        <Box
                            key={domain.primaryLabel}
                            onClick={() => navigate(domain.href)}
                            sx={{
                                p: 3,
                                cursor: "pointer",
                                transition: "background-color 0.15s",
                                "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                                borderRight: {
                                    xs:
                                        index % 2 === 0
                                            ? `1px solid ${DIVIDER}`
                                            : "none",
                                    md:
                                        index < 3
                                            ? `1px solid ${DIVIDER}`
                                            : "none",
                                },
                                borderBottom: {
                                    xs:
                                        index < 2
                                            ? `1px solid ${DIVIDER}`
                                            : "none",
                                    md: "none",
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    mb: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        bgcolor: domain.tint,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <Icon size={18} color={domain.iconColor} />
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {t(domain.primaryLabel)}
                                </Typography>
                            </Box>

                            {loading ? (
                                <Skeleton width={60} height={48} />
                            ) : (
                                <Typography
                                    sx={{
                                        fontSize: "2.25rem",
                                        fontWeight: 600,
                                        letterSpacing: "-0.03em",
                                        lineHeight: 1,
                                        color: "text.primary",
                                    }}
                                >
                                    {primaryValue ?? 0}
                                </Typography>
                            )}

                            <Box sx={{ mt: 1.5 }}>
                                {loading ? (
                                    <Skeleton width={90} height={22} />
                                ) : (
                                    <Typography
                                        component="span"
                                        sx={{
                                            color: "text.secondary",
                                            bgcolor: "rgba(0,0,0,0.04)",
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: 1,
                                            fontSize: "0.75rem",
                                        }}
                                    >
                                        {secondaryValue ?? 0}{" "}
                                        {t(domain.secondaryLabel).toLowerCase()}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
}
