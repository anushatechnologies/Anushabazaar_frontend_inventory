import React, { useState, useEffect } from 'react';
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
  Pagination,
  Alert,
  Chip,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ReceiptLong as LedgerIcon,
  WarningAmberRounded as WarningIcon
} from '@mui/icons-material';
import { CustomerService } from '../../services/api';
import { useAppState } from '../../context/AppState';

const CustomersModule: React.FC = () => {
  const { user } = useAppState();

  const getRoleName = (r: any): string =>
    typeof r === 'string' ? r : (r?.name?.toString?.() ?? '');

  const isAdmin = user?.roles.some(r => getRoleName(r) === 'ROLE_ADMIN') ?? false;
  const isManagerOrAdmin = user?.roles.some(r => ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(getRoleName(r))) ?? false;

  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [error, setError] = useState<string | null>(null);

  // ── Custom Confirm Dialog ──────────────────────────────────────────────────
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMsg, setConfirmMsg]     = useState('');
  const [confirmColor, setConfirmColor] = useState<'error' | 'warning'>('error');
  const [confirmLabel, setConfirmLabel] = useState('Confirm');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const openConfirm = (
    title: string,
    msg: string,
    onOk: () => void,
    color: 'error' | 'warning' = 'error',
    label = 'Confirm'
  ) => {
    setConfirmTitle(title);
    setConfirmMsg(msg);
    setConfirmColor(color);
    setConfirmLabel(label);
    setConfirmAction(() => onOk);
    setConfirmOpen(true);
  };

  const handleConfirmOk = () => {
    setConfirmOpen(false);
    confirmAction?.();
  };

  // ── Snackbar ──────────────────────────────────────────────────────────────
  const [snackOpen, setSnackOpen]     = useState(false);
  const [snackMsg, setSnackMsg]       = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error' | 'warning'>('success');

  const showSnack = (msg: string, severity: 'success' | 'error' | 'warning' = 'success') => {
    setSnackMsg(msg);
    setSnackSeverity(severity);
    setSnackOpen(true);
  };

  // Customer Add/Edit Dialog
  const [openDlg, setOpenDlg] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    gst: '',
    address: '',
    outstandingBalance: 0
  });

  // Ledger Dialog
  const [openLedger, setOpenLedger] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerCustomerName, setLedgerCustomerName] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  const fetchCustomers = async () => {
    setError(null);
    try {
      const res = await CustomerService.getPaginated(search, page - 1, pageSize, 'id', 'asc');
      setCustomers(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve customer database');
    }
  };

  const handleOpenDlg = (customer: any | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      setFormData({
        name: customer.name,
        mobile: customer.mobile || '',
        email: customer.email || '',
        gst: customer.gst || '',
        address: customer.address || '',
        outstandingBalance: customer.outstandingBalance || 0
      });
    } else {
      setFormData({
        name: '',
        mobile: '',
        email: '',
        gst: '',
        address: '',
        outstandingBalance: 0
      });
    }
    setOpenDlg(true);
  };

  const handleSaveCustomer = async () => {
    if (!formData.name) {
      setError('Customer name is required');
      return;
    }
    setError(null);
    try {
      if (selectedCustomer) {
        await CustomerService.update(selectedCustomer.id, formData);
        showSnack('Customer updated successfully!', 'success');
      } else {
        await CustomerService.create(formData);
        showSnack('Customer created successfully!', 'success');
      }
      setOpenDlg(false);
      fetchCustomers();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred while saving customer');
    }
  };

  const handleDeleteCustomer = (id: number) => {
    openConfirm(
      'Delete Customer',
      'Are you sure you want to delete this customer? This action cannot be undone.',
      async () => {
        try {
          await CustomerService.delete(id);
          showSnack('Customer deleted successfully!', 'success');
          fetchCustomers();
        } catch (err: any) {
          console.error(err);
          const errMsg = err.response?.data?.message || 'Error deleting customer. They may have active transaction history.';
          showSnack(errMsg, 'error');
        }
      },
      'error',
      'Delete'
    );
  };

  const handleOpenLedger = async (customer: any) => {
    try {
      setLedgerCustomerName(customer.name);
      const ledger = await CustomerService.getLedger(customer.id);
      setLedgerEntries(ledger);
      setOpenLedger(true);
    } catch (err) {
      console.error(err);
      showSnack('Failed to load ledger sheet', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Customer Management</Typography>
          <Typography variant="body2" color="text.secondary">Register clients, manage contact files, and review outstanding accounts receivable ledgers.</Typography>
        </Box>
        {isManagerOrAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDlg(null)}
          >
            Add Customer
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="Search Customers..."
          variant="outlined"
          size="small"
          fullWidth
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </Paper>

      {/* Customers Table */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>GSTIN</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Address</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Outstanding Balance</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((cust) => (
                <TableRow key={cust.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{cust.name}</TableCell>
                  <TableCell>{cust.mobile || 'N/A'}</TableCell>
                  <TableCell>{cust.email || 'N/A'}</TableCell>
                  <TableCell>{cust.gst || 'N/A'}</TableCell>
                  <TableCell>{cust.address || 'N/A'}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700 }}
                      color={cust.outstandingBalance > 0 ? 'warning.main' : 'text.primary'}
                    >
                      Rs. {cust.outstandingBalance}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Ledger">
                      <IconButton color="info" onClick={() => handleOpenLedger(cust)} size="small">
                        <LedgerIcon />
                      </IconButton>
                    </Tooltip>
                    {isManagerOrAdmin && (
                      <IconButton color="primary" onClick={() => handleOpenDlg(cust)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {isAdmin && (
                      <IconButton color="error" onClick={() => handleDeleteCustomer(cust.id)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, val) => setPage(val)}
          color="primary"
        />
      </Box>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={openDlg} onClose={() => setOpenDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedCustomer ? 'Edit Customer Details' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Customer Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Mobile Number"
              fullWidth
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />
            <TextField
              label="Email Address"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label="GST Number"
              fullWidth
              value={formData.gst}
              onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDlg(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCustomer}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Customer Ledger Dialog */}
      <Dialog open={openLedger} onClose={() => setOpenLedger(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Ledger Sheet: {ledgerCustomerName}
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, overflow: 'auto', mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Date/Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Receivable Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ledgerEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      No transaction history found.
                    </TableCell>
                  </TableRow>
                ) : (
                  ledgerEntries.map((entry, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{new Date(entry.date).toLocaleString()}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={entry.type}
                          size="small"
                          color={entry.type === 'DEBIT' ? 'error' : entry.type === 'CREDIT' ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Rs. {entry.amount}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: entry.balance > 0 ? 'warning.main' : 'text.primary' }}>
                        Rs. {entry.balance}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLedger(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Custom Confirm Dialog ──────────────────────────────────────────── */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
          <WarningIcon color={confirmColor} />
          {confirmTitle}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{confirmMsg}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setConfirmOpen(false)} fullWidth>
            Cancel
          </Button>
          <Button variant="contained" color={confirmColor} onClick={handleConfirmOk} fullWidth sx={{ fontWeight: 700 }}>
            {confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ──────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackSeverity} onClose={() => setSnackOpen(false)} sx={{ fontWeight: 600 }}>
          {snackMsg}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default CustomersModule;
