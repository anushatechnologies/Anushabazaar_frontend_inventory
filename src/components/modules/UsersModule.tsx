import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { UserService } from '../../services/api';

const UsersModule: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [openDlg, setOpenDlg] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setError(null);
    try {
      const data = await UserService.getAll();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user accounts directory');
    }
  };

  const handleOpenDlg = (user: any | null) => {
    setSelectedUser(user);
    if (user) {
      const roleName = user.roles[0]?.name?.replace('ROLE_', '') || 'STAFF';
      setValue('username', user.username);
      setValue('email', user.email);
      setValue('role', roleName);
      setValue('status', user.status);
      setValue('password', '');
    } else {
      reset({
        username: '',
        email: '',
        role: 'STAFF',
        status: 'ACTIVE',
        password: ''
      });
    }
    setOpenDlg(true);
  };

  const handleSaveUser = async (data: any) => {
    try {
      if (selectedUser) {
        await UserService.update(selectedUser.id, data);
      } else {
        await UserService.create(data);
      }
      setOpenDlg(false);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred while saving user details');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Delete this user account permanently?')) {
      try {
        await UserService.delete(id);
        fetchUsers();
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Error deleting user account');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>User Management</Typography>
          <Typography variant="body2" color="text.secondary">Create and manage accounts for business managers and entry staff.</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDlg(null)}
        >
          Add User
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Users List Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email Address</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Access Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  No users available.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const roleName = u.roles[0]?.name?.replace('ROLE_', '') || 'STAFF';
                return (
                  <TableRow key={u.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={roleName}
                        size="small"
                        color={roleName === 'ADMIN' ? 'primary' : roleName === 'MANAGER' ? 'secondary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.status}
                        size="small"
                        color={u.status === 'ACTIVE' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton color="primary" onClick={() => handleOpenDlg(u)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDeleteUser(u.id)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* User Add/Edit Dialog */}
      <Dialog open={openDlg} onClose={() => setOpenDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedUser ? 'Edit User Details' : 'Add New User'}
        </DialogTitle>
        <form onSubmit={handleSubmit(handleSaveUser)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
              <TextField
                label="Username"
                fullWidth
                disabled={!!selectedUser}
                {...register('username', { required: 'Username is required' })}
                error={!!errors.username}
                helperText={errors.username?.message as string}
              />
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                {...register('email', { required: 'Email address is required' })}
                error={!!errors.email}
                helperText={errors.email?.message as string}
              />
              <TextField
                label={selectedUser ? "Password (Leave blank to keep same)" : "Password"}
                type="password"
                fullWidth
                {...register('password', { required: selectedUser ? false : 'Password is required' })}
                error={!!errors.password}
                helperText={errors.password?.message as string}
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  label="Role"
                  defaultValue="STAFF"
                  {...register('role', { required: 'Role is required' })}
                >
                  <MenuItem value="ADMIN">ADMIN</MenuItem>
                  <MenuItem value="MANAGER">MANAGER</MenuItem>
                  <MenuItem value="STAFF">STAFF</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  defaultValue="ACTIVE"
                  {...register('status', { required: 'Status is required' })}
                >
                  <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                  <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDlg(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UsersModule;
