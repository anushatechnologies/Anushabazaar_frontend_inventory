import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Description as ExcelIcon,
  FilterAlt as FilterIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import api from '../../services/api';

const ReportsModule: React.FC = () => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const downloadBlob = (data: Blob, filename: string) => {
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportSales = async () => {
    setError(null);
    if (!startDate || !endDate) {
      setError('Both start and end dates are required to export reports.');
      return;
    }
    setSalesLoading(true);
    try {
      const response = await api.get(`/reports/sales/excel`, {
        params: { start: startDate, end: endDate },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      downloadBlob(blob, `sales_report_${startDate}_to_${endDate}.xlsx`);
      setSnackbar('Sales report downloaded successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export sales report. Please try again.');
    } finally {
      setSalesLoading(false);
    }
  };

  const handleExportPurchases = async () => {
    setError(null);
    if (!startDate || !endDate) {
      setError('Both start and end dates are required to export reports.');
      return;
    }
    setPurchasesLoading(true);
    try {
      const response = await api.get(`/reports/purchases/excel`, {
        params: { start: startDate, end: endDate },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      downloadBlob(blob, `purchases_report_${startDate}_to_${endDate}.xlsx`);
      setSnackbar('Purchase report downloaded successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export purchases report. Please try again.');
    } finally {
      setPurchasesLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Financial Reports & Export
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select target dates to export detailed sales invoices and purchase restocks to Microsoft Excel worksheets.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
        {/* Date Range Selector */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 5' } }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <FilterIcon /> Date Range Configuration
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  type="date"
                  label="Start Date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <TextField
                  type="date"
                  label="End Date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Download Buttons */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 7' } }}>
          <Card sx={{ height: '100%' }}>
            <CardContent
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                gap: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Download Data Packages
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    startIcon={salesLoading ? <CircularProgress size={20} color="inherit" /> : <ExcelIcon />}
                    onClick={handleExportSales}
                    disabled={salesLoading}
                    sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    <Typography variant="button" sx={{ fontWeight: 700 }}>
                      Sales Invoices
                    </Typography>
                    <Typography
                      variant="caption"
                      color="inherit"
                      sx={{ textTransform: 'none', opacity: 0.8 }}
                    >
                      {salesLoading ? 'Generating...' : 'Export sales to Excel'}
                    </Typography>
                  </Button>
                </Box>

                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    fullWidth
                    startIcon={
                      purchasesLoading ? <CircularProgress size={20} color="inherit" /> : <ExcelIcon />
                    }
                    onClick={handleExportPurchases}
                    disabled={purchasesLoading}
                    sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    <Typography variant="button" sx={{ fontWeight: 700 }}>
                      Purchase Bills
                    </Typography>
                    <Typography
                      variant="caption"
                      color="inherit"
                      sx={{ textTransform: 'none', opacity: 0.8 }}
                    >
                      {purchasesLoading ? 'Generating...' : 'Export purchases to Excel'}
                    </Typography>
                  </Button>
                </Box>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                * Excel spreadsheets will contain all rows including invoice number, dates, party
                profiles, subtotals, tax figures, discounts, and total amounts.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity="success"
          icon={<SuccessIcon />}
          onClose={() => setSnackbar(null)}
          sx={{ width: '100%' }}
        >
          {snackbar}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportsModule;
