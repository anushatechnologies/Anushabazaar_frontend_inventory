import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Divider
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { AuthService } from '../../services/api';
import { useAppState } from '../../context/AppState';

const SettingsModule: React.FC = () => {
  const { user } = useAppState();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await AuthService.changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword
      });
      setSuccess('Password updated successfully!');
      reset();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update password. Verify old password.');
    } finally {
      setLoading(false);
    }
  };

  const newPassword = watch('newPassword');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Account Settings</Typography>
        <Typography variant="body2" color="text.secondary">Manage your user profile details and update access passwords.</Typography>
      </Box>

      {/* Main Layout Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
        
        {/* Profile Details */}
        <Box>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Profile Summary</Typography>
              <Divider sx={{ mb: 2.5 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Username</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{user?.username}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Email Address</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{user?.email}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Role Group</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {user?.roles[0]?.replace('ROLE_', '')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Change Password Form */}
        <Box>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockIcon /> Update Account Password
              </Typography>
              <Divider sx={{ mb: 2.5 }} />

              {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2.5 }}>{success}</Alert>}

              <form onSubmit={handleSubmit(onSubmit)}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                    <TextField
                      label="Current Password"
                      type="password"
                      fullWidth
                      variant="outlined"
                      {...register('oldPassword', { required: 'Current password is required' })}
                      error={!!errors.oldPassword}
                      helperText={errors.oldPassword?.message as string}
                    />
                  </Box>
                  <Box>
                    <TextField
                      label="New Password"
                      type="password"
                      fullWidth
                      variant="outlined"
                      {...register('newPassword', {
                        required: 'New password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters long' }
                      })}
                      error={!!errors.newPassword}
                      helperText={errors.newPassword?.message as string}
                    />
                  </Box>
                  <Box>
                    <TextField
                      label="Confirm New Password"
                      type="password"
                      fullWidth
                      variant="outlined"
                      {...register('confirmPassword', {
                        required: 'Please confirm your new password',
                        validate: (val) => val === newPassword || 'Passwords do not match'
                      })}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message as string}
                    />
                  </Box>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 3, px: 4, py: 1.25 }}
                  disabled={loading}
                >
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default SettingsModule;
