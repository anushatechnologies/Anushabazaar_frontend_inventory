import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Toolbar, CircularProgress } from '@mui/material';
import { AppStateProvider, useAppState } from './context/AppState';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';

// Views
import LoginFlow from './components/modules/LoginFlow';
import DashboardHome from './components/modules/DashboardHome';
import ProductsModule from './components/modules/ProductsModule';
import PurchasesModule from './components/modules/PurchasesModule';
import SalesModule from './components/modules/SalesModule';
import SuppliersModule from './components/modules/SuppliersModule';
import CustomersModule from './components/modules/CustomersModule';
import AccountsModule from './components/modules/AccountsModule';
import UsersModule from './components/modules/UsersModule';
import SettingsModule from './components/modules/SettingsModule';

// Full-page loading spinner
const FullPageLoader: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      bgcolor: 'background.default',
    }}
  >
    <CircularProgress size={48} />
  </Box>
);

// Protected Route Guard — waits for auth state to load before deciding
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAppState();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !user.roles.some((r) => allowedRoles.includes(r))) {
    return <Navigate to="/products" replace />;
  }
  return <>{children}</>;
};

// Login route — redirect to dashboard if already logged in
const LoginRoute: React.FC = () => {
  const { user, loading } = useAppState();
  if (loading) return <FullPageLoader />;
  if (user) return <Navigate to="/" replace />;
  return <LoginFlow />;
};

// Main Layout Shell — waits for auth state to load
const Shell: React.FC = () => {
  const { user, loading } = useAppState();

  // Don't redirect while the auth state is being initialized
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 260px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar /> {/* Spacing below fixed AppBar */}
        <Routes>
          {/* Dashboard — Admin & Manager only */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER']}>
                <DashboardHome />
              </ProtectedRoute>
            }
          />

          {/* Open to all authenticated roles */}
          <Route path="/products" element={<ProductsModule />} />
          <Route path="/purchases" element={<PurchasesModule />} />
          <Route path="/sales" element={<SalesModule />} />
          <Route path="/suppliers" element={<SuppliersModule />} />
          <Route path="/customers" element={<CustomersModule />} />

          {/* Admin & Manager only */}
          <Route
            path="/accounts"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER']}>
                <AccountsModule />
              </ProtectedRoute>
            }
          />


          {/* Admin only */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <UsersModule />
              </ProtectedRoute>
            }
          />

          <Route path="/settings" element={<SettingsModule />} />

          {/* Fallback — redirect staff to /products, others to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/*" element={<Shell />} />
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  );
};

export default App;
