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
  PointOfSale as PointOfSaleIcon,
  WarningAmberRounded as WarningIcon
} from '@mui/icons-material';
import { SaleService, CustomerService, ProductService } from '../../services/api';
import { useAppState } from '../../context/AppState';

const SalesModule: React.FC = () => {
  const { user } = useAppState();
  const getRoleName = (r: any): string =>
    typeof r === 'string' ? r : (r?.name?.toString?.() ?? '');

  const userRoles: string[] = (user?.roles ?? []).map(getRoleName);
  const isAdmin         = userRoles.includes('ROLE_ADMIN');
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
  const [sales, setSales] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [listError, setListError] = useState<string | null>(null);

  // Form Selections Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [discount, setDiscount] = useState<number>(0);
  const [gst, setGst] = useState<number>(0);
  const [transportCharges, setTransportCharges] = useState<number>(0);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverNumber, setDriverNumber] = useState('');
  const [items, setItems] = useState<any[]>([{ productId: '', unit: '', quantity: 1, sellingPrice: 0, amount: 0, maxStock: 0 }]);
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
      fetchSales();
    } else {
      fetchFormOptions();
    }
  }, [activeTab, page, startDate, endDate]);

  const handleTabChange = (_: React.SyntheticEvent, val: number) => {
    setActiveTab(val);
    // Clear errors when switching tabs
    setFormError(null);
    setFormSuccess(null);
    setListError(null);
  };

  const fetchSales = async () => {
    setListError(null);
    try {
      const res = await SaleService.getPaginated(startDate, endDate, page - 1, pageSize, 'id', 'desc');
      setSales(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
      setListError('Failed to fetch sales invoices');
    }
  };

  const fetchFormOptions = async () => {
    try {
      const custData = await CustomerService.getAll();
      setCustomers(custData);
      const prodData = await ProductService.getAll();
      setProducts(prodData.filter((p: any) => p.status === 'ACTIVE'));
    } catch (err) {
      console.error(err);
    }
  };

  // Form calculations
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() - discount + gst + transportCharges;
  };

  // Row operations
  const handleAddItemRow = () => {
    setItems([...items, { productId: '', unit: '', quantity: 1, sellingPrice: 0, amount: 0, maxStock: 0 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    const newItems = items.filter((_, i) => i !== idx);
    setItems(newItems.length > 0 ? newItems : [{ productId: '', unit: '', quantity: 1, sellingPrice: 0, amount: 0, maxStock: 0 }]);
  };

  const handleRowChange = (idx: number, field: string, value: any) => {
    const newItems = [...items];
    const item = newItems[idx];

    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      item.productId = value;
      item.unit = prod ? prod.unit : '';
      item.sellingPrice = prod ? prod.sellingPrice : 0;
      item.maxStock = prod ? prod.currentStock : 0;
    } else if (field === 'unit') {
      const prod = products.find(p => p.id === item.productId);
      item.unit = value;
      if (prod) {
        if (prod.looseUnit && prod.looseUnit === value) {
          const factor = prod.conversionFactor || 1;
          item.sellingPrice = Number((prod.sellingPrice / factor).toFixed(2));
          item.maxStock = prod.currentStock * factor;
        } else {
          item.sellingPrice = prod.sellingPrice;
          item.maxStock = prod.currentStock;
        }
      }
    } else if (field === 'quantity') {
      item.quantity = Number(value);
    } else if (field === 'sellingPrice') {
      item.sellingPrice = Number(value);
    }

    item.amount = item.quantity * item.sellingPrice;
    setItems(newItems);
  };

  const handleSaveSale = async () => {
    setFormError(null);
    setFormSuccess(null);

    if (!selectedCustomer) {
      setFormError('Customer is required');
      return;
    }

    // Check item validity
    const invalidItems = items.some(item => !item.productId || item.quantity <= 0 || item.sellingPrice <= 0);
    if (invalidItems) {
      setFormError('All items must have a product, with positive quantity and price');
      return;
    }

    // Verify stock levels locally before sending
    const stockIssues = items.some(item => item.quantity > item.maxStock);
    if (stockIssues) {
      setFormError('One or more items exceed current available stock limits.');
      return;
    }

    const payload = {
      customerId: selectedCustomer.id,
      saleDate,
      items: items.map((item) => ({
        productId: item.productId,
        unit: item.unit,
        quantity: String(item.quantity),
        sellingPrice: String(item.sellingPrice),
      })),
      discount: String(discount),
      gst: String(gst),
      transportCharges: String(transportCharges),
      vehicleNumber: vehicleNumber || null,
      driverName: driverName || null,
      driverNumber: driverNumber || null,
      paymentMode
    };

    try {
      const res = await SaleService.save(payload);
      setFormSuccess(`Sales Invoice created successfully! Invoice Number: ${res.invoiceNumber}`);
      // Clear form
      setSelectedCustomer(null);
      setItems([{ productId: '', unit: '', quantity: 1, sellingPrice: 0, amount: 0, maxStock: 0 }]);
      setDiscount(0);
      setGst(0);
      setTransportCharges(0);
      setVehicleNumber('');
      setDriverName('');
      setDriverNumber('');
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error occurred while saving sale transaction');
    }
  };

  const handleCancelSale = (id: number, invoiceNumber: string) => {
    openConfirm(
      'Cancel Sales Invoice',
      `Cancel sales invoice "${invoiceNumber}"?\n\nThis will restore product stocks and revert customer outstanding balances.`,
      async () => {
        try {
          await SaleService.cancel(id);
          fetchSales();
          showSnack('Sales invoice cancelled. Stock & balances reverted.', 'warning');
        } catch (err: any) {
          showSnack(err.response?.data?.message || 'Error cancelling sale', 'error');
        }
      },
      'warning',
      'Yes, Cancel Sale'
    );
  };

  const handleDeleteSale = (id: number, invoiceNumber: string, status: string) => {
    const isActive = status === 'ACTIVE';
    openConfirm(
      'Delete Sales Invoice Record',
      `Permanently delete sales invoice "${invoiceNumber}"?\n\n${isActive ? '⚠️ This is an ACTIVE invoice — stock will be reverted automatically before deletion.\n\n' : ''}This action CANNOT be undone.`,
      async () => {
        try {
          await SaleService.delete(id);
          fetchSales();
          showSnack(`Invoice "${invoiceNumber}" permanently deleted.`, 'success');
        } catch (err: any) {
          showSnack(err.response?.data?.message || 'Error deleting sale invoice', 'error');
        }
      },
      'error',
      'Yes, Permanently Delete'
    );
  };

  const handlePdfRedirect = async (id: number) => {
    try {
      await SaleService.downloadPdf(id);
    } catch (err: any) {
      console.error('PDF error:', err);
      showSnack('Could not open PDF. Please try again.', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Sales Management</Typography>
        <Typography variant="body2" color="text.secondary">Register customer invoices, deduct inventory stocks, and track client receivables.</Typography>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab label="Sales History" />
        <Tab label="New Invoice / Billing" icon={<PointOfSaleIcon />} iconPosition="start" />
      </Tabs>

      {/* Tab 0: Sales Invoices History list */}
      {activeTab === 0 && (
        <Box>
          {listError && <Alert severity="error" sx={{ mb: 2 }}>{listError}</Alert>}

          {/* Filters */}
          <Paper sx={{ p: 2.5, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Date Range Filters:</Typography>
            <TextField
              type="date"
              label="Start Date"
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            />
            <TextField
              type="date"
              label="End Date"
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            />
            {(startDate || endDate) && (
              <Button size="small" onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}>
                Clear Filters
              </Button>
            )}
          </Paper>

          {/* Sales List Table */}
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Invoice No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Grand Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Payment Mode</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      No sales invoices registered.
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id} sx={{ opacity: sale.status === 'CANCELLED' ? 0.6 : 1 }}>
                      <TableCell sx={{ fontWeight: 600 }}>{sale.invoiceNumber}</TableCell>
                      <TableCell>{sale.saleDate}</TableCell>
                      <TableCell>{sale.customer.name}</TableCell>
                      <TableCell>Rs. {sale.grandTotal}</TableCell>
                      <TableCell>{sale.paymentMode}</TableCell>
                      <TableCell>
                        <Chip
                          label={sale.status}
                          size="small"
                          color={sale.status === 'ACTIVE' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        {/* PDF */}
                        <IconButton color="primary" onClick={() => handlePdfRedirect(sale.id)} title="Download PDF Invoice" size="small">
                          <PdfIcon fontSize="small" />
                        </IconButton>
                        {/* Cancel — Admin & Manager, only if ACTIVE */}
                        {isManagerOrAdmin && sale.status === 'ACTIVE' && (
                          <IconButton
                            color="warning"
                            onClick={() => handleCancelSale(sale.id, sale.invoiceNumber)}
                            title="Cancel Invoice"
                            size="small"
                          >
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        )}
                        {/* Delete — Admin only */}
                        {isAdmin && (
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteSale(sale.id, sale.invoiceNumber, sale.status)}
                            title="Delete Invoice Record"
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
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, val) => setPage(val)}
              color="primary"
            />
          </Box>
        </Box>
      )}

      {/* Tab 1: New Billing Invoice Entry */}
      {activeTab === 1 && (
        <Box>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
            {/* Header info card */}
            <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 9' } }}>
              <Card sx={{ p: 1 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Customer & Billing Details</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, mb: 3 }}>
                    <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                      <Autocomplete
                        options={customers}
                        getOptionLabel={(option) => `${option.name} (${option.mobile || 'No Mobile'})`}
                        value={selectedCustomer}
                        onChange={(_, val) => setSelectedCustomer(val)}
                        renderInput={(params) => <TextField {...params} label="Select Customer" variant="outlined" />}
                      />
                    </Box>
                    <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                      <TextField
                        type="date"
                        label="Billing Date"
                        fullWidth
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
                      />
                    </Box>
                    <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
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
                          <MenuItem value="CREDIT">CREDIT (PAY LATER)</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>

                  {/* Vehicle / Transport Details */}
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Vehicle / Transport Details <Typography component="span" variant="caption" color="text.secondary">(Optional)</Typography></Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, mb: 3 }}>
                    <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                      <TextField
                        label="Vehicle Number"
                        fullWidth
                        placeholder="e.g. AP09AB1234"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                      />
                    </Box>
                    <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                      <TextField
                        label="Driver Name"
                        fullWidth
                        placeholder="e.g. Ramesh Kumar"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                      />
                    </Box>
                    <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                      <TextField
                        label="Driver Number"
                        fullWidth
                        placeholder="e.g. 9876543210"
                        value={driverNumber}
                        onChange={(e) => setDriverNumber(e.target.value)}
                      />
                    </Box>
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Product Basket</Typography>

                  {/* Items List Table */}
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                          <TableCell sx={{ fontWeight: 700, width: '30%' }}>Product</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: '15%' }}>Unit</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: '15%' }}>Quantity</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: '15%' }}>Selling Price (Rs.)</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: '15%' }}>Total Amount</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: '10%', textAlign: 'center' }}>Remove</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Select
                                value={item.productId}
                                onChange={(e) => handleRowChange(idx, 'productId', e.target.value)}
                                displayEmpty
                                fullWidth
                                variant="standard"
                                disableUnderline
                              >
                                <MenuItem value="" disabled>Select Product</MenuItem>
                                {products.map((p) => (
                                  <MenuItem key={p.id} value={p.id} disabled={p.currentStock <= 0}>
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
                              <TextField
                                type="number"
                                variant="standard"
                                value={item.quantity}
                                onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                                error={item.quantity > item.maxStock}
                                helperText={item.quantity > item.maxStock ? `Max Stock: ${item.maxStock.toFixed(2)}` : ''}
                                slotProps={{ htmlInput: { min: 0.001, step: 'any' } }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                variant="standard"
                                value={item.sellingPrice}
                                onChange={(e) => handleRowChange(idx, 'sellingPrice', e.target.value)}
                                slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              Rs. {item.amount.toFixed(2)}
                            </TableCell>
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

            {/* Invoicing calculations panel */}
            <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
              <Card sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Invoice Summary</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Rs. {calculateSubtotal().toFixed(2)}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                    <TextField
                      label="Discount (Rs.)"
                      type="number"
                      size="small"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                    />
                    <TextField
                      label="GST Tax (Rs.)"
                      type="number"
                      size="small"
                      value={gst}
                      onChange={(e) => setGst(Number(e.target.value))}
                    />
                    <TextField
                      label="Transport Charges (Rs.)"
                      type="number"
                      size="small"
                      value={transportCharges}
                      onChange={(e) => setTransportCharges(Number(e.target.value))}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Grand Total:</Typography>
                    <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 700 }}>
                      Rs. {calculateGrandTotal().toFixed(2)}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handleSaveSale}
                  >
                    Generate Sales Invoice
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      )}
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

export default SalesModule;
