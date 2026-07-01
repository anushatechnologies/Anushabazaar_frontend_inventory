import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  LocalShipping as LocalShippingIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DashboardService, ProductService } from '../../services/api';

const COLORS = ['#4f46e5', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6'];

const DashboardHome: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const sumData = await DashboardService.getSummary();
        setSummary(sumData);
        
        const chartData = await DashboardService.getCharts();
        setCharts(chartData);

        const stockData = await ProductService.getLowStock();
        setLowStock(stockData);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch dashboard metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !summary || !charts) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Data loading failed'}</Alert>
      </Box>
    );
  }

  const kpis = [
    { title: "Today's Sales", value: `Rs. ${summary.todaySales}`, icon: <TrendingUpIcon color="success" />, desc: "Sales billing today" },
    { title: "Today's Purchases", value: `Rs. ${summary.todayPurchases}`, icon: <TrendingDownIcon color="error" />, desc: "Restock purchases today" },
    { title: "Trading Gross Profit", value: `Rs. ${summary.profitLoss}`, icon: <TrendingUpIcon color="primary" />, desc: "Margin on sales" },
    { title: "Total Stock Value", value: `Rs. ${summary.totalStockValue}`, icon: <InventoryIcon color="info" />, desc: "Asset valuation of stock" },
    { title: "Pending Receivables", value: `Rs. ${summary.pendingReceivables}`, icon: <AccountBalanceWalletIcon color="warning" />, desc: "Due from Customers" },
    { title: "Pending Payables", value: `Rs. ${summary.pendingPayables}`, icon: <AccountBalanceWalletIcon color="error" />, desc: "Due to Suppliers" },
    { title: "Active Customers", value: summary.totalCustomers, icon: <PeopleIcon color="action" />, desc: "Registered customers" },
    { title: "Active Suppliers", value: summary.totalSuppliers, icon: <LocalShippingIcon color="action" />, desc: "Registered suppliers" },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Business Overview</Typography>
        <Typography variant="body2" color="text.secondary">Real-time statistics of buying, selling, cashflows, and stock valuation.</Typography>
      </Box>

      {/* KPI Cards Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3, mb: 4 }}>
        {kpis.map((kpi, idx) => (
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }} key={idx}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{kpi.title}</Typography>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'action.hover', display: 'flex' }}>
                    {kpi.icon}
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{kpi.value}</Typography>
                <Typography variant="caption" color="text.secondary">{kpi.desc}</Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Main Charts Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3, mb: 4 }}>
        {/* Sales & Purchases Daily Trend */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 8' } }}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Bazaar Trend (Last 7 Days)</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.dailyTrends}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" name="Sales" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="purchases" name="Purchases" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Box>

        {/* Low Stock Alerts Pane */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card sx={{ height: '100%', p: 2.5, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WarningIcon color="error" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Low Stock Alert</Typography>
            </Box>
            <Divider />
            {lowStock.length === 0 ? (
              <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Typography variant="body2" color="text.secondary">All items are sufficiently stocked.</Typography>
              </Box>
            ) : (
              <List sx={{ flex: 1, overflow: 'auto', maxHeight: 250 }}>
                {lowStock.map((prod) => (
                  <ListItem key={prod.id} sx={{ px: 0, py: 1.25 }}>
                    <ListItemText>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {prod.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem' }} color="text.secondary">
                        Code: {prod.productCode} | Cat: {prod.category.name}
                      </Typography>
                    </ListItemText>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>
                        {prod.currentStock} {prod.unit}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Alert: {prod.minimumStockAlert}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Card>
        </Box>
      </Box>

      {/* Sub Charts Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
        {/* Monthly Sales Area Chart */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Monthly Sales (Current Year)</Typography>
            <Box sx={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.monthlySales}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sales" name="Sales" stroke="#0d9488" fill="#ccfbf1" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Box>

        {/* Top Products Horizontal Bar Chart */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Top Selling Products</Typography>
            <Box sx={{ height: 240 }}>
              {charts.topProducts.length === 0 ? (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No sales recorded yet.</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.topProducts} layout="vertical">
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} hide />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="quantity" name="Qty Sold" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Card>
        </Box>

        {/* Stock by Category Pie Chart */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Stock by Category</Typography>
            <Box sx={{ height: 240, display: 'flex', justifyContent: 'center' }}>
              {charts.stockSummary.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No stock details available.</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.stockSummary}
                      dataKey="stock"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      fill="#8884d8"
                      label={({ name, percent }: any) => `${name || ''} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    >
                      {charts.stockSummary.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardHome;
