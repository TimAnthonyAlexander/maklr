import { useState } from "react";
import { Box, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

interface WebsitePreviewPaneProps {
  html: string | null;
  websiteName: string;
}

const DEVICE_WIDTHS = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
} as const;

type Device = keyof typeof DEVICE_WIDTHS;

export function WebsitePreviewPane({ html, websiteName }: WebsitePreviewPaneProps) {
  const { t } = useTranslation();
  const [device, setDevice] = useState<Device>("desktop");

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${websiteName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-gray-900">
  <main>${html ?? ""}</main>
</body>
</html>`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", flex: 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <ToggleButtonGroup
          value={device}
          exclusive
          onChange={(_, val) => val && setDevice(val as Device)}
          size="small"
        >
          <ToggleButton value="desktop" title={t("websites.editor.desktop")}>
            <Monitor size={16} />
          </ToggleButton>
          <ToggleButton value="tablet" title={t("websites.editor.tablet")}>
            <Tablet size={16} />
          </ToggleButton>
          <ToggleButton value="mobile" title={t("websites.editor.mobile")}>
            <Smartphone size={16} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          justifyContent: "center",
          bgcolor: "#f0f0f0",
          p: device === "desktop" ? 0 : 2,
        }}
      >
        <Box
          sx={{
            width: DEVICE_WIDTHS[device],
            maxWidth: "100%",
            height: "100%",
            bgcolor: "#fff",
            boxShadow: device !== "desktop" ? "0 2px 12px rgba(0,0,0,0.1)" : "none",
            borderRadius: device !== "desktop" ? 1 : 0,
            overflow: "hidden",
          }}
        >
          <iframe
            srcDoc={fullHtml}
            title="Preview"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            sandbox="allow-scripts"
          />
        </Box>
      </Box>
    </Box>
  );
}
