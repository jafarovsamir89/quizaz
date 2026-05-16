import axios from 'axios';
import { getToken } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Always send a fresh token — Firebase caches it and only re-fetches when close to expiry
api.interceptors.request.use(async (config) => {
  const token = await getToken(true); // forceRefresh = true
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses gracefully (token truly invalid)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized – session may have expired');
    }
    return Promise.reject(error);
  },
);

export default api;

