import { useState, useCallback, useRef, useEffect } from "react";
import { Box, Typography, TextField, IconButton, CircularProgress } from "@mui/material";
import { Send } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import type { WebsiteChatMessage } from "../../api/types";

interface WebsiteChatPanelProps {
  messages: WebsiteChatMessage[];
  loading: boolean;
  onSend: (message: string) => void;
}

export function WebsiteChatPanel({ messages, loading, onSend }: WebsiteChatPanelProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setInput("");
  }, [input, loading, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRight: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ flex: 1, overflow: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <Box
              sx={{
                maxWidth: "85%",
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: msg.role === "user" ? "primary.main" : "rgba(0,0,0,0.04)",
                color: msg.role === "user" ? "#fff" : "text.primary",
              }}
            >
              <Typography sx={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                {msg.content}
              </Typography>
            </Box>
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 2,
                bgcolor: "rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CircularProgress size={16} />
              <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
                {t("websites.editor.generating")}
              </Typography>
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box
        sx={{
          p: 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          gap: 1,
          alignItems: "flex-end",
        }}
      >
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("websites.editor.chat_placeholder")}
          multiline
          maxRows={4}
          fullWidth
          size="small"
          disabled={loading}
        />
        <IconButton
          onClick={handleSend}
          disabled={!input.trim() || loading}
          color="primary"
          size="small"
        >
          <Send size={18} />
        </IconButton>
      </Box>
    </Box>
  );
}
