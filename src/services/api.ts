import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adtms_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('adtms_token');
      localStorage.removeItem('adtms_user');
      // Only redirect if not already on login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ================= API Wrapper Services =================

export const AuthService = {
  login: async (data: any) => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  changePassword: async (data: any) => {
    const res = await api.put('/auth/change-password', data);
    return res.data;
  },
  forgotPassword: async (data: any) => {
    const res = await api.post('/auth/forgot-password', data);
    return res.data;
  },
};

export const UserService = {
  getAll: async () => {
    const res = await api.get('/users');
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/users', data);
    return res.data;
  },
  update: async (id: number, data: any) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },
};

export const DashboardService = {
  getSummary: async () => {
    const res = await api.get('/dashboard/summary');
    return res.data;
  },
  getCharts: async () => {
    const res = await api.get('/dashboard/charts');
    return res.data;
  },
};

export const CategoryService = {
  getAll: async () => {
    const res = await api.get('/categories');
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/categories', data);
    return res.data;
  },
  update: async (id: number, data: any) => {
    const res = await api.put(`/categories/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
};

export const ProductService = {
  getPaginated: async (search: string, page: number, size: number, sortBy = 'id', dir = 'asc') => {
    const res = await api.get('/products', {
      params: { search, page, size, sortBy, direction: dir },
    });
    return res.data;
  },
  getAll: async () => {
    const res = await api.get('/products/all');
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/products', data);
    return res.data;
  },
  update: async (id: number, data: any) => {
    const res = await api.put(`/products/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },
  getLowStock: async () => {
    const res = await api.get('/products/low-stock');
    return res.data;
  },
};

export const CustomerService = {
  getPaginated: async (search: string, page: number, size: number, sortBy = 'id', dir = 'asc') => {
    const res = await api.get('/customers', {
      params: { search, page, size, sortBy, direction: dir },
    });
    return res.data;
  },
  getAll: async () => {
    const res = await api.get('/customers/all');
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/customers', data);
    return res.data;
  },
  update: async (id: number, data: any) => {
    const res = await api.put(`/customers/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/customers/${id}`);
    return res.data;
  },
  getLedger: async (id: number) => {
    const res = await api.get(`/customers/${id}/ledger`);
    return res.data;
  },
};

export const SupplierService = {
  getPaginated: async (search: string, page: number, size: number, sortBy = 'id', dir = 'asc') => {
    const res = await api.get('/suppliers', {
      params: { search, page, size, sortBy, direction: dir },
    });
    return res.data;
  },
  getAll: async () => {
    const res = await api.get('/suppliers/all');
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/suppliers', data);
    return res.data;
  },
  update: async (id: number, data: any) => {
    const res = await api.put(`/suppliers/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/suppliers/${id}`);
    return res.data;
  },
  getLedger: async (id: number) => {
    const res = await api.get(`/suppliers/${id}/ledger`);
    return res.data;
  },
};

export const PurchaseService = {
  getPaginated: async (start: string, end: string, page: number, size: number, sortBy = 'id', dir = 'desc') => {
    const res = await api.get('/purchases', {
      params: { start, end, page, size, sortBy, direction: dir },
    });
    return res.data;
  },
  save: async (data: any) => {
    const res = await api.post('/purchases', data);
    return res.data;
  },
  cancel: async (id: number) => {
    const res = await api.put(`/purchases/${id}/cancel`);
    return res.data;
  },
  delete: async (id: number) => {
    await api.delete(`/purchases/${id}`);
  },
  downloadPdf: async (id: number): Promise<void> => {
    const token = localStorage.getItem('adtms_token');
    const url = `${API_BASE_URL}/purchases/${id}/pdf?access_token=${token}`;
    const win = window.open(url, '_blank');
    if (!win) {
      const a = document.createElement('a');
      a.href = url;
      a.click();
    }
  },
};

export const SaleService = {
  getPaginated: async (start: string, end: string, page: number, size: number, sortBy = 'id', dir = 'desc') => {
    const res = await api.get('/sales', {
      params: { start, end, page, size, sortBy, direction: dir },
    });
    return res.data;
  },
  save: async (data: any) => {
    const res = await api.post('/sales', data);
    return res.data;
  },
  cancel: async (id: number) => {
    const res = await api.put(`/sales/${id}/cancel`);
    return res.data;
  },
  delete: async (id: number) => {
    await api.delete(`/sales/${id}`);
  },
  downloadPdf: async (id: number): Promise<void> => {
    const token = localStorage.getItem('adtms_token');
    const url = `${API_BASE_URL}/sales/${id}/pdf?access_token=${token}`;
    const win = window.open(url, '_blank');
    if (!win) {
      const a = document.createElement('a');
      a.href = url;
      a.click();
    }
  },
};

export const StockService = {
  adjust: async (data: { productId: number; quantity: number; notes: string }) => {
    const res = await api.post('/stocks/adjust', data);
    return res.data;
  },
  getAllMovements: async () => {
    const res = await api.get('/stocks/movements');
    return res.data;
  },
  getProductMovements: async (productId: number) => {
    const res = await api.get(`/stocks/movements/product/${productId}`);
    return res.data;
  },
};

export const AccountsService = {
  getAllPayments: async () => {
    const res = await api.get('/accounts/payments');
    return res.data;
  },
  getPaymentsByEntity: async (type: string, entityId: number) => {
    const res = await api.get(`/accounts/payments/${type}/${entityId}`);
    return res.data;
  },
  recordCollection: async (data: any) => {
    const res = await api.post('/accounts/collect', data);
    return res.data;
  },
  recordPayout: async (data: any) => {
    const res = await api.post('/accounts/pay', data);
    return res.data;
  },
};

export const NotificationService = {
  getUnread: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },
  getAll: async () => {
    const res = await api.get('/notifications/all');
    return res.data;
  },
  getUnreadCount: async () => {
    const res = await api.get('/notifications/unread-count');
    return res.data;
  },
  markAsRead: async (id: number) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },
};
