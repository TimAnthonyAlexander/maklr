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
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import type { User, PaginationMeta } from "../../api/types";
import { UserRoleChip } from "./UserRoleChip";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

interface UserListViewProps {
  users: User[];
  pagination: PaginationMeta | undefined;
  loading: boolean;
  onRowClick: (id: string) => void;
  onPageChange: (_: unknown, page: number) => void;
  onRowsPerPageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddClick: () => void;
}

export function UserListView({
  users,
  pagination,
  loading,
  onRowClick,
  onPageChange,
  onRowsPerPageChange,
  onAddClick,
}: UserListViewProps) {
  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      py: 6,
                      color: "text.secondary",
                    }}
                  >
                    <PeopleOutlinedIcon
                      sx={{ fontSize: 48, mb: 1, opacity: 0.5 }}
                    />
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      No users found
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={onAddClick}
                    >
                      Add your first user
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              users.map((user) => (
                <TableRow
                  key={user.id}
                  hover
                  onClick={() => user.id && onRowClick(user.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {user.name || "\u2014"}
                    </Typography>
                  </TableCell>
                  <TableCell>{user.email ?? "\u2014"}</TableCell>
                  <TableCell>
                    <UserRoleChip role={user.role ?? "guest"} />
                  </TableCell>
                  <TableCell>{user.phone ?? "\u2014"}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.active ? "Active" : "Inactive"}
                      size="small"
                      color={user.active ? "success" : "default"}
                      variant={user.active ? "filled" : "outlined"}
                      sx={{ fontSize: "0.75rem" }}
                    />
                  </TableCell>
                  <TableCell>
                    {user.created_at
                      ? dateFormatter.format(new Date(user.created_at))
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
