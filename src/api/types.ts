/** 请求配置 */
export interface RequestConfig {
  /** 请求方法 */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** 请求体（对象会 JSON.stringify） */
  data?: unknown;
  /** URL 查询参数 */
  params?: Record<string, string | number | boolean | undefined>;
  /** 额外请求头 */
  headers?: Record<string, string>;
  /** 超时时间（毫秒） */
  timeout?: number;
}

/** 标准 API 响应结构（可按后端实际调整） */
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message?: string;
}

/** 请求错误，便于外部统一 catch 处理 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public statusCode?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
