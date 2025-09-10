import axios from 'axios';


function withApiPath(url) {
  if (!url) return '/api';
  return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`;
}

// Render sets REACT_APP_API_URL via render.yaml, fallback to window.location.origin for static hosting
const rawBase =
  (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : undefined)
  || process.env.REACT_APP_API_URL
  || (typeof window !== 'undefined' ? window.location.origin : undefined);

const api = axios.create({ baseURL: withApiPath(rawBase) });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Function to get full URL for static assets like images
export function getAssetUrl(path) {
  if (!path) return '';
  const base = rawBase || '';
  if (path.startsWith('/')) {
    return `${base}${path}`;
  }
  return path;
}

export default api;


