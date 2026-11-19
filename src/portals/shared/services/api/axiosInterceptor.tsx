import axios from 'axios';
import { API_URL } from '../../config/env';
import {
  AUTH_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
} from '../../config/authStorage';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

axiosInstance.interceptors.request.use(config => {
  const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
  if (storedAuth) {
    const auth = JSON.parse(storedAuth) as { token?: string };
    if (auth.token) {
      config.headers.set('Authorization', `Bearer ${auth.token}`);
    }
  } else {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
      const token = JSON.parse(storedToken) as string;
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const language = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (language) {
    config.headers.set('Accept-Language', language);
  }

  return config;
});

export default axiosInstance;
