// Auto-approve pending post setting
export function getAutoApproveSetting() {
  return api.get('/settings/auto-approve');
}

export function setAutoApproveSetting(enabled) {
  return api.post('/settings/auto-approve', { enabled });
}
// Report a post
export function reportPost(postId, reason) {
  return api.post(`/posts/${postId}/report`, { reason });
}

// Report a comment
export function reportComment(commentId, reason) {
  return api.post(`/posts/comment/${commentId}/report`, { reason });
}

// Admin: Get all reports
export function getReports() {
  return api.get('/posts/reports');
}

// Admin: Remove reported post
export function removeReportedPost(postId) {
  return api.delete(`/posts/reported-post/${postId}`);
}

// Admin: Remove reported comment
export function removeReportedComment(commentId) {
  return api.delete(`/posts/reported-comment/${commentId}`);
}

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


