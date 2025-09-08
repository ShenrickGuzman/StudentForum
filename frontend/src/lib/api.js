import axios from 'axios';

function withApiPath(url) {
  if (!url) return 'http://localhost:5000/api';
  return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`;
}

const rawBase = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : undefined) || process.env.REACT_APP_API_URL;
const api = axios.create({ baseURL: withApiPath(rawBase) });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;


