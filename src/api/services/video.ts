import { get, post } from '../request';
import { useUserStore } from '../../store/useUserStore';

/** 视频状态：PENDING-待处理, PROCESSING-生成中, SUCCESS-成功, FAILED-失败 */
export type VideoTaskStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export interface AppVideoTask {
  id: number;
  taskId: string;
  userId: number;
  status: VideoTaskStatus;
  actionType?: string;
  aServiceProvider?: string;
  aTaskId?: string;
  createdTime?: string;
  modifiedTime?: string;
  duration?: number;
  errorMessage?: string;
  petImageUrl?: string;
  promptText?: string;
  removeWatermark?: boolean;
  shareToCommunity?: boolean;
  templateId?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
}

export interface MyVideosResponse {
  list: AppVideoTask[];
  pageNum: number;
  pageSize: number;
  totalPage: number;
  totalRecord: number;
  message?: string;
  responseCode?: string;
  exception?: string;
  traceId?: string;
}

export interface GetMyVideosParams {
  pageNum?: number;
  pageSize?: number;
  /** 视频状态筛选 */
  status?: string;
}

/**
 * 获取用户创作的视频列表
 * GET /facial/app/user/myVideos，token 放在 header
 */
export async function getMyVideos(
  params?: GetMyVideosParams,
): Promise<MyVideosResponse> {
  const res = await get<MyVideosResponse>('app/user/myVideos', {
    params: {
      pageNum: params?.pageNum ?? 1,
      pageSize: params?.pageSize ?? 20,
      ...(params?.status ? { status: params.status } : {}),
    },
  });
  return (res as unknown as { entry: MyVideosResponse }).entry;
}

// --- 图生视频 ---

export interface VideoGenerateRequest {
  actionType: string;
  duration?: number;
  petImageUrl: string;
  promptText?: string;
  removeWatermark?: boolean;
  shareToCommunity?: boolean;
  templateId?: string;
}

export interface VideoGenerateResponse {
  estimatedTime: number;
  status: string;
  taskId: string;
}

/** 任务状态响应（与 AppVideoTask 字段对齐） */
export interface VideoTaskResponse {
  actionType?: string;
  aiServiceProvider?: string;
  aiTaskId?: string;
  createdTime?: string;
  duration?: number;
  errorMessage?: string;
  id?: number;
  modifiedTime?: string;
  petImageUrl?: string;
  promptText?: string;
  removeWatermark?: boolean;
  shareToCommunity?: boolean;
  status: VideoTaskStatus;
  taskId: string;
  templateId?: string;
  thumbnailUrl?: string;
  userId?: number;
  videoUrl?: string;
}

/**
 * 提交视频生成任务
 * POST /facial/app/video/generate
 */
export async function generateVideo(
  request: VideoGenerateRequest,
): Promise<VideoGenerateResponse> {
  // const token = useUserStore.getState().token;
  // if (!token) {
  //   throw new Error('请先登录');
  // }

  const res = await post<VideoGenerateResponse>('app/video/generate', request);
  return (res as unknown as { entry: VideoGenerateResponse }).entry;
}

/**
 * 查询视频任务状态
 * GET /facial/app/video/task/{taskId}
 */
export async function getVideoTaskStatus(
  taskId: string,
): Promise<VideoTaskResponse> {
  // const token = useUserStore.getState().token;
  const res = await get<VideoTaskResponse | { entry: VideoTaskResponse }>(
    `app/video/task/${taskId}`,
  );
  return (res as unknown as { entry: VideoTaskResponse }).entry;
}

/**
 * 删除用户视频任务（同时删除关联社区 Feed）
 * POST app/user/deleteVideo?id=...，Content-Type: application/x-www-form-urlencoded；token 由 request 层 header 携带
 */
export async function deleteUserVideo(id: number): Promise<boolean> {
  const res = await post<unknown>('app/user/deleteVideo', undefined, {
    params: { id },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (typeof res === 'boolean') return res;
  if (res && typeof res === 'object') {
    const o = res as Record<string, unknown>;
    if (typeof o.entry === 'boolean') return o.entry;
    if (typeof o.data === 'boolean') return o.data;
  }
  return true;
}
