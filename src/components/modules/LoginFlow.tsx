import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  PersonOutlined
} from '@mui/icons-material';
import { useAppState } from '../../context/AppState';
import { AuthService } from '../../services/api';
import logo from '../../assets/logo.png';

interface LoginFormData {
  username: string;
  password: string;
}

const LoginFlow: React.FC = () => {
  const { login, darkMode } = useAppState();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginFormData>({ username: '', password: '' });
  const [formErrors, setFormErrors] = useState<Partial<LoginFormData>>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password dialog
  const [openReset, setOpenReset] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleChange = (field: keyof LoginFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (loginError) setLoginError(null);
  };

  const validate = (): boolean => {
    const errors: Partial<LoginFormData> = {};
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!formData.password) errors.password = 'Password is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setLoginError(null);
    try {
      await login({ username: formData.username.trim(), password: formData.password });
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.status === 401 ? 'Invalid username or password.' : 'Login failed. Please try again.');
      setLoginError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async () => {
    if (!resetUsername || !resetEmail) {
      setResetMsg({ type: 'error', text: 'All fields are required' });
      return;
    }
    setResetLoading(true);
    setResetMsg(null);
    try {
      await AuthService.forgotPassword({ username: resetUsername, email: resetEmail });
      setResetMsg({ type: 'success', text: 'Success! Your password has been reset to: Password@123' });
    } catch (err: any) {
      setResetMsg({ type: 'error', text: err.response?.data?.message || 'Reset failed. Please check your details.' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #4f46e5 0%, #0d9488 100%)',
        px: 2,
        py: 4,
      }}
    >
      <Card
        sx={{
          maxWidth: 440,
          width: '100%',
          borderRadius: 4,
          boxShadow: darkMode 
            ? '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.1)'
            : '0 25px 50px -12px rgba(79, 70, 229, 0.15)',
          backdropFilter: 'blur(16px) saturate(120%)',
          bgcolor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.85)',
          border: '1px solid',
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(79, 70, 229, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: darkMode
              ? '0 30px 60px -15px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.15)'
              : '0 30px 60px -15px rgba(79, 70, 229, 0.2)',
          }
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Logo & Title */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box
              sx={{
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1.5,
                borderRadius: '50%',
                bgcolor: darkMode ? 'rgba(129, 140, 248, 0.08)' : 'rgba(79, 70, 229, 0.05)',
                border: '1px dashed',
                borderColor: darkMode ? 'rgba(129, 140, 248, 0.3)' : 'rgba(79, 70, 229, 0.2)',
                transition: 'transform 0.4s ease-in-out',
                '&:hover': {
                  transform: 'rotate(360deg)'
                }
              }}
            >
              <img
                src={logo}
                alt="Anusha Bazaar Logo"
                style={{
                  height: 64,
                  objectFit: 'contain'
                }}
              />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center', mb: 0.5, letterSpacing: '-0.5px' }}>
              Anusha Bazaar
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontWeight: 500 }}>
              Purchases · Sales · Inventory · Reports
            </Typography>
          </Box>

          {loginError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setLoginError(null)}>
              {loginError}
            </Alert>
          )}

          <form onSubmit={onSubmit} noValidate>
            <TextField
              id="login-username"
              label="Username"
              fullWidth
              variant="outlined"
              margin="normal"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange('username')}
              error={!!formErrors.username}
              helperText={formErrors.username}
              disabled={loading}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlined fontSize="small" color="primary" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              id="login-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              variant="outlined"
              margin="normal"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange('password')}
              error={!!formErrors.password}
              helperText={formErrors.password}
              disabled={loading}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined fontSize="small" color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              id="login-submit-btn"
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #4f46e5 0%, #0d9488 100%)',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338ca 0%, #0f766e 100%)',
                  boxShadow: '0 6px 16px rgba(79, 70, 229, 0.35)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ mt: 2.5, textAlign: 'center' }}>
            <Typography
              variant="body2"
              color="primary"
              sx={{ 
                cursor: 'pointer', 
                fontWeight: 600,
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 0.8 } 
              }}
              onClick={() => {
                setResetMsg(null);
                setResetUsername('');
                setResetEmail('');
                setOpenReset(true);
              }}
            >
              Forgot Password?
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={openReset} onClose={() => setOpenReset(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide your username and registered email to verify your identity and reset your password.
          </Typography>
          {resetMsg && (
            <Alert severity={resetMsg.type} sx={{ mb: 2 }}>
              {resetMsg.text}
            </Alert>
          )}
          <TextField
            label="Username"
            fullWidth
            margin="dense"
            value={resetUsername}
            onChange={(e) => setResetUsername(e.target.value)}
          />
          <TextField
            label="Email Address"
            type="email"
            fullWidth
            margin="dense"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReset(false)}>Close</Button>
          <Button onClick={handleResetSubmit} variant="contained" disabled={resetLoading}>
            {resetLoading ? <CircularProgress size={20} color="inherit" /> : 'Verify & Reset'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginFlow;
