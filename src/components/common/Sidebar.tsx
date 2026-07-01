import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Box
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  MonetizationOn as MonetizationOnIcon,
  People as PeopleIcon,
  LocalShipping as LocalShippingIcon,
  AccountBalance as AccountBalanceIcon,
  Settings as SettingsIcon,
  SupervisorAccount as SupervisorAccountIcon
} from '@mui/icons-material';
import { useAppState } from '../../context/AppState';
import logo from '../../assets/logo.png';

const DRAWER_WIDTH = 260;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppState();

  if (!user) return null;

  const hasRole = (roles: string[]) => {
    return user.roles.some(r => roles.includes(r));
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] },
    { text: 'Products & Stock', icon: <InventoryIcon />, path: '/products', roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'] },
    { text: 'Purchases Entry', icon: <ShoppingCartIcon />, path: '/purchases', roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'] },
    { text: 'Sales Billing', icon: <MonetizationOnIcon />, path: '/sales', roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'] },
    { text: 'Suppliers Catalog', icon: <LocalShippingIcon />, path: '/suppliers', roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'] },
    { text: 'Customers Directory', icon: <PeopleIcon />, path: '/customers', roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'] },
    { text: 'Accounts (Cashflow)', icon: <AccountBalanceIcon />, path: '/accounts', roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] },
    { text: 'User Management', icon: <SupervisorAccountIcon />, path: '/users', roles: ['ROLE_ADMIN'] },
    { text: 'Account Settings', icon: <SettingsIcon />, path: '/settings', roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'] },
  ];

  const filteredItems = menuItems.filter(item => hasRole(item.roles));

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img
            src={logo}
            alt="Anusha Bazaar Logo"
            style={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              objectFit: 'contain'
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '0.5px', color: 'text.primary', fontSize: '1.1rem' }}>
            Anusha Bazaar
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: 'auto', px: 1.5, py: 2 }}>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {filteredItems.map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.text}
                onClick={() => navigate(item.path)}
                selected={isSelected}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  px: 2,
                  color: isSelected ? 'primary.main' : 'text.secondary',
                  backgroundColor: isSelected ? 'action.selected' : 'transparent',
                  '&:hover': {
                    color: 'text.primary',
                    backgroundColor: 'action.hover',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'primary.dark',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.dark',
                    },
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    }
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isSelected ? 'inherit' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText>
                  <Typography sx={{ fontSize: '0.925rem', fontWeight: isSelected ? 600 : 500 }}>
                    {item.text}
                  </Typography>
                </ListItemText>
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
