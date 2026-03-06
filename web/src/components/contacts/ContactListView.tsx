import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Box,
  Skeleton,
  Button,
} from "@mui/material";
import { Plus, Users } from "lucide-react";
import type { Contact, PaginationMeta } from "../../api/types";
import { ContactStageChip, ContactTypeChip } from "./ContactStageChip";
import { getContactDisplayName } from "../../utils/contactHelpers";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const ENTITY_LABELS: Record<string, string> = {
  person: "Person",
  company: "Company",
};

interface ContactListViewProps {
  contacts: Contact[];
  pagination: PaginationMeta | undefined;
  loading: boolean;
  onRowClick: (id: string) => void;
  onPageChange: (_: unknown, page: number) => void;
  onRowsPerPageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddClick: () => void;
}

export function ContactListView({
  contacts,
  pagination,
  loading,
  onRowClick,
  onPageChange,
  onRowsPerPageChange,
  onAddClick,
}: ContactListViewProps) {
  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Stage</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && contacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      py: 6,
                      color: "text.secondary",
                    }}
                  >
                    <Users
                      size={48}
                      style={{ marginBottom: 8, opacity: 0.5 }}
                    />
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      No contacts yet
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Plus size={18} />}
                      onClick={onAddClick}
                    >
                      Add your first contact
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  hover
                  onClick={() => contact.id && onRowClick(contact.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {getContactDisplayName(contact)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <ContactTypeChip type={contact.type ?? "misc"} />
                  </TableCell>
                  <TableCell>
                    {ENTITY_LABELS[contact.entity_type ?? ""] ??
                      contact.entity_type}
                  </TableCell>
                  <TableCell>
                    <ContactStageChip stage={contact.stage ?? "cold"} />
                  </TableCell>
                  <TableCell>{contact.email ?? "\u2014"}</TableCell>
                  <TableCell>{contact.phone ?? "\u2014"}</TableCell>
                  <TableCell>{contact.city ?? "\u2014"}</TableCell>
                  <TableCell>
                    {contact.created_at
                      ? dateFormatter.format(new Date(contact.created_at))
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
          onPageChange={onPageChange}
          rowsPerPage={pagination.per_page ?? 25}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50]}
        />
      )}
    </Paper>
  );
}
