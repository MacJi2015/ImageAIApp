import { apiConfig } from './config';
import { ApiError, ApiResponse, RequestConfig } from './types';
import { useAppStore } from '../store/useAppStore';

let authToken: string | null =
  'oL8TR0BBZYtWb19Y2wpTTJ620JoKEtCiPZCjdWiUIONgSJxlayvSW/pDGVm6q8zJz6YD14a1KHZ6Wny2SgNgFxib4R3oM94+AKyRspYwmYEKg2uR6weUE7zSTc7cbZrm';

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

/** 登录 / OAuth / 三方登录等公开接口：不自动带全局 token，避免旧 token 先被后端拦截 */
function isPublicLoginPath(path: string): boolean {
  let p = path.trim();
  if (p.startsWith('http://') || p.startsWith('https://')) {
    try {
      p = new URL(p).pathname;
    } catch {
      return false;
    }
  }
  p = p.replace(/^\//, '').split('?')[0];
  if (p.startsWith('auth/')) return true;
  if (
    p === 'app/user/snsThreePartyLogin' ||
    p.endsWith('/snsThreePartyLogin')
  ) {
    return true;
  }
  return false;
}

/** 开发环境：三方登录 / OAuth 等公开路径发出前，打印最终 Header（与真实请求一致，含明文 token 便于核对） */
function logPublicAuthOutgoingHeaders(
  path: string,
  requestHeaders: Record<string, string>,
  meta: {
    omitToken: boolean;
    skipAuth: boolean;
    hasStoredToken: boolean;
  },
): void {
  if (!__DEV__ || !isPublicLoginPath(path)) return;
  const sentToken = Boolean(
    requestHeaders.token ||
      requestHeaders.Token ||
      requestHeaders.authorization ||
      requestHeaders.Authorization,
  );
  console.log('[API][三方/登录 Header 自检]', {
    path,
    实际请求是否含token类头: sentToken,
    已跳过自动附加全局token: meta.omitToken,
    skipAuth配置: meta.skipAuth,
    内存里是否有全局authToken: meta.hasStoredToken,
    headers: { ...requestHeaders },
  });
}

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
  // if (isLoginRequiredCode(raw)) {
  //   useAppStore.getState().openLoginModal();
  // }
}

/**
 * 开发环境：打印即将发出的请求（headers 为合并后的最终值，含明文 token 便于核对）。
 * 仅 __DEV__ 输出；Release 不会调用。
 */
function logRequestOutgoing(
  method: string,
  path: string,
  url: string,
  params: RequestConfig['params'] | undefined,
  data: unknown,
  requestHeaders: Record<string, string>,
): void {
  if (!__DEV__) return;
  const logPayload: Record<string, unknown> = {
    method,
    path,
    url,
    ...(params && Object.keys(params).length > 0 ? { params } : {}),
    ...(data !== undefined ? { body: data } : {}),
    headers: { ...requestHeaders },
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
    skipAuth = false,
  } = config;

  const url = buildURL(path, params);
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  const omitToken = skipAuth || isPublicLoginPath(path);
  if (authToken && !omitToken) {
    requestHeaders.token = authToken;
  }
  logRequestOutgoing(method, path, url, params, data, requestHeaders);
  logPublicAuthOutgoingHeaders(path, requestHeaders, {
    omitToken,
    skipAuth,
    hasStoredToken: Boolean(authToken),
  });

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
        if (authToken && !omitToken) retryHeaders.token = authToken;
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
        token: full.token,
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
