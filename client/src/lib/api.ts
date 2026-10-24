const BASE_URL = '/api/v1';

export class ApiError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: unknown;

  constructor(message: string, statusCode: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem('turfbook_access_token');

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // for HttpOnly refresh cookie
  });

  // Handle 401 Token Expiry & Automatic Refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken: string) => {
            headers.set('Authorization', `Bearer ${newToken}`);
            fetch(url, { ...options, headers, credentials: 'include' })
              .then((res) => res.json())
              .then((data) => resolve(data.data || data))
              .catch(reject);
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!refreshRes.ok) {
        throw new Error('Refresh failed');
      }

      const refreshData = await refreshRes.json();
      const newAccessToken = refreshData.data?.accessToken;

      if (newAccessToken) {
        localStorage.setItem('turfbook_access_token', newAccessToken);
        processQueue(null, newAccessToken);
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        const retryRes = await fetch(url, { ...options, headers, credentials: 'include' });
        const retryData = await retryRes.json();
        return retryData.data !== undefined ? retryData.data : retryData;
      }
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      localStorage.removeItem('turfbook_access_token');
      localStorage.removeItem('turfbook_user');
      window.dispatchEvent(new Event('auth:logout'));
      throw new ApiError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED');
    } finally {
      isRefreshing = false;
    }
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = body?.error?.message || response.statusText || 'Request failed';
    const errorCode = body?.error?.code;
    const errorDetails = body?.error?.details;
    throw new ApiError(errorMsg, response.status, errorCode, errorDetails);
  }

  return (body?.data !== undefined ? body.data : body) as T;
}

export const api = {
  get: <T>(url: string, options?: RequestInit) => request<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, data?: unknown, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(url: string, data?: unknown, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(url: string, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};
