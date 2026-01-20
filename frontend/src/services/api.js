import axios from 'axios';
import { API_URL } from '../config';

const API_BASE_URL = API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Get CSRF token from cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Add CSRF token to requests
api.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

// Buildings API
export const buildingsAPI = {
  getAll: () => api.get('/buildings/'),
  getOne: (id) => api.get(`/buildings/${id}/`),
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/buildings/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post('/buildings/', data);
  },
  update: (id, data) => api.put(`/buildings/${id}/`, data),
  delete: (id) => api.delete(`/buildings/${id}/`),
  getReport: (id) => api.get(`/buildings/${id}/report/`),
};

// Units API
export const unitsAPI = {
  getAll: (params) => api.get('/units/', { params }),
  getOne: (id) => api.get(`/units/${id}/`),
  create: (data) => api.post('/units/', data),
  update: (id, data) => api.put(`/units/${id}/`, data),
  delete: (id) => api.delete(`/units/${id}/`),
};

// Tenants API
export const tenantsAPI = {
  getAll: (params) => api.get('/tenants/', { params }),
  getOne: (id) => api.get(`/tenants/${id}/`),
  create: (data) => api.post('/tenants/', data),
  update: (id, data) => api.put(`/tenants/${id}/`, data),
  delete: (id) => api.delete(`/tenants/${id}/`),
  getStatement: (id) => api.get(`/tenants/${id}/statement/`),
  chargeRent: (id, data) => api.post(`/tenants/${id}/charge_rent/`, data),
  moveOut: (id, data) => api.post(`/tenants/${id}/move_out/`, data),
};

// Payments API
export const paymentsAPI = {
  getAll: (params) => api.get('/payments/', { params }),
  getOne: (id) => api.get(`/payments/${id}/`),
  create: (data) => api.post('/payments/', data),
  update: (id, data) => api.put(`/payments/${id}/`, data),
  delete: (id) => api.delete(`/payments/${id}/`),
  chargeAllRent: (data) => api.post('/payments/charge_all_rent/', data),
};

// Expenses API
export const expensesAPI = {
  getAll: (params) => api.get('/expenses/', { params }),
  getOne: (id) => api.get(`/expenses/${id}/`),
  create: (data) => api.post('/expenses/', data),
  update: (id, data) => api.put(`/expenses/${id}/`, data),
  delete: (id) => api.delete(`/expenses/${id}/`),
  getSummary: () => api.get('/expenses/summary/'),
};

// Maintenance API
export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance/', { params }),
  getOne: (id) => api.get(`/maintenance/${id}/`),
  create: (data) => api.post('/maintenance/', data),
  update: (id, data) => api.put(`/maintenance/${id}/`, data),
  delete: (id) => api.delete(`/maintenance/${id}/`),
  updateStatus: (id, data) => api.post(`/maintenance/${id}/update_status/`, data),
};

// Documents API
export const documentsAPI = {
  getAll: (params) => api.get('/documents/', { params }),
  getOne: (id) => api.get(`/documents/${id}/`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/documents/${id}/`),
};

// Leases API
export const leasesAPI = {
  getAll: (params) => api.get('/leases/', { params }),
  getOne: (id) => api.get(`/leases/${id}/`),
  create: (data) => api.post('/leases/', data),
  update: (id, data) => api.put(`/leases/${id}/`, data),
  delete: (id) => api.delete(`/leases/${id}/`),
  getExpiringSoon: () => api.get('/leases/expiring_soon/'),
};

// Activity Logs API
export const activityLogsAPI = {
  getAll: (params) => api.get('/activity-logs/', { params }),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users/', { params }),
  getById: (id) => api.get(`/users/${id}/`),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.put(`/users/${id}/`, data),
  delete: (id) => api.delete(`/users/${id}/`),
  me: () => api.get('/users/me/'),
};

// User Profiles API
export const userProfilesAPI = {
  getAll: (params) => api.get('/user-profiles/', { params }),
  getById: (id) => api.get(`/user-profiles/${id}/`),
  create: (data) => api.post('/user-profiles/', data),
  update: (id, data) => api.put(`/user-profiles/${id}/`, data),
  delete: (id) => api.delete(`/user-profiles/${id}/`),
};

// Utilities API
export const utilitiesAPI = {
  getAll: (params) => api.get('/utilities/', { params }),
  getById: (id) => api.get(`/utilities/${id}/`),
  create: (data) => api.post('/utilities/', data),
  update: (id, data) => api.put(`/utilities/${id}/`, data),
  delete: (id) => api.delete(`/utilities/${id}/`),
  getSummary: () => api.get('/utilities/summary/'),
};

// Property Photos API
export const photosAPI = {
  getAll: (params) => api.get('/photos/', { params }),
  getById: (id) => api.get(`/photos/${id}/`),
  create: (data) => api.post('/photos/', data),
  update: (id, data) => api.put(`/photos/${id}/`, data),
  delete: (id) => api.delete(`/photos/${id}/`),
};

export default api;

