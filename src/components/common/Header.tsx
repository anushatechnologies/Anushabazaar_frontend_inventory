import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Tooltip,
  Avatar,
  Divider,
  Button
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAppState } from '../../context/AppState';
import { NotificationService } from '../../services/api';

const Header: React.FC = () => {
  const { user, logout, darkMode, setDarkMode, notifications, unreadCount, refreshNotifications } = useAppState();
  
  // Anchor states
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);

  if (!user) return null;

  const handleProfileOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await NotificationService.markAsRead(id);
      await refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllRead();
      await refreshNotifications();
      handleNotifClose();
    } catch (err) {
      console.error(err);
    }
  };

  const formatRole = (role: string) => {
    return role.replace('ROLE_', '').toUpperCase();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: `calc(100% - 260px)`,
        ml: `260px`,
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
        <Box />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Dark/Light Mode Toggle */}
          <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
              {darkMode ? <LightModeIcon color="warning" /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Notifications Icon with Badge */}
          <Tooltip title="Notifications">
            <IconButton onClick={handleNotifOpen} color="inherit">
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Profile Avatar */}
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleProfileOpen}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'primary.main',
                fontSize: '0.95rem',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {user.username.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ ml: 1, display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.username}</Typography>
              <Typography variant="caption" color="text.secondary">{formatRole(user.roles[0])}</Typography>
            </Box>
          </Box>

          {/* Notifications Menu */}
          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleNotifClose}
            slotProps={{
              paper: {
                sx: { width: 320, maxHeight: 400, borderRadius: 3, mt: 1, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }
              }
            }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Recent Alerts</Typography>
              {unreadCount > 0 && (
                <Button size="small" onClick={handleMarkAllRead} sx={{ fontSize: '0.75rem', p: 0.5 }}>
                  Clear all
                </Button>
              )}
            </Box>
            <Divider />
            {notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">All caught up! No new alerts.</Typography>
              </Box>
            ) : (
              notifications.map((notif) => (
                <MenuItem
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  sx={{
                    whiteSpace: 'normal',
                    py: 1.5,
                    px: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }} color={notif.type === 'LOW_STOCK' ? 'error.main' : 'text.primary'}>
                    {notif.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.775rem' }}>
                    {notif.message}
                  </Typography>
                </MenuItem>
              ))
            )}
          </Menu>

          {/* Profile Menu */}
          <Menu
            anchorEl={profileAnchorEl}
            open={Boolean(profileAnchorEl)}
            onClose={handleProfileClose}
            slotProps={{
              paper: {
                sx: { width: 200, mt: 1, borderRadius: 2 }
              }
            }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{user.username}</Typography>
              <Typography variant="caption" color="text.secondary">{user.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={logout} sx={{ color: 'error.main', py: 1 }}>
              <LogoutIcon sx={{ fontSize: 18, mr: 1.5 }} />
              Logout
            </MenuItem>
          </Menu>

        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
