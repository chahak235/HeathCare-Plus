import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Get API URL from environment or use default
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Ensure API_URL is a valid URL
if (!API_URL.startsWith('http://') && !API_URL.startsWith('https://')) {
    console.warn('Invalid API_URL format, using default:', API_URL);
    API_URL = 'http://localhost:3001/api';
}

// Log API URL in development
if (import.meta.env.DEV) {
    console.log('API Base URL:', API_URL);
}

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Request interceptor for adding auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Handle unauthorized
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        // Log connection errors in development
        if (import.meta.env.DEV && (error.code === 'ECONNREFUSED' || error.message.includes('ERR_CONNECTION_REFUSED'))) {
            console.error('Connection refused. Make sure the backend server is running on', API_URL);
        }
        
        return Promise.reject(error);
    }
);