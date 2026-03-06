import { useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Skeleton,
  Alert,
  Chip,
} from "@mui/material";
import { Plus, Search, Radio } from "lucide-react";
import { useGetPortalList } from "../api/hooks";
import { PortalForm } from "../components/portals/PortalForm";
import { useTranslation } from "../contexts/LanguageContext";

export function PortalsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);

  const query = useMemo(
    () => ({
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      per_page: searchParams.get("per_page")
        ? Number(searchParams.get("per_page"))
        : undefined,
    }),
    [searchParams],
  );

  const { data, loading, error, refetch } = useGetPortalList(query);
  const items = data?.items ?? [];
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          {t("portal.page_title")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setFormOpen(true)}
        >
          {t("portal.add")}
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder={t("portal.search_placeholder")}
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
                <TableCell>{t("portal.col_name")}</TableCell>
                <TableCell>{t("portal.col_type")}</TableCell>
                <TableCell>{t("portal.col_status")}</TableCell>
                <TableCell>{t("portal.col_last_sync")}</TableCell>
                <TableCell>{t("portal.col_created")}</TableCell>
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

              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: "center", py: 6 }}>
                    <Radio
                      size={40}
                      strokeWidth={1}
                      style={{ opacity: 0.3, marginBottom: 8 }}
                    />
                    <Typography color="text.secondary">
                      {t("portal.empty")}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Plus size={18} />}
                      onClick={() => setFormOpen(true)}
                      sx={{ mt: 2 }}
                    >
                      {t("portal.add")}
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                items.map((portal) => (
                  <TableRow
                    key={portal.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate(`/portals/${portal.id}`)}
                  >
                    <TableCell>
                      <Typography fontWeight={500}>{portal.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: "uppercase" }}>
                        {portal.portal_type ?? "\u2014"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          portal.active
                            ? t("portal.status_active")
                            : t("portal.status_inactive")
                        }
                        color={portal.active ? "success" : "default"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {portal.last_sync_at
                        ? new Date(portal.last_sync_at).toLocaleString()
                        : "\u2014"}
                    </TableCell>
                    <TableCell>
                      {portal.created_at
                        ? new Date(portal.created_at).toLocaleDateString()
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
            rowsPerPageOptions={[10, 25, 50]}
          />
        )}
      </Paper>

      <PortalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </Box>
  );
}
