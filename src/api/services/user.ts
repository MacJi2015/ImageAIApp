import CryptoJS from 'crypto-js';
import { get, post } from '../request';
import { setAuthToken } from '../request';
import { useUserStore } from '../../store/useUserStore';
import type { UserInfo } from '../../store/useUserStore';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: UserInfo;
}

/** 用户基本信息（接口 GET /app/user/profile 返回结构） */
export interface UserProfile {
  account?: string;
  email?: string;
  extraId?: number;
  extraName?: string;
  /** 性别: 0-未知 1-男 2-女 */
  gender?: number;
  /** 用户账号ID */
  id?: number;
  mobile?: string;
  /** 显示名称/姓名 */
  name?: string;
  nickname?: string;
  openId?: string;
  /** 注册来源: 1-手机号 2-邮箱 3-微信 4-支付宝 5-Google 6-Apple 7-Meta */
  registerFrom?: number;
  /** 账号统一ID */
  tid?: number;
  /** 用户头像地址 */
  userAvatar?: string;
}

/** 登录 */
export const login = (params: LoginParams) =>
  post<LoginResult>('/auth/login', params);

/** 获取当前用户信息（旧接口，若后端已切到 profile 可用 getProfile） */
export const getCurrentUser = () =>
  get<UserInfo>('/user/me');

/**
 * 获取用户基本信息
 * GET /app/user/profile，token 放在 header
 */
export async function getProfile(): Promise<UserProfile> {
  const token = useUserStore.getState().token;
  const res = await get<UserProfile>('app/user/profile', {
    headers: token ? { token } : {},
  });
  return res as UserProfile;
}

/** 修改用户资料参数（POST /app/user/updateProfile 的 body，均为可选） */
export interface UpdateUserProfileParam {
  nickname?: string;
  name?: string;
  email?: string;
  mobile?: string;
  /** 性别: 1-男 2-女 */
  gender?: number;
  userAvatar?: string;
}

/**
 * 修改用户信息
 * POST /app/user/updateProfile，token 放在 header，body 为 UpdateUserProfileParam
 * @returns 成功返回 true
 */
export async function updateProfile(params: UpdateUserProfileParam): Promise<boolean> {
  const token = useUserStore.getState().token;
  const res = await post<boolean>('app/user/updateProfile', params, {
    headers: token ? { token } : {},
  });
  return res as boolean;
}

/** 将接口 UserProfile 转为应用内 UserInfo，便于写入 store */
export function profileToUserInfo(p: UserProfile): UserInfo {
  return {
    id: p.id != null ? String(p.id) : '',
    name: p.name ?? p.nickname ?? '',
    avatar: p.userAvatar,
    email: p.email,
  };
}

/**
 * 退出登录（服务端登出）
 * GET /app/user/logout，token 放在 header，成功后再清除本地 token
 */
export async function logoutApi(): Promise<boolean> {
  const token = useUserStore.getState().token;
  const res = await get<boolean>('app/user/logout', {
    headers: token ? { token } : {},
  });
  return res as boolean;
}

/** 刷新 token 接口返回结构 */
export interface RefreshTokenResponse {
  token: string;
  userProfile: UserProfile;
}

/**
 * 刷新过期 token
 * GET /app/user/refreshToken，header 传 token（失效token）+ uid（用户ID的MD5）
 * 返回新 token 与 userProfile，成功后可更新本地 token 与用户信息
 */
export async function refreshTokenApi(): Promise<RefreshTokenResponse> {
  const { token, user } = useUserStore.getState();
  if (!token || !user?.id) {
    throw new Error('未登录或缺少用户ID');
  }
  const uid = CryptoJS.MD5(user.id).toString();
  const res = await get<RefreshTokenResponse>('app/user/refreshToken', {
    headers: { token, uid },
  });
  return res as RefreshTokenResponse;
}

/**
 * 刷新 token 并写入 store 与请求层；失败则抛出
 * 可在收到 401 时调用，成功后重试原请求
 */
export async function refreshTokenAndApply(): Promise<void> {
  const res = await refreshTokenApi();
  const { setToken, setUser } = useUserStore.getState();
  setAuthToken(res.token);
  setToken(res.token);
  const base = profileToUserInfo(res.userProfile);
  const current = useUserStore.getState().user;
  setUser({
    ...base,
    isPremium: current?.isPremium,
    premiumExpireAt: current?.premiumExpireAt,
  });
}
