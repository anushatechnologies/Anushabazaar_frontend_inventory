import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
  Pagination,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  WarningAmberRounded as WarningIcon,
  Inventory2 as StockIcon,
  Add as PlusIcon,
  Remove as MinusIcon
} from '@mui/icons-material';
import { ProductService, CategoryService } from '../../services/api';
import { StockService } from '../../services/api';
import { useAppState } from '../../context/AppState';

const ProductsModule: React.FC = () => {
  const { user } = useAppState();

  // Robust role check — handles plain strings OR objects {name:"ROLE_ADMIN"}
  const getRoleName = (r: any): string =>
    typeof r === 'string' ? r : (r?.name?.toString?.() ?? '');

  const userRoles: string[] = (user?.roles ?? []).map(getRoleName);
  const isAdmin         = userRoles.includes('ROLE_ADMIN');
  const isManagerOrAdmin = userRoles.some(r => ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(r));

  const formatStock = (stock: number, mainUnit: string, looseUnit?: string, factor?: number) => {
    if (!looseUnit || !factor || factor <= 0) {
      return `${stock} ${mainUnit}`;
    }
    const fullUnits = Math.floor(stock);
    const fraction = stock - fullUnits;
    if (fraction <= 0.0001) {
      return `${fullUnits} ${mainUnit}`;
    }
    const looseQty = Math.round(fraction * factor * 1000) / 1000;
    return `${fullUnits} ${mainUnit} + ${looseQty} ${looseUnit}`;
  };

  // States
  const [products, setProducts]     = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize]                  = useState(10);
  const [error, setError]           = useState<string | null>(null);
  // Hide INACTIVE products by default; admin can toggle to see them
  const [showInactive, setShowInactive] = useState(false);

  // ── Custom confirm dialog ──────────────────────────────────────────────────
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMsg, setConfirmMsg]     = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const openConfirm = (title: string, msg: string, onOk: () => void) => {
    setConfirmTitle(title);
    setConfirmMsg(msg);
    setConfirmAction(() => onOk);
    setConfirmOpen(true);
  };

  const handleConfirmOk = () => {
    setConfirmOpen(false);
    confirmAction?.();
  };

  // ── Info / success snackbar (replaces alert()) ────────────────────────────
  const [infoOpen, setInfoOpen]   = useState(false);
  const [infoMsg, setInfoMsg]     = useState('');
  const [infoSeverity, setInfoSeverity] = useState<'success'|'warning'|'error'>('success');

  const showInfo = (msg: string, severity: 'success'|'warning'|'error' = 'success') => {
    setInfoMsg(msg);
    setInfoSeverity(severity);
    setInfoOpen(true);
  };

  // Dialogs
  const [openProductDlg, setOpenProductDlg]     = useState(false);
  const [selectedProduct, setSelectedProduct]   = useState<any | null>(null);

  // ── Stock Adjustment Dialog ────────────────────────────────────────────────
  const [openStockDlg, setOpenStockDlg]         = useState(false);
  const [stockProduct, setStockProduct]         = useState<any | null>(null);
  const [adjustQty, setAdjustQty]               = useState<number>(0);
  const [adjustMode, setAdjustMode]             = useState<'add' | 'subtract'>('add');
  const [adjustNotes, setAdjustNotes]           = useState('');
  const [adjusting, setAdjusting]               = useState(false);
  const [stockHistory, setStockHistory]         = useState<any[]>([]);

  const handleOpenStockDlg = async (prod: any) => {
    setStockProduct(prod);
    setAdjustQty(0);
    setAdjustMode('add');
    setAdjustNotes('');
    setOpenStockDlg(true);
    // Load movement history for this product
    try {
      const history = await StockService.getProductMovements(prod.id);
      setStockHistory(history);
    } catch (e) {
      setStockHistory([]);
    }
  };

  const handleStockAdjust = async () => {
    if (!adjustQty || adjustQty <= 0) {
      setError('Please enter a quantity greater than 0');
      return;
    }
    setAdjusting(true);
    try {
      const finalQty = adjustMode === 'add' ? adjustQty : -adjustQty;
      await StockService.adjust({
        productId: stockProduct.id,
        quantity: finalQty,
        notes: adjustNotes || (adjustMode === 'add' ? 'Manual stock addition' : 'Manual stock reduction')
      });
      showInfo(
        `Stock ${adjustMode === 'add' ? 'added' : 'removed'}: ${adjustQty} ${stockProduct.unit}. New stock updated.`,
        'success'
      );
      setOpenStockDlg(false);
      fetchProducts(); // refresh table
    } catch (err: any) {
      setError(err.response?.data?.message || 'Stock adjustment failed');
    } finally {
      setAdjusting(false);
    }
  };

  const [openCategoryDlg, setOpenCategoryDlg] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [catError, setCatError]     = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page, search]);

  const fetchProducts = async () => {
    setError(null);
    try {
      const res = await ProductService.getPaginated(search, page - 1, pageSize, 'id', 'asc');
      setProducts(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve product list');
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await CategoryService.getAll();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Products CRUD ──────────────────────────────────────────────────────────
  const handleOpenProduct = (product: any | null) => {
    setSelectedProduct(product);
    if (product) {
      setValue('productCode', product.productCode);
      setValue('name', product.name);
      setValue('categoryId', product.category.id);
      setValue('unit', product.unit);
      setValue('looseUnit', product.looseUnit || '');
      setValue('conversionFactor', product.conversionFactor || '');
      setValue('purchasePrice', product.purchasePrice);
      setValue('sellingPrice', product.sellingPrice);
      setValue('minimumStockAlert', product.minimumStockAlert);
      setValue('status', product.status);
    } else {
      reset({
        productCode: '',
        name: '',
        categoryId: '',
        unit: 'Pcs',
        looseUnit: '',
        conversionFactor: '',
        purchasePrice: '',
        sellingPrice: '',
        minimumStockAlert: 20,
        status: 'ACTIVE'
      });
    }
    setOpenProductDlg(true);
  };

  const handleProductSubmit = async (data: any) => {
    try {
      if (selectedProduct) {
        await ProductService.update(selectedProduct.id, data);
      } else {
        await ProductService.create(data);
      }
      setOpenProductDlg(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred while saving product');
    }
  };

  const handleDeleteProduct = (id: number, name: string) => {
    openConfirm(
      'Delete Product',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      async () => {
        try {
          const res = await ProductService.delete(id);
          if (res?.type === 'soft_delete') {
            showInfo(res.message || 'Product moved to INACTIVE.', 'warning');
          } else {
            showInfo('Product deleted successfully.', 'success');
          }
          fetchProducts();
        } catch (err: any) {
          console.error(err);
          setError(err.response?.data?.message || 'Error deleting product');
        }
      }
    );
  };

  // ── Categories CRUD ────────────────────────────────────────────────────────
  const handleAddCategory = async () => {
    if (!newCatName) {
      setCatError('Category name is required');
      return;
    }
    try {
      setCatError(null);
      await CategoryService.create({ name: newCatName, description: newCatDesc });
      setNewCatName('');
      setNewCatDesc('');
      fetchCategories();
    } catch (err: any) {
      setCatError(err.response?.data?.message || 'Error saving category');
    }
  };

  const handleDeleteCategory = (id: number, name: string) => {
    openConfirm(
      'Delete Category',
      `Delete category "${name}"? Products in this category may be affected.`,
      async () => {
        try {
          await CategoryService.delete(id);
          fetchCategories();
        } catch (err: any) {
          setError(err.response?.data?.message || 'Cannot delete category (it may be in use)');
        }
      }
    );
  };

  // ── Row colour helper ──────────────────────────────────────────────────────
  // Out-of-stock  (stock = 0)    → red background
  // Low stock     (stock < 20)   → orange background
  // Normal        (stock >= 20)  → white / default
  const LOW_STOCK_THRESHOLD = 20;

  const getRowStyle = (prod: any) => {
    const stock = prod.currentStock;

    if (stock <= 0) {
      // Out of stock — red
      return {
        backgroundColor: '#fee2e2', // red-100
        '& td': { color: '#991b1b' }  // red-800 text
      };
    }
    if (stock < LOW_STOCK_THRESHOLD) {
      // Low stock — orange
      return {
        backgroundColor: '#fff7ed', // orange-50
        '& td': { color: '#92400e' }  // orange-900 text
      };
    }
    return { opacity: prod.status === 'INACTIVE' ? 0.6 : 1 };
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Product Catalog &amp; Inventory</Typography>
          <Typography variant="body2" color="text.secondary">
            Maintain products, unit prices, category definitions, and track current stock.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Toggle inactive products */}
          {isAdmin && (
            <Button
              variant={showInactive ? 'contained' : 'outlined'}
              color={showInactive ? 'warning' : 'inherit'}
              size="small"
              onClick={() => setShowInactive(v => !v)}
              sx={{ fontSize: 12, whiteSpace: 'nowrap' }}
            >
              {showInactive ? 'Hide Inactive' : 'Show Inactive'}
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={() => setOpenCategoryDlg(true)}
          >
            Categories
          </Button>
          {isManagerOrAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenProduct(null)}
            >
              Add Product
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: '#fee2e2', border: '1px solid #fca5a5' }} />
          <Typography variant="caption" color="text.secondary">Out of Stock</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: '#fff7ed', border: '1px solid #fdba74' }} />
          <Typography variant="caption" color="text.secondary">Low Stock</Typography>
        </Box>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="Search by Code or Name..."
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

      {/* Products Table */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Product Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Purchase Price</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Selling Price</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Current Stock</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              {isManagerOrAdmin && (
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products
                .filter(p => showInactive || p.status !== 'INACTIVE')
                .map((prod) => {
                  const isOutOfStock = prod.currentStock <= 0;
                  const isLowStock   = !isOutOfStock && prod.currentStock < LOW_STOCK_THRESHOLD;

                return (
                  <TableRow key={prod.id} sx={getRowStyle(prod)}>
                    <TableCell sx={{ fontWeight: 600 }}>{prod.productCode}</TableCell>
                    <TableCell>{prod.name}</TableCell>
                    <TableCell>{prod.category.name}</TableCell>
                    <TableCell>{prod.unit}</TableCell>
                    <TableCell>Rs. {prod.purchasePrice}</TableCell>
                    <TableCell>Rs. {prod.sellingPrice}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {formatStock(prod.currentStock, prod.unit, prod.looseUnit, prod.conversionFactor)}
                        </Typography>
                        {isOutOfStock && (
                          <Chip
                            label="Out of Stock"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: 10,
                              bgcolor: '#dc2626',
                              color: '#fff',
                              fontWeight: 700
                            }}
                          />
                        )}
                        {isLowStock && (
                          <Chip
                            label="Low Stock"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: 10,
                              bgcolor: '#f97316',
                              color: '#fff',
                              fontWeight: 700
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={prod.status}
                        size="small"
                        color={prod.status === 'ACTIVE' ? 'success' : 'default'}
                      />
                    </TableCell>
                    {isManagerOrAdmin && (
                      <TableCell align="center">
                        {/* Stock Adjust — visible to Admin & Manager */}
                        <IconButton
                          color="success"
                          onClick={() => handleOpenStockDlg(prod)}
                          size="small"
                          title="Adjust Stock"
                        >
                          <StockIcon fontSize="small" />
                        </IconButton>
                        {/* Edit — visible to Admin & Manager */}
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenProduct(prod)}
                          size="small"
                          title="Edit Product"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {/* Delete — visible to Admin only */}
                        {isAdmin && (
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            size="small"
                            title="Delete Product"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
            {/* Show message when all are filtered out */}
            {products.length > 0 && products.filter(p => showInactive || p.status !== 'INACTIVE').length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  All products are inactive. Click "Show Inactive" to view them.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, val) => setPage(val)}
          color="primary"
        />
      </Box>

      {/* ── Stock Adjustment Dialog ──────────────────────────────────────── */}
      <Dialog open={openStockDlg} onClose={() => setOpenStockDlg(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <StockIcon color="success" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Adjust Stock
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stockProduct?.name} ({stockProduct?.productCode})
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Current stock banner */}
          {stockProduct && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 2, mb: 3,
              p: 2, borderRadius: 2,
              bgcolor: stockProduct.currentStock <= 0 ? '#fee2e2'
                : stockProduct.currentStock < 20 ? '#fff7ed' : '#f0fdf4',
              border: '1px solid',
              borderColor: stockProduct.currentStock <= 0 ? '#fca5a5'
                : stockProduct.currentStock < 20 ? '#fdba74' : '#86efac'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Current Stock:</Typography>
              <Typography variant="h5" sx={{
                fontWeight: 800,
                color: stockProduct.currentStock <= 0 ? '#dc2626'
                  : stockProduct.currentStock < 20 ? '#ea580c' : '#16a34a'
              }}>
                {formatStock(stockProduct.currentStock, stockProduct.unit, stockProduct.looseUnit, stockProduct.conversionFactor)}
              </Typography>
              {stockProduct.currentStock <= 0 && (
                <Chip label="Out of Stock" size="small" sx={{ bgcolor: '#dc2626', color: '#fff', fontWeight: 700 }} />
              )}
              {stockProduct.currentStock > 0 && stockProduct.currentStock < 20 && (
                <Chip label="Low Stock" size="small" sx={{ bgcolor: '#f97316', color: '#fff', fontWeight: 700 }} />
              )}
            </Box>
          )}

          {/* Add / Subtract toggle */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant={adjustMode === 'add' ? 'contained' : 'outlined'}
              color="success"
              startIcon={<PlusIcon />}
              fullWidth
              onClick={() => setAdjustMode('add')}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Add Stock (+)
            </Button>
            <Button
              variant={adjustMode === 'subtract' ? 'contained' : 'outlined'}
              color="error"
              startIcon={<MinusIcon />}
              fullWidth
              onClick={() => setAdjustMode('subtract')}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Remove Stock (−)
            </Button>
          </Box>

          {/* Quantity input */}
          <TextField
            label={`Quantity to ${adjustMode === 'add' ? 'Add' : 'Remove'} (${stockProduct?.unit})`}
            type="number"
            fullWidth
            variant="outlined"
            value={adjustQty || ''}
            onChange={(e) => setAdjustQty(Math.abs(Number(e.target.value)))}
            slotProps={{ htmlInput: { min: 1 } }}
            sx={{ mb: 2 }}
            color={adjustMode === 'add' ? 'success' : 'error'}
          />

          {/* Notes */}
          <TextField
            label="Reason / Notes (optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={adjustNotes}
            onChange={(e) => setAdjustNotes(e.target.value)}
            placeholder="e.g. Initial stock entry, Damage loss, Physical count correction..."
            sx={{ mb: 2 }}
          />

          {/* Preview */}
          {adjustQty > 0 && stockProduct && (
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                After adjustment: <strong style={{
                  color: adjustMode === 'add' ? '#16a34a' : '#dc2626',
                  fontSize: 16
                }}>
                  {adjustMode === 'add'
                    ? stockProduct.currentStock + adjustQty
                    : Math.max(0, stockProduct.currentStock - adjustQty)
                  } {stockProduct.unit}
                </strong>
              </Typography>
            </Box>
          )}

          {/* Movement history */}
          {stockHistory.length > 0 && (
            <>
              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Recent Movement History
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 160, overflow: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }} align="right">Qty</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stockHistory.slice(0, 10).map((mv: any) => (
                      <TableRow key={mv.id}>
                        <TableCell sx={{ fontSize: 11 }}>
                          {new Date(mv.movementDate).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={mv.type}
                            size="small"
                            sx={{
                              height: 18, fontSize: 10,
                              bgcolor: mv.type === 'PURCHASE' ? '#dcfce7'
                                : mv.type === 'SALE' ? '#fee2e2' : '#dbeafe',
                              color: mv.type === 'PURCHASE' ? '#166534'
                                : mv.type === 'SALE' ? '#991b1b' : '#1e40af'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{
                          fontWeight: 700, fontSize: 12,
                          color: mv.quantity > 0 ? '#16a34a' : '#dc2626'
                        }}>
                          {mv.quantity > 0 ? '+' : ''}{mv.quantity}
                        </TableCell>
                        <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>
                          {mv.notes || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setOpenStockDlg(false)} fullWidth>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={adjustMode === 'add' ? 'success' : 'error'}
            onClick={handleStockAdjust}
            disabled={adjusting || !adjustQty || adjustQty <= 0}
            fullWidth
            sx={{ fontWeight: 700 }}
          >
            {adjusting ? 'Saving...' : adjustMode === 'add' ? `Add ${adjustQty || 0} ${stockProduct?.unit || ''}` : `Remove ${adjustQty || 0} ${stockProduct?.unit || ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Product Add/Edit Dialog ────────────────────────────────────────── */}
      <Dialog open={openProductDlg} onClose={() => setOpenProductDlg(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pb: 1.5 }}>
          {selectedProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <form onSubmit={handleSubmit(handleProductSubmit)}>
          <DialogContent>
            {/* Current Stock — read-only info banner shown only when editing */}
            {selectedProduct && (
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 2,
                mb: 2, mt: 0.5, p: 1.5, borderRadius: 2,
                bgcolor: selectedProduct.currentStock <= 0
                  ? '#fee2e2'
                  : selectedProduct.currentStock < 20
                  ? '#fff7ed'
                  : '#f0fdf4',
                border: '1px solid',
                borderColor: selectedProduct.currentStock <= 0
                  ? '#fca5a5'
                  : selectedProduct.currentStock < 20
                  ? '#fdba74'
                  : '#86efac'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Current Stock:
                </Typography>
                <Typography variant="h6" sx={{
                  fontWeight: 800,
                  color: selectedProduct.currentStock <= 0
                    ? '#dc2626'
                    : selectedProduct.currentStock < 20
                    ? '#ea580c'
                    : '#16a34a'
                }}>
                  {formatStock(selectedProduct.currentStock, selectedProduct.unit, selectedProduct.looseUnit, selectedProduct.conversionFactor)}
                </Typography>
                {selectedProduct.currentStock <= 0 && (
                  <Chip label="Out of Stock" size="small" sx={{ bgcolor: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 11 }} />
                )}
                {selectedProduct.currentStock > 0 && selectedProduct.currentStock < 20 && (
                  <Chip label="Low Stock" size="small" sx={{ bgcolor: '#f97316', color: '#fff', fontWeight: 700, fontSize: 11 }} />
                )}
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                  (Stock updated via Purchases)
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
              <TextField
                label="Product Code"
                fullWidth
                variant="outlined"
                {...register('productCode', { required: 'Code is required' })}
                error={!!errors.productCode}
                helperText={errors.productCode?.message as string}
              />
              <TextField
                label="Product Name"
                fullWidth
                variant="outlined"
                {...register('name', { required: 'Name is required' })}
                error={!!errors.name}
                helperText={errors.name?.message as string}
              />

              {/* Category — controlled so it shows the selected value when editing */}
              <Controller
                name="categoryId"
                control={control}
                rules={{ required: 'Category is required' }}
                defaultValue=""
                render={({ field }) => (
                  <FormControl fullWidth variant="outlined" error={!!errors.categoryId}>
                    <InputLabel>Category</InputLabel>
                    <Select label="Category" {...field} value={field.value ?? ''}>
                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <TextField
                label="Unit (e.g. Bags, Pcs, Ltr)"
                fullWidth
                variant="outlined"
                {...register('unit', { required: 'Unit is required' })}
                error={!!errors.unit}
                helperText={errors.unit?.message as string}
              />
              <TextField
                label="Loose Unit (e.g. Kg, Ltr) (optional)"
                fullWidth
                variant="outlined"
                {...register('looseUnit')}
                error={!!errors.looseUnit}
                helperText={errors.looseUnit?.message as string}
              />
              <TextField
                label="Conversion Factor (e.g. 26.0) (optional)"
                type="number"
                slotProps={{ htmlInput: { step: '0.001' } }}
                fullWidth
                variant="outlined"
                {...register('conversionFactor')}
                error={!!errors.conversionFactor}
                helperText={errors.conversionFactor?.message as string}
              />
              <TextField
                label="Purchase Price (Rs.)"
                type="number"
                slotProps={{ htmlInput: { step: '0.01' } }}
                fullWidth
                variant="outlined"
                {...register('purchasePrice', { required: 'Purchase price is required' })}
                error={!!errors.purchasePrice}
                helperText={errors.purchasePrice?.message as string}
              />
              <TextField
                label="Selling Price (Rs.)"
                type="number"
                slotProps={{ htmlInput: { step: '0.01' } }}
                fullWidth
                variant="outlined"
                {...register('sellingPrice', { required: 'Selling price is required' })}
                error={!!errors.sellingPrice}
                helperText={errors.sellingPrice?.message as string}
              />
              <TextField
                label="Min Stock Alert Threshold"
                type="number"
                fullWidth
                variant="outlined"
                {...register('minimumStockAlert', { required: 'Min stock alert is required' })}
                error={!!errors.minimumStockAlert}
                helperText={errors.minimumStockAlert?.message as string}
              />

              {/* Status — controlled so it shows the current status when editing */}
              <Controller
                name="status"
                control={control}
                defaultValue="ACTIVE"
                render={({ field }) => (
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Status</InputLabel>
                    <Select label="Status" {...field} value={field.value ?? 'ACTIVE'}>
                      <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                      <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setOpenProductDlg(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedProduct ? 'Update Product' : 'Save Product'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Category Manager Dialog ────────────────────────────────────────── */}
      <Dialog open={openCategoryDlg} onClose={() => setOpenCategoryDlg(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Category Manager</DialogTitle>
        <DialogContent>
          {catError && <Alert severity="error" sx={{ mb: 2 }}>{catError}</Alert>}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 1.5 }}>
            <TextField
              label="New Category"
              variant="outlined"
              size="small"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
            <TextField
              label="Description"
              variant="outlined"
              size="small"
              fullWidth
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
            />
            <Button variant="contained" onClick={handleAddCategory} sx={{ minWidth: 100 }}>
              Add
            </Button>
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Categories List</Typography>
          <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
            <List dense>
              {categories.map((cat) => (
                <ListItem
                  key={cat.id}
                  secondaryAction={
                    isAdmin && (
                      <IconButton edge="end" color="error" onClick={() => handleDeleteCategory(cat.id, cat.name)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  <ListItemText
                    primary={cat.name}
                    secondary={cat.description || 'No description'}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategoryDlg(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Custom Confirm Dialog ─────────────────────────────────────────── */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: '50%',
              bgcolor: 'error.lighter', flexShrink: 0
            }}>
              <WarningIcon sx={{ color: 'error.main', fontSize: 28 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{confirmTitle}</Typography>
          </Box>
        </DialogTitle>
        <Divider sx={{ mt: 2 }} />
        <DialogContent>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {confirmMsg}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setConfirmOpen(false)}
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmOk}
            fullWidth
            startIcon={<DeleteIcon />}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Info / Result Dialog ──────────────────────────────────────────── */}
      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} maxWidth="xs" fullWidth>
        <DialogContent sx={{ pt: 3, pb: 1, textAlign: 'center' }}>
          <Alert severity={infoSeverity} sx={{ mb: 1 }}>{infoMsg}</Alert>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button variant="contained" onClick={() => setInfoOpen(false)} sx={{ minWidth: 100 }}>
            OK
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ProductsModule;
