import { get, post } from '../request';
import type { UserInfo } from '../../store/useUserStore';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: UserInfo;
}

/** 登录 */
export const login = (params: LoginParams) =>
  post<LoginResult>('/auth/login', params);

/** 获取当前用户信息 */
export const getCurrentUser = () =>
  get<UserInfo>('/user/me');
