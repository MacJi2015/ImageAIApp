import { apiConfig } from './config';
import { ApiError, ApiResponse, RequestConfig } from './types';

let authToken: string | null = null;

/** 设置鉴权 token，请求时会自动带在 Header Authorization 中 */
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

/** 获取当前请求使用的 baseURL */
export const getBaseURL = () => apiConfig.baseURL;

const buildURL = (path: string, params?: RequestConfig['params']): string => {
  const base = path.startsWith('http') ? path : `${apiConfig.baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  if (!params || Object.keys(params).length === 0) return base;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') search.append(k, String(v));
  });
  const query = search.toString();
  return query ? `${base}?${query}` : base;
};

const timeoutPromise = (ms: number): Promise<never> =>
  new Promise((_, reject) => setTimeout(() => reject(new ApiError('请求超时', -1, undefined)), ms));

/**
 * 统一请求方法，供外部或封装后的 get/post 等调用
 * @param path 路径或完整 URL
 * @param config 请求配置
 * @returns 解析后的 data（若后端是 { code, data, message } 会取 data；否则返回整份 body）
 */
export async function request<T = unknown>(path: string, config: RequestConfig = {}): Promise<T> {
  const {
    method = 'GET',
    data,
    params,
    headers = {},
    timeout = apiConfig.defaultTimeout,
  } = config;

  const url = buildURL(path, params);
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`;
  }

  const init: RequestInit = {
    method,
    headers: requestHeaders,
  };
  if (data !== undefined && method !== 'GET') {
    init.body = typeof data === 'string' ? data : JSON.stringify(data);
  }

  const fetchPromise = fetch(url, init);
  const racePromise = timeout > 0 ? Promise.race([fetchPromise, timeoutPromise(timeout)]) : fetchPromise;

  const response = (await racePromise) as Response;
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const raw = isJson ? await response.json().catch(() => ({})) : await response.text();

  if (!response.ok) {
    const message = isJson && typeof raw === 'object' && raw && 'message' in raw
      ? String((raw as { message?: string }).message)
      : raw && typeof raw === 'string'
        ? raw
        : `请求失败 ${response.status}`;
    throw new ApiError(message, (raw as ApiResponse)?.code ?? -1, response.status, raw);
  }

  if (isJson && raw && typeof raw === 'object' && 'data' in raw) {
    return (raw as ApiResponse<T>).data as T;
  }
  return raw as T;
}

export const get = <T = unknown>(path: string, config?: Omit<RequestConfig, 'method' | 'data'>) =>
  request<T>(path, { ...config, method: 'GET' });

export const post = <T = unknown>(path: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'data'>) =>
  request<T>(path, { ...config, method: 'POST', data });

export const put = <T = unknown>(path: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'data'>) =>
  request<T>(path, { ...config, method: 'PUT', data });

export const patch = <T = unknown>(path: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'data'>) =>
  request<T>(path, { ...config, method: 'PATCH', data });

export const del = <T = unknown>(path: string, config?: Omit<RequestConfig, 'method' | 'data'>) =>
  request<T>(path, { ...config, method: 'DELETE' });
