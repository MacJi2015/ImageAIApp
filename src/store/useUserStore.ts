import { create } from 'zustand';

export interface UserInfo {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  /** 是否会员，不传或 false 为免费版 */
  isPremium?: boolean;
  /** 会员到期 / 订阅结束时间 ISO 或日期字符串，用于展示剩余天数或到期日 */
  premiumExpireAt?: string;
  /** 会员类型：Free | Pro（后端动态字段） */
  userType?: 'Free' | 'Pro';
  /** 获赞个数（后端动态字段） */
  likesAmount?: number;
  /** 视频数量（后端动态字段） */
  videosAmount?: number;
  /** 剩余可用次数（后端动态字段） */
  remainingQuota?: number;
}

export interface UserState {
  isLoggedIn: boolean;
  token: string | null;
  user: UserInfo | null;
  // actions
  setToken: (token: string | null) => void;
  setUser: (user: UserInfo | null) => void;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
}

/** 演示用：设为 true 时初始为会员状态，便于查看 PRO 徽章、PRO MEMBER、RENEW NOW 等 */
const DEMO_MEMBER = false;

const defaultMemberUser: UserInfo = {
  id: '1',
  name: 'SpacePup',
  email: 'sparky@petsgo.ai',
  isPremium: true,
  premiumExpireAt: '2026-04-24',
};

/** 未恢复本地会话前为未登录；loadAuth / 三方登录成功后写入 token */
export const useUserStore = create<UserState>(set => ({
  isLoggedIn: false,
  token: null,
  user: DEMO_MEMBER ? defaultMemberUser : null,

  setToken: token => set({ token, isLoggedIn: !!token }),
  setUser: user => set({ user }),
  login: (token, user) => set({ token, user, isLoggedIn: true }),
  logout: () => set({ token: null, user: null, isLoggedIn: false }),
}));
