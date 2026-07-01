import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Pagination,
  Chip,
  Alert,
  Divider,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  PictureAsPdf as PdfIcon,
  Block as BlockIcon,
  ShoppingCart as ShoppingCartIcon,
  WarningAmberRounded as WarningIcon
} from '@mui/icons-material';
import { PurchaseService, SupplierService, ProductService } from '../../services/api';
import { useAppState } from '../../context/AppState';

const PurchasesModule: React.FC = () => {
  const { user } = useAppState();
  const userRoles: string[] = user?.roles?.map((r: any) =>
    typeof r === 'string' ? r : r?.name || ''
  ) ?? [];
  const isAdmin          = userRoles.includes('ROLE_ADMIN');
  const isManagerOrAdmin = userRoles.some(r => ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(r));

  const getProductStockText = (p: any) => {
    if (!p.looseUnit || !p.conversionFactor || p.conversionFactor <= 0) {
      return `Stock: ${p.currentStock} ${p.unit}`;
    }
    const full = Math.floor(p.currentStock);
    const frac = p.currentStock - full;
    if (frac <= 0.0001) {
      return `Stock: ${full} ${p.unit}`;
    }
    const loose = Math.round(frac * p.conversionFactor * 1000) / 1000;
    return `Stock: ${full} ${p.unit} + ${loose} ${p.looseUnit}`;
  };

  const [activeTab, setActiveTab] = useState(0);

  // Listing State
  const [purchases, setPurchases] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [listError, setListError] = useState<string | null>(null);

  // Form Selections Data
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Form State
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [discount, setDiscount] = useState<number>(0);
  const [gst, setGst] = useState<number>(0);
  const [items, setItems] = useState<any[]>([{ productId: '', unit: '', quantity: 1, purchasePrice: 0, amount: 0 }]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

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

  useEffect(() => {
    if (activeTab === 0) {
      fetchPurchases();
    } else {
      fetchFormOptions();
    }
  }, [activeTab, page, startDate, endDate]);

  const fetchPurchases = async () => {
    setListError(null);
    try {
      const res = await PurchaseService.getPaginated(startDate, endDate, page - 1, pageSize, 'id', 'desc');
      setPurchases(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
      setListError('Failed to fetch purchase receipts');
    }
  };

  const fetchFormOptions = async () => {
    try {
      const supData = await SupplierService.getAll();
      setSuppliers(supData);
      const prodData = await ProductService.getAll();
      setProducts(prodData.filter((p: any) => p.status === 'ACTIVE'));
    } catch (err) {
      console.error(err);
    }
  };

  // Form calculations
  const calculateSubtotal = () => items.reduce((sum, item) => sum + item.amount, 0);
  const calculateGrandTotal = () => calculateSubtotal() - discount + gst;

  // Item rows handling
  const handleAddItemRow = () => {
    setItems([...items, { productId: '', unit: '', quantity: 1, purchasePrice: 0, amount: 0 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    const newItems = items.filter((_, i) => i !== idx);
    setItems(newItems.length > 0 ? newItems : [{ productId: '', unit: '', quantity: 1, purchasePrice: 0, amount: 0 }]);
  };

  const handleRowChange = (idx: number, field: string, value: any) => {
    const newItems = [...items];
    const item = newItems[idx];
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      item.productId = value;
      item.unit = prod ? prod.unit : '';
      item.purchasePrice = prod ? prod.purchasePrice : 0;
    } else if (field === 'unit') {
      const prod = products.find(p => p.id === item.productId);
      item.unit = value;
      if (prod) {
        if (prod.looseUnit && prod.looseUnit === value) {
          const factor = prod.conversionFactor || 1;
          item.purchasePrice = Number((prod.purchasePrice / factor).toFixed(2));
        } else {
          item.purchasePrice = prod.purchasePrice;
        }
      }
    } else if (field === 'quantity') {
      item.quantity = Number(value);
    } else if (field === 'purchasePrice') {
      item.purchasePrice = Number(value);
    }
    item.amount = item.quantity * item.purchasePrice;
    setItems(newItems);
  };

  const handleSavePurchase = async () => {
    setFormError(null);
    setFormSuccess(null);
    if (!selectedSupplier) { setFormError('Supplier is required'); return; }
    const invalidItems = items.some(item => !item.productId || item.quantity <= 0 || item.purchasePrice <= 0);
    if (invalidItems) { setFormError('All items must have a product selected, with positive quantity and price'); return; }
    const payload = { supplierId: selectedSupplier.id, purchaseDate, items, discount, gst, paymentMode };
    try {
      const res = await PurchaseService.save(payload);
      setFormSuccess(`Purchase recorded successfully! Bill Number: ${res.purchaseNumber}`);
      setSelectedSupplier(null);
      setItems([{ productId: '', unit: '', quantity: 1, purchasePrice: 0, amount: 0 }]);
      setDiscount(0);
      setGst(0);
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error occurred while saving purchase');
    }
  };

  const handleCancelPurchase = (id: number, purchaseNumber: string) => {
    openConfirm(
      'Cancel Purchase',
      `Cancel purchase "${purchaseNumber}"?\n\nThis will roll back product stocks and supplier outstanding balances.`,
      async () => {
        try {
          await PurchaseService.cancel(id);
          fetchPurchases();
          showSnack('Purchase cancelled. Stock & balances reverted.', 'warning');
        } catch (err: any) {
          showSnack(err.response?.data?.message || 'Error cancelling purchase', 'error');
        }
      },
      'warning',
      'Yes, Cancel Purchase'
    );
  };

  const handleDeletePurchase = (id: number, purchaseNumber: string, status: string) => {
    const isActive = status === 'ACTIVE';
    openConfirm(
      'Delete Purchase Record',
      `Permanently delete purchase "${purchaseNumber}"?\n\n${isActive ? '⚠️ This is an ACTIVE purchase — stock will be reversed automatically before deletion.\n\n' : ''}This action CANNOT be undone.`,
      async () => {
        try {
          await PurchaseService.delete(id);
          fetchPurchases();
          showSnack(`Purchase "${purchaseNumber}" permanently deleted.`, 'success');
        } catch (err: any) {
          showSnack(err.response?.data?.message || 'Error deleting purchase', 'error');
        }
      },
      'error',
      'Yes, Permanently Delete'
    );
  };

  const handlePdfRedirect = async (id: number) => {
    try {
      await PurchaseService.downloadPdf(id);
    } catch (err: any) {
      showSnack('Could not open PDF. Please try again.', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
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

      {/* Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Purchase Management</Typography>
        <Typography variant="body2" color="text.secondary">Register purchases from suppliers, add products to stock, and track payable receipts.</Typography>
      </Box>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab label="Purchase History" />
        <Tab label="New Purchase Entry" icon={<ShoppingCartIcon />} iconPosition="start" />
      </Tabs>

      {/* Tab 0: History */}
      {activeTab === 0 && (
        <Box>
          {listError && <Alert severity="error" sx={{ mb: 2 }}>{listError}</Alert>}

          {/* Filters */}
          <Paper sx={{ p: 2.5, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Date Filters:</Typography>
            <TextField type="date" label="Start Date" size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
            <TextField type="date" label="End Date" size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
            {(startDate || endDate) && (
              <Button size="small" onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}>
                Clear Filters
              </Button>
            )}
          </Paper>

          {/* List Table */}
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Bill No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Grand Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>No purchases found.</TableCell>
                  </TableRow>
                ) : (
                  purchases.map((purch) => (
                    <TableRow key={purch.id} sx={{ opacity: purch.status === 'CANCELLED' ? 0.6 : 1 }}>
                      <TableCell sx={{ fontWeight: 600 }}>{purch.purchaseNumber}</TableCell>
                      <TableCell>{purch.purchaseDate}</TableCell>
                      <TableCell>{purch.supplier.name}</TableCell>
                      <TableCell>Rs. {purch.grandTotal}</TableCell>
                      <TableCell>{purch.paymentMode}</TableCell>
                      <TableCell>
                        <Chip
                          label={purch.status}
                          size="small"
                          color={purch.status === 'ACTIVE' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        {/* PDF */}
                        <IconButton color="primary" onClick={() => handlePdfRedirect(purch.id)} title="Download PDF" size="small">
                          <PdfIcon fontSize="small" />
                        </IconButton>
                        {/* Cancel — Admin & Manager, only if ACTIVE */}
                        {isManagerOrAdmin && purch.status === 'ACTIVE' && (
                          <IconButton
                            color="warning"
                            onClick={() => handleCancelPurchase(purch.id, purch.purchaseNumber)}
                            title="Cancel Purchase"
                            size="small"
                          >
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        )}
                        {/* Delete — Admin only */}
                        {isAdmin && (
                          <IconButton
                            color="error"
                            onClick={() => handleDeletePurchase(purch.id, purch.purchaseNumber, purch.status)}
                            title="Delete Purchase Record"
                            size="small"
                          >
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
            <Pagination count={totalPages} page={page} onChange={(_, val) => setPage(val)} color="primary" />
          </Box>
        </Box>
      )}

      {/* Tab 1: New Purchase Entry Form */}
      {activeTab === 1 && (
        <Box>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 1fr' }, gap: 3 }}>
            {/* Left Column */}
            <Box>
              <Card sx={{ p: 1 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Invoice Details</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
                    <Autocomplete
                      options={suppliers}
                      getOptionLabel={(option) => `${option.name} (${option.mobile || 'No Mobile'})`}
                      value={selectedSupplier}
                      onChange={(_, val) => setSelectedSupplier(val)}
                      renderInput={(params) => <TextField {...params} label="Select Supplier" variant="outlined" />}
                    />
                    <TextField type="date" label="Purchase Date" fullWidth
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Payment Mode</InputLabel>
                      <Select label="Payment Mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                        <MenuItem value="CASH">CASH</MenuItem>
                        <MenuItem value="UPI">UPI</MenuItem>
                        <MenuItem value="BANK_TRANSFER">BANK TRANSFER</MenuItem>
                        <MenuItem value="CREDIT">CREDIT (PAY LATER)</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Item Details</Typography>

                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                          <TableCell sx={{ fontWeight: 700, width: '30%' }}>Product</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: '15%' }}>Unit</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: '15%' }}>Quantity</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: '15%' }}>Unit Cost (Rs.)</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: '15%' }}>Total Amount</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: '10%', textAlign: 'center' }}>Remove</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Select value={item.productId} onChange={(e) => handleRowChange(idx, 'productId', e.target.value)}
                                displayEmpty fullWidth variant="standard" disableUnderline>
                                <MenuItem value="" disabled>Select Product</MenuItem>
                                {products.map((p) => (
                                  <MenuItem key={p.id} value={p.id}>
                                    {p.name} ({p.productCode}) - {getProductStockText(p)}
                                  </MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const prod = products.find(p => p.id === item.productId);
                                const units = prod ? [prod.unit] : [];
                                if (prod?.looseUnit) {
                                  units.push(prod.looseUnit);
                                }
                                return (
                                  <Select
                                    value={item.unit}
                                    onChange={(e) => handleRowChange(idx, 'unit', e.target.value)}
                                    disabled={!item.productId}
                                    variant="standard"
                                    disableUnderline
                                    fullWidth
                                  >
                                    {units.map((u) => (
                                      <MenuItem key={u} value={u}>{u}</MenuItem>
                                    ))}
                                  </Select>
                                );
                              })()}
                            </TableCell>
                            <TableCell>
                              <TextField type="number" variant="standard"
                                value={item.quantity} onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                                slotProps={{ htmlInput: { min: 0.001, step: 'any' } }} />
                            </TableCell>
                            <TableCell>
                              <TextField type="number" variant="standard"
                                value={item.purchasePrice} onChange={(e) => handleRowChange(idx, 'purchasePrice', e.target.value)}
                                slotProps={{ htmlInput: { min: 0, step: '0.01' } }} />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Rs. {item.amount.toFixed(2)}</TableCell>
                            <TableCell align="center">
                              <IconButton color="error" onClick={() => handleRemoveItemRow(idx)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddItemRow} sx={{ mb: 2 }}>
                    Add Item Row
                  </Button>
                </CardContent>
              </Card>
            </Box>

            {/* Right Column: Totals */}
            <Box>
              <Card sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Bill Summary</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Rs. {calculateSubtotal().toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                    <TextField label="Discount Amount (Rs.)" type="number" size="small"
                      value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
                    <TextField label="GST Tax Amount (Rs.)" type="number" size="small"
                      value={gst} onChange={(e) => setGst(Number(e.target.value))} />
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Grand Total:</Typography>
                    <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 700 }}>
                      Rs. {calculateGrandTotal().toFixed(2)}
                    </Typography>
                  </Box>
                  <Button variant="contained" color="primary" fullWidth size="large" onClick={handleSavePurchase}>
                    Save Purchase Receipt
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PurchasesModule;
