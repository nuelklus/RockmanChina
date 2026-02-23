import axios from 'axios';
import { apiCallWithWakeUp } from './backendWakeUp';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rockmanchina.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  console.log('API Request:', config.method?.toUpperCase(), config.url);
  console.log('Token from localStorage:', token);
  if (token) {
    config.headers.Authorization = `Token ${token}`;
    console.log('Authorization header set:', config.headers.Authorization);
  } else {
    console.log('No token found, request will be unauthenticated');
  }
  return config;
});

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('API Error:', error.response?.status, error.config?.url);
    console.log('Error response:', error.response?.data);
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - clearing token and redirecting');
      // Clear token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('staffUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Goods Categories
export const getGoodsCategories = async () => {
  return apiCallWithWakeUp(async () => {
    const response = await api.get('/categories/');
    return response.data;
  });
};

export const getGoodsCategory = async (id: number) => {
  return apiCallWithWakeUp(async () => {
    const response = await api.get(`/categories/${id}/`);
    return response.data;
  });
};

// Customers
export const searchCustomers = async (search: string) => {
  return apiCallWithWakeUp(async () => {
    const response = await api.get('/customers/', { params: { search } });
    return response.data;
  });
};

export const createCustomer = async (customerData: any) => {
  return apiCallWithWakeUp(async () => {
    const response = await api.post('/customers/create_or_get/', customerData);
    return response.data;
  });
};

// Receipts
export const createReceipt = async (receiptData: any) => {
  return apiCallWithWakeUp(async () => {
    const response = await api.post('/receipts/', receiptData);
    return response.data;
  });
};

export const addReceiptItem = async (receiptId: number, itemData: any) => {
  const response = await api.post(`/receipts/${receiptId}/add_item/`, itemData);
  return response.data;
};

export default api;
