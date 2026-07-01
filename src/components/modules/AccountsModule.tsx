import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Alert,
  Chip
} from '@mui/material';
import {
  CallReceived as CollectIcon,
  Payment as PayoutIcon,
  ReceiptLong as ReceiptIcon
} from '@mui/icons-material';
import { AccountsService, CustomerService, SupplierService } from '../../services/api';

const AccountsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  // Data Lists
  const [receivables, setReceivables] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Dialog State
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState<'COLLECT' | 'PAY'>('COLLECT');
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // Payment Form fields
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAccountsData();
  }, [activeTab]);

  const fetchAccountsData = async () => {
    try {
      // Always fetch both customers and suppliers to populate the global totals at the top
      const [custs, sups] = await Promise.all([
        CustomerService.getAll(),
        SupplierService.getAll()
      ]);
      
      setReceivables(custs.filter((c: any) => c.outstandingBalance > 0));
      setPayables(sups.filter((s: any) => s.outstandingBalance > 0));

      if (activeTab === 2) {
        // Fetch Payment History
        const payLogs = await AccountsService.getAllPayments();
        setPayments(payLogs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPaymentModal = (type: 'COLLECT' | 'PAY', entity: any) => {
    setModalType(type);
    setSelectedEntity(entity);
    setAmount('');
    setPaymentMode('CASH');
    setReferenceNumber('');
    setError(null);
    setSuccess(null);
    setOpenModal(true);
  };

  const handleSavePayment = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid positive payment amount');
      return;
    }

    const payload = {
      entityId: selectedEntity.id,
      amount: Number(amount),
      paymentMode,
      referenceNumber
    };

    try {
      setError(null);
      if (modalType === 'COLLECT') {
        await AccountsService.recordCollection(payload);
        setSuccess('Collection recorded successfully!');
      } else {
        await AccountsService.recordPayout(payload);
        setSuccess('Payout recorded successfully!');
      }
      
      // Refresh list
      setTimeout(() => {
        setOpenModal(false);
        fetchAccountsData();
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred while saving transaction');
    }
  };

  // Quick sums for dashboard/summary cards
  const calculateTotalReceivables = () => {
    return receivables.reduce((sum, item) => sum + item.outstandingBalance, 0);
  };

  const calculateTotalPayables = () => {
    return payables.reduce((sum, item) => sum + item.outstandingBalance, 0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Accounts Ledger (Cashflow)</Typography>
        <Typography variant="body2" color="text.secondary">Record collections, manage payouts, and track balances due for customer invoices or supplier bills.</Typography>
      </Box>

      {/* Overview Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3, mb: 4 }}>
        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
          <Card sx={{ borderLeft: '5px solid', borderColor: 'warning.main' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Total Customer Receivables</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'warning.main' }}>
                Rs. {calculateTotalReceivables() || '0.00'}
              </Typography>
              <Typography variant="caption" color="text.secondary">Amount owed to you by customers</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
          <Card sx={{ borderLeft: '5px solid', borderColor: 'error.main' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Total Supplier Payables</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'error.main' }}>
                Rs. {calculateTotalPayables() || '0.00'}
              </Typography>
              <Typography variant="caption" color="text.secondary">Amount you owe to suppliers</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab label="Collect Receivables" icon={<CollectIcon />} iconPosition="start" />
        <Tab label="Settle Payables" icon={<PayoutIcon />} iconPosition="start" />
        <Tab label="Recent Transactions Log" icon={<ReceiptIcon />} iconPosition="start" />
      </Tabs>

      {/* Tab 0: Collect Receivables */}
      {activeTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Outstanding Balance</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receivables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    No pending receivables. All customer payments are cleared!
                  </TableCell>
                </TableRow>
              ) : (
                receivables.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                    <TableCell>{item.mobile || 'N/A'}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'warning.main' }}>Rs. {item.outstandingBalance}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        onClick={() => handleOpenPaymentModal('COLLECT', item)}
                      >
                        Collect Cash
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab 1: Settle Payables */}
      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>Supplier Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Outstanding Balance</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    No pending payables. All supplier accounts are cleared!
                  </TableCell>
                </TableRow>
              ) : (
                payables.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                    <TableCell>{item.mobile || 'N/A'}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'error.main' }}>Rs. {item.outstandingBalance}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleOpenPaymentModal('PAY', item)}
                      >
                        Pay Supplier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab 2: General Log of Collections & Payouts */}
      {activeTab === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>Date/Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Party Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payment Mode</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    No cash collection/payout transactions registered.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((pay) => (
                  <TableRow key={pay.id}>
                    <TableCell>{new Date(pay.paymentDate).toLocaleString()}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{pay.entityName}</TableCell>
                    <TableCell>
                      <Chip
                        label={pay.paymentType === 'RECEIVABLE' ? 'COLLECTION' : 'PAYOUT'}
                        size="small"
                        color={pay.paymentType === 'RECEIVABLE' ? 'success' : 'error'}
                        sx={{ height: 20, fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Rs. {pay.amount}</TableCell>
                    <TableCell>{pay.paymentMode}</TableCell>
                    <TableCell>{pay.referenceNumber || 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Payment Collector Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {modalType === 'COLLECT' ? 'Collect Payment' : 'Record Payout'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Recording transaction for: <strong>{selectedEntity?.name}</strong>
              <br />
              Current Outstanding Balance: <strong>Rs. {selectedEntity?.outstandingBalance}</strong>
            </Typography>

            <TextField
              label="Amount Paid (Rs.)"
              type="number"
              fullWidth
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <FormControl fullWidth variant="outlined">
              <InputLabel>Payment Mode</InputLabel>
              <Select
                label="Payment Mode"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <MenuItem value="CASH">CASH</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="BANK_TRANSFER">BANK TRANSFER</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Reference / Transaction Number (Optional)"
              fullWidth
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" color={modalType === 'COLLECT' ? 'warning' : 'error'} onClick={handleSavePayment}>
            {modalType === 'COLLECT' ? 'Record Collection' : 'Record Payout'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default AccountsModule;
