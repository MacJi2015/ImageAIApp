import { post } from '../request';
import { useUserStore } from '../../store/useUserStore';

/** 提交反馈请求参数 */
export interface SubmitFeedbackParams {
  /** 问题描述（必填） */
  issue: string;
  /** 邮箱（选填，用于回复） */
  email?: string;
}

/**
 * 提交用户反馈
 * POST /app/user/submitFeedback，token 放在 header，body 为 { email?, issue }
 */
export async function submitFeedback(params: SubmitFeedbackParams): Promise<boolean> {
  const token = useUserStore.getState().token;
  const res = await post<boolean>('app/user/submitFeedback', params, {
    headers: token ? { token } : {},
  });
  return res as boolean;
}
