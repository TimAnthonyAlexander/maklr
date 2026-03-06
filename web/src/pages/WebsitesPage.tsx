import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Skeleton,
  Alert,
  TextField,
  InputAdornment,
  TablePagination,
} from "@mui/material";
import { Plus, Globe, Search } from "lucide-react";
import { useGetWebsiteList } from "../api/hooks";
import { useTranslation } from "../contexts/LanguageContext";
import { WebsiteForm } from "../components/websites/WebsiteForm";

export function WebsitesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);

  const query = useMemo(
    () => ({
      q: searchParams.get("q") || undefined,
      page: Number(searchParams.get("page")) || 1,
      per_page: Number(searchParams.get("per_page")) || 20,
    }),
    [searchParams],
  );

  const { data, loading, error, refetch } = useGetWebsiteList(query);

  const websites = data?.items ?? [];
  const pagination = data?.pagination;

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      params.delete("page");
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const handlePageChange = useCallback(
    (_: unknown, newPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(newPage + 1));
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const handleRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const params = new URLSearchParams(searchParams);
      params.set("per_page", e.target.value);
      params.delete("page");
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const handleFormSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          {t("websites.title")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setFormOpen(true)}
        >
          {t("websites.create")}
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder={t("websites.search_placeholder")}
          value={searchParams.get("q") || ""}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ width: 300 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <Paper variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("websites.column.name")}</TableCell>
                <TableCell>{t("websites.column.slug")}</TableCell>
                <TableCell>{t("websites.column.pages")}</TableCell>
                <TableCell>{t("websites.column.status")}</TableCell>
                <TableCell>{t("websites.column.created")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              {!loading && websites.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: "center", py: 6 }}>
                    <Globe size={40} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <Typography color="text.secondary">
                      {t("websites.empty")}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Plus size={18} />}
                      onClick={() => setFormOpen(true)}
                      sx={{ mt: 2 }}
                    >
                      {t("websites.create")}
                    </Button>
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                websites.map((website) => (
                  <TableRow
                    key={website.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate(`/websites/${website.id}`)}
                  >
                    <TableCell>
                      <Typography fontWeight={500}>{website.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        /sites/{website.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {website.pages?.length ?? "\u2014"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          website.published
                            ? t("websites.status.published")
                            : t("websites.status.draft")
                        }
                        size="small"
                        color={website.published ? "success" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {website.created_at
                        ? new Date(website.created_at).toLocaleDateString()
                        : "\u2014"}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        {pagination && (
          <TablePagination
            component="div"
            count={pagination.total}
            page={(pagination.page ?? 1) - 1}
            rowsPerPage={pagination.per_page ?? 20}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        )}
      </Paper>

      <WebsiteForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </Box>
  );
}
