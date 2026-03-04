import { apiConfig, DEFAULT_TOKEN } from './config';
import { ApiError, ApiResponse, RequestConfig } from './types';
import { useAppStore } from '../store/useAppStore';

let authToken: string | null =
  'oL8TR0BBZYtWb19Y2wpTTowL2U5b/Bv0PZCjdWiUIONtPjg4saQaFMxHFPJhQ1mntuVr0i+AsuFTT9b1IgpA+e1WRZNGM/XqAKyRspYwmYFLQ2NCeeQ0q4EEt6yn6QGK';

/** 401 时尝试刷新 token 的回调，返回 true 表示刷新成功可重试 */
let on401Callback: (() => Promise<boolean>) | null = null;

/** 设置鉴权 token，请求时会自动带在 Header Authorization 中 */
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

/** 设置 401 回调：token 失效时先执行刷新再重试一次请求 */
export const setOn401 = (cb: (() => Promise<boolean>) | null) => {
  on401Callback = cb;
};

/** 获取当前请求使用的 baseURL */
export const getBaseURL = () => apiConfig.baseURL;

const buildURL = (path: string, params?: RequestConfig['params']): string => {
  const base = path.startsWith('http')
    ? path
    : `${apiConfig.baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  if (!params || Object.keys(params).length === 0) return base;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') search.append(k, String(v));
  });
  const query = search.toString();
  return query ? `${base}?${query}` : base;
};

const timeoutPromise = (ms: number): Promise<never> =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new ApiError('请求超时', -1, undefined)), ms),
  );

/** 11011 未登录或登录态已失效；11016 token 失效或登录状态异常 → 统一跳转登录 */
const LOGIN_REQUIRED_CODES = ['11011', '11016'];

function isLoginRequiredCode(raw: unknown): boolean {
  if (raw == null || typeof raw !== 'object') return false;
  const code = (raw as Record<string, unknown>).code;
  if (code === undefined) return false;
  const s = String(code);
  return LOGIN_REQUIRED_CODES.includes(s);
}

function openLoginModalIfNeeded(raw: unknown): void {
  if (isLoginRequiredCode(raw)) {
    useAppStore.getState().openLoginModal();
  }
}

/** 开发环境统一打印接口请求/响应（含完整 URL、参数，不打印敏感 token） */
function logRequest(
  method: string,
  path: string,
  url: string,
  config: RequestConfig,
): void {
  if (!__DEV__) return;
  const { params, data, headers = {} } = config;
  const safeHeaders: Record<string, string> = {};
  Object.entries(headers).forEach(([k, v]) => {
    const lower = k.toLowerCase();
    if (lower === 'token' || lower === 'authorization')
      safeHeaders[k] = v ? '[已带]' : '';
    else safeHeaders[k] = String(v);
  });
  const logPayload: Record<string, unknown> = {
    method,
    path,
    url,
    ...(params && Object.keys(params).length > 0 ? { params } : {}),
    ...(data !== undefined ? { body: data } : {}),
    ...(Object.keys(safeHeaders).length > 0 ? { headers: safeHeaders } : {}),
  };
  console.log('[API] 请求', logPayload);
}

/** 开发环境统一打印接口响应 */
function logResponse(path: string, status: number, result: unknown): void {
  if (!__DEV__) return;
  console.log('[API] 响应', { path, status, result });
}

/**
 * 统一请求方法，供外部或封装后的 get/post 等调用
 * @param path 路径或完整 URL
 * @param config 请求配置
 * @returns 解析后的 data（若后端是 { code, data, message } 会取 data；否则返回整份 body）
 */
export async function request<T = unknown>(
  path: string,
  config: RequestConfig = {},
): Promise<T> {
  const {
    method = 'GET',
    data,
    params,
    headers = {},
    timeout = apiConfig.defaultTimeout,
  } = config;

  const url = buildURL(path, params);
  logRequest(method, path, url, { params, data, headers });
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (authToken) {
    requestHeaders.token = authToken;
  }

  const init: RequestInit = {
    method,
    headers: requestHeaders,
  };
  if (data !== undefined && method !== 'GET') {
    init.body = typeof data === 'string' ? data : JSON.stringify(data);
  }

  const fetchPromise = fetch(url, init);
  const racePromise =
    timeout > 0
      ? Promise.race([fetchPromise, timeoutPromise(timeout)])
      : fetchPromise;

  let response = (await racePromise) as Response;
  let contentType = response.headers.get('content-type') || '';
  let isJson = contentType.includes('application/json');
  let raw: unknown = isJson
    ? await response.json().catch(() => ({}))
    : await response.text();

  if (!response.ok) {
    if (response.status === 401 && on401Callback) {
      const refreshed = await on401Callback();
      if (refreshed) {
        const retryHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...headers,
        };
        if (authToken) retryHeaders.token = authToken;
        const retryInit: RequestInit = { method, headers: retryHeaders };
        if (data !== undefined && method !== 'GET') {
          retryInit.body =
            typeof data === 'string' ? data : JSON.stringify(data);
        }
        const retryPromise = fetch(url, retryInit);
        const retryRace =
          timeout > 0
            ? Promise.race([retryPromise, timeoutPromise(timeout)])
            : retryPromise;
        response = (await retryRace) as Response;
        contentType = response.headers.get('content-type') || '';
        isJson = contentType.includes('application/json');
        raw = isJson
          ? await response.json().catch(() => ({}))
          : await response.text();
      }
    }
    if (!response.ok) {
      openLoginModalIfNeeded(raw);
      logResponse(path, response.status, raw);
      const message =
        isJson && typeof raw === 'object' && raw && 'message' in raw
          ? String((raw as { message?: string }).message)
          : raw && typeof raw === 'string'
          ? raw
          : `请求失败 ${response.status}`;
      if (__DEV__) {
        console.warn('[API] 请求失败', {
          path,
          status: response.status,
          message,
        });
      }
      throw new ApiError(
        message,
        (raw as ApiResponse)?.code ?? -1,
        response.status,
        raw,
      );
    }
  }

  if (isJson && raw && typeof raw === 'object' && isLoginRequiredCode(raw)) {
    openLoginModalIfNeeded(raw);
    const message = (raw as { message?: string }).message ?? '请登录后再试';
    throw new ApiError(
      String(message),
      Number((raw as { code?: string }).code) || -1,
      undefined,
      raw,
    );
  }

  if (isJson && raw && typeof raw === 'object' && 'data' in raw) {
    const data = (raw as ApiResponse<T>).data as T;
    const full = raw as Record<string, unknown>;
    // 后端可能把 token 放在响应顶层而非 data 内，合并到返回值以免丢失
    if (
      full.token !== undefined &&
      (data as Record<string, unknown>)?.token === undefined
    ) {
      const result = { ...(data as object), token: full.token } as T;
      logResponse(path, response.status, {
        ...(result as object),
        token: '[已省略]',
      });
      return result;
    }
    logResponse(path, response.status, data);
    return data;
  }
  logResponse(path, response.status, raw);
  return raw as T;
}

export const get = <T = unknown>(
  path: string,
  config?: Omit<RequestConfig, 'method' | 'data'>,
) => request<T>(path, { ...config, method: 'GET' });

export const post = <T = unknown>(
  path: string,
  data?: unknown,
  config?: Omit<RequestConfig, 'method' | 'data'>,
) => request<T>(path, { ...config, method: 'POST', data });

export const put = <T = unknown>(
  path: string,
  data?: unknown,
  config?: Omit<RequestConfig, 'method' | 'data'>,
) => request<T>(path, { ...config, method: 'PUT', data });

export const patch = <T = unknown>(
  path: string,
  data?: unknown,
  config?: Omit<RequestConfig, 'method' | 'data'>,
) => request<T>(path, { ...config, method: 'PATCH', data });

export const del = <T = unknown>(
  path: string,
  config?: Omit<RequestConfig, 'method' | 'data'>,
) => request<T>(path, { ...config, method: 'DELETE' });
