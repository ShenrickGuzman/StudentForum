import axios from 'axios';


function withApiPath(url) {
  if (!url) return '/api';
  return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`;
}

// Render sets REACT_APP_API_URL via render.yaml, fallback to window.location.origin for static hosting
const rawBase =
  'https://studentforum-backend.onrender.com';

const api = axios.create({ baseURL: withApiPath(rawBase) });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercept responses to handle deleted account
api.interceptors.response.use(
  response => response,
  error => {
    if (
      error?.response?.data?.error === 'Account deleted' ||
      (error?.response?.status === 401 && error?.response?.data?.error?.toLowerCase().includes('deleted'))
    ) {
      // Clear auth and redirect to account deleted page
      localStorage.removeItem('mf_token');
      localStorage.removeItem('mf_user');
      if (typeof window !== 'undefined') {
        window.location.replace('/account-deleted');
      }
    }
    return Promise.reject(error);
  }
);

// Function to get full URL for static assets like images
export function getAssetUrl(path) {
  if (!path) return '';
  // Use the base URL without /api suffix for static assets
  const base = rawBase ? rawBase.replace(/\/api$/, '') : '';
  if (path.startsWith('/')) {
    return `${base}${path}`;
  }
  return path;
}

export default api;


