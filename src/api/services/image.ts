import { get, post } from '../request';

export interface GenerateImageParams {
  prompt: string;
  width?: number;
  height?: number;
}

export interface GenerateImageResult {
  taskId: string;
  imageUrl?: string;
  status: 'pending' | 'completed' | 'failed';
}

/** 提交文生图任务 */
export const generateImage = (params: GenerateImageParams) =>
  post<GenerateImageResult>('/image/generate', params);

/** 查询任务结果（轮询用） */
export const getTaskResult = (taskId: string) =>
  get<GenerateImageResult>(`/image/task/${taskId}`);
