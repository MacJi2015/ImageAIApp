import { apiConfig } from '../config';
import { ApiError } from '../types';
import { useUserStore } from '../../store/useUserStore';

/** 上传图片接口响应 */
export interface ImageUploadResult {
  /** 资源访问 URL，用于头像等 */
  url: string;
  /** 文件大小（字节） */
  total: number;
}

/**
 * 上传图片（multipart/form-data）
 * POST /app/user/files/imageUpload
 * @param fileUri 本地文件 URI（相册或拍照返回的 uri）
 * @param key 可选，上传用途 key
 * @returns 返回 { url, total }，url 用于更新用户头像等
 */
export async function uploadImage(
  fileUri: string,
  key?: string
): Promise<ImageUploadResult> {
  const token = useUserStore.getState().token;
  if (!token) {
    throw new ApiError('请先登录', 401);
  }

  const base = apiConfig.baseURL.replace(/\/$/, '');
  const path = 'app/user/files/imageUpload';
  const query = key ? `?key=${encodeURIComponent(key)}` : '';
  const url = `${base}/${path.replace(/^\//, '')}${query}`;

  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    type: 'image/jpeg',
    name: 'avatar.jpg',
  } as unknown as Blob);

  const headers: Record<string, string> = {
    token,
  };
  // 不设置 Content-Type，让 RN 自动带 multipart/form-data; boundary=...

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const raw = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message =
      isJson && typeof raw === 'object' && raw && 'message' in raw
        ? String((raw as { message?: string }).message)
        : typeof raw === 'string'
          ? raw
          : `上传失败 ${res.status}`;
    throw new ApiError(message, (raw as { code?: number })?.code ?? -1, res.status, raw);
  }

  const result = typeof raw === 'object' && raw && 'url' in raw
    ? (raw as ImageUploadResult)
    : (raw as ImageUploadResult);
  return {
    url: result?.url ?? '',
    total: result?.total ?? 0,
  };
}
