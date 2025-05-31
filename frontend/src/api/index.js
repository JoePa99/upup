import axios from 'axios';

// Create API client
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '/api' : 'http://localhost:3001/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const auth = {
  login: (email, password) => api.post('/tenant/login', { email, password }),
  register: (userData) => api.post('/tenant/register', userData),
  superAdminLogin: (email, password) => api.post('/admin/login', { email, password }),
};

// Tenant API
export const tenant = {
  getTenantInfo: () => api.get('/tenant/tenant-info'),
  getUsage: (period = '30days') => api.get(`/tenant/usage?period=${period}`),
};

// Create Pillar API
export const create = {
  generateContent: (data) => api.post('/tenant/create/generate', data),
  getBrandGuidelines: () => api.get('/tenant/create/brand-guidelines'),
  updateBrandGuidelines: (data) => api.put('/tenant/create/brand-guidelines', data),
  getTemplates: () => api.get('/tenant/create/templates'),
  saveTemplate: (data) => api.post('/tenant/create/templates', data),
};

// Communicate Pillar API
export const communicate = {
  generateResponse: (data) => api.post('/tenant/communicate/response', data),
  createEmailSequence: (data) => api.post('/tenant/communicate/email-sequence', data),
  processMeeting: (data) => api.post('/tenant/communicate/meeting', data),
};

// Understand Pillar API
export const understand = {
  analyzeData: (data) => api.post('/tenant/understand/analyze', data),
  createForecast: (data) => api.post('/tenant/understand/forecast', data),
  generateCharts: (data) => api.post('/tenant/understand/charts', data),
};

// Grow Pillar API
export const grow = {
  discoverOpportunities: (data) => api.post('/tenant/grow/opportunities', data),
  validateConcept: (data) => api.post('/tenant/grow/validate', data),
  createSurvey: (data) => api.post('/tenant/grow/survey', data),
};

// Operate Pillar API
export const operate = {
  generateJobDescription: (data) => api.post('/tenant/operate/job-description', data),
  createLegalDocument: (data) => api.post('/tenant/operate/legal-document', data),
  optimizeProcess: (data) => api.post('/tenant/operate/process', data),
};

// Super Admin API
export const admin = {
  createTenant: (data) => api.post('/admin/tenants', data),
  getTenant: (id) => api.get(`/admin/tenants/${id}`),
  updateTenant: (id, data) => api.patch(`/admin/tenants/${id}`, data),
  getAllTenants: () => api.get('/admin/tenants'),
  getSystemHealth: () => api.get('/admin/system/health'),
  getUsageStats: () => api.get('/admin/system/usage'),
};

export default {
  auth,
  tenant,
  create,
  communicate,
  understand,
  grow,
  operate,
  admin,
};