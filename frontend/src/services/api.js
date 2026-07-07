import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ───
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  uploadProfilePicture: (base64) => api.put('/auth/profile', { profilePicture: base64 }),
};

// ─── Transactions ───
export const transactionApi = {
  getAll: (month, year) => api.get('/transactions', { params: { month, year } }),
  getAllForExport: () => api.get('/transactions'),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// ─── Categories ───
export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ─── Accounts ───
export const accountApi = {
  getAll: () => api.get('/accounts'),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
};

// ─── Budgets ───
export const budgetApi = {
  getAll: () => api.get('/budgets'),
  get: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
  getSpending: (id) => api.get(`/budgets/${id}/spending`),
  getAllSpending: () => api.get('/budgets/spending-summary'),
};

// ─── Reports ───
export const reportApi = {
  getSummary: (from, to) => api.get('/reports/summary', { params: { from, to } }),
  getMonthlyHistory: (months) => api.get('/reports/monthly-history', { params: { months } }),
  getCategoryBreakdown: (from, to, type) => api.get('/reports/category-breakdown', { params: { from, to, type } }),
  getDashboard: () => api.get('/reports/dashboard'),
};

export default api;
