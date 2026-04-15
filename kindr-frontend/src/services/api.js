// src/services/api.js — Axios instance + all API calls
import axios from 'axios';

// ── Dynamically use current hostname so it works on any device ──
const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  // Auto-detect: use same IP/hostname as frontend, port 5000
  const hostname = window.location.hostname;
  return `http://${hostname}:5000/api`;
};

const BASE = getBaseURL();

const api = axios.create({ baseURL: BASE, withCredentials: true });

// ── Attach access token to every request ──────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-refresh on 401 ───────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const rt = localStorage.getItem('refreshToken');
        if (!rt) throw new Error('No refresh token');
        const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken: rt });
        localStorage.setItem('accessToken',  data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login',    data),
  logout:   ()      => api.post('/auth/logout'),
  me:       ()      => api.get('/auth/me'),
  refresh:  (token) => api.post('/auth/refresh', { refreshToken: token }),
};

// ── Posts ─────────────────────────────────────────────
export const postsAPI = {
  getFeed:      (page = 1, limit = 20) => api.get(`/posts/feed?page=${page}&limit=${limit}`),
  getPost:      (id)                   => api.get(`/posts/${id}`),
  getUserPosts: (userId, page = 1)     => api.get(`/posts/user/${userId}?page=${page}`),
  create:       (formData)             => api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete:       (id)        => api.delete(`/posts/${id}`),
  react:        (id, emoji) => api.post(`/posts/${id}/react`, { emoji }),
};

// ── Friends ───────────────────────────────────────────
export const friendsAPI = {
  getAll:      ()                     => api.get('/friends'),
  getRequests: ()                     => api.get('/friends/requests'),
  sendRequest: (to_username, message) => api.post('/friends/request', { to_username, message }),
  respond:     (request_id, action)   => api.post('/friends/respond', { request_id, action }),
  remove:      (friendId)             => api.delete(`/friends/${friendId}`),
};

// ── Parent ────────────────────────────────────────────
export const parentAPI = {
  linkChild:      (child_username)     => api.post('/parent/link-child',   { child_username }),
  confirmLink:    (parent_id)          => api.post('/parent/confirm-link', { parent_id }),
  getChildren:    ()                   => api.get('/parent/children'),
  getDashboard:   (childId)            => api.get(`/parent/dashboard/${childId}`),
  updateControls: (childId, controls)  => api.put(`/parent/controls/${childId}`, controls),
  approveFriend:  (request_id, action) => api.post('/parent/approve-friend', { request_id, action }),
};

export default api;