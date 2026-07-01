import React, { createContext, useState, useEffect, useContext } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthService, NotificationService } from '../services/api';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

interface AppContextType {
  user: UserProfile | null;
  token: string | null;
  login: (credentials: any) => Promise<boolean>;
  logout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  notifications: any[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    return localStorage.getItem('adtms_dark_mode') === 'true';
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Normalize roles to plain strings regardless of backend format
  const normalizeProfile = (profile: any): UserProfile => ({
    ...profile,
    roles: (profile.roles ?? []).map((r: any) =>
      typeof r === 'string' ? r : (r?.name?.toString?.() ?? '')
    )
  });

  // Authenticate user on page load if token exists
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('adtms_token');
      if (savedToken) {
        setToken(savedToken);
        try {
          const raw = await AuthService.getMe();
          setUser(normalizeProfile(raw));
        } catch (err) {
          console.error("Failed to load user profile", err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Poll for notifications if logged in
  useEffect(() => {
    if (user) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const refreshNotifications = async () => {
    try {
      const data = await NotificationService.getUnread();
      setNotifications(data);
      const countRes = await NotificationService.getUnreadCount();
      setUnreadCount(countRes.count);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const login = async (credentials: any): Promise<boolean> => {
    try {
      const response = await AuthService.login(credentials);
      localStorage.setItem('adtms_token', response.accessToken);
      setToken(response.accessToken);
      
      const profile = normalizeProfile(await AuthService.getMe());
      setUser(profile);
      localStorage.setItem('adtms_user', JSON.stringify(profile));
      return true;
    } catch (err) {
      console.error("Login failed", err);
      throw err;
    }
  };


  const logout = () => {
    localStorage.removeItem('adtms_token');
    localStorage.removeItem('adtms_user');
    setUser(null);
    setToken(null);
    setNotifications([]);
    setUnreadCount(0);
  };

  const setDarkMode = (val: boolean) => {
    setDarkModeState(val);
    localStorage.setItem('adtms_dark_mode', String(val));
  };

  // Harmonious Color Palettes (Indigo & Teal)
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#818cf8' : '#4f46e5', // vibrant indigo
        light: '#a5b4fc',
        dark: '#3730a3',
      },
      secondary: {
        main: darkMode ? '#2dd4bf' : '#0d9488', // professional teal
        light: '#5eead4',
        dark: '#115e59',
      },
      background: {
        default: darkMode ? '#0f172a' : '#f8fafc', // slate-900 / slate-50
        paper: darkMode ? '#1e293b' : '#ffffff', // slate-800 / white
      },
      text: {
        primary: darkMode ? '#f1f5f9' : '#1e293b',
        secondary: darkMode ? '#94a3b8' : '#64748b',
      },
      divider: darkMode ? '#334155' : '#e2e8f0',
    },
    typography: {
      fontFamily: "'Outfit', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 500 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            boxShadow: 'none',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            backgroundImage: 'none',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
          },
        },
      },
    },
  });

  return (
    <AppContext.Provider value={{
      user,
      token,
      login,
      logout,
      darkMode,
      setDarkMode,
      notifications,
      unreadCount,
      refreshNotifications,
      loading
    }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
