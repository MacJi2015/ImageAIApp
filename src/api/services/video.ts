import { get, post } from '../request';

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
  /** 发布到 Feed 后可能返回，用于删除社区作品等 */
  feedId?: string;
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
