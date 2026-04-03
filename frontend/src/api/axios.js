import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터 — JWT 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mom_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 응답 인터셉터 — 401 자동 리다이렉트 + 에러 정규화
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mom_token');
      localStorage.removeItem('mom_user');
      window.location.href = '/login';
    }
    // 에러 메시지를 항상 string으로 정규화
    if (err.response?.data && typeof err.response.data.error === 'object') {
      err.response.data.error = err.response.data.error.message || JSON.stringify(err.response.data.error);
    }
    return Promise.reject(err);
  }
);

export default api;
