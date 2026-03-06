import { createTheme } from "@mui/material";
import { colors } from "./theme/colors";

export const theme = createTheme({
    palette: {
        primary: {
            main: colors.brand.slate,
            dark: "#5A748F",
            contrastText: "#FFFFFF",
        },
        secondary: {
            main: "#6B6B6B",
        },
        background: {
            default: colors.neutral.background,
            paper: colors.neutral.paper,
        },
        text: {
            primary: colors.neutral.text,
            secondary: colors.neutral.textSecondary,
        },
        divider: colors.neutral.divider,
    },
    typography: {
        fontFamily: '"LINE Seed JP", sans-serif',
        h3: {
            fontWeight: 500,
            letterSpacing: "-0.02em",
        },
        h4: {
            fontWeight: 500,
            letterSpacing: "-0.02em",
        },
        h5: {
            fontWeight: 500,
            letterSpacing: "-0.01em",
        },
        h6: {
            fontWeight: 500,
            letterSpacing: "-0.01em",
        },
        subtitle1: {
            fontWeight: 400,
            color: colors.neutral.textSecondary,
        },
        body2: {
            color: "#6B6B6B",
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiPaper: {
            defaultProps: {
                elevation: 0,
            },
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    fontWeight: 500,
                    borderRadius: 8,
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    "&.Mui-selected": {
                        backgroundColor: "rgba(0,0,0,0.04)",
                        "&:hover": {
                            backgroundColor: "rgba(0,0,0,0.06)",
                        },
                    },
                },
            },
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    minWidth: 36,
                    color: colors.neutral.textSecondary,
                },
            },
        },
    },
});
