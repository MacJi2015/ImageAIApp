import { create } from 'zustand';

export interface UserInfo {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  /** 是否会员，不传或 false 为免费版 */
  isPremium?: boolean;
  /** 会员到期日 ISO 字符串，如 "2025-03-24"，用于展示 "X days remaining" */
  premiumExpireAt?: string;
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

export const useUserStore = create<UserState>(set => ({
  isLoggedIn: DEMO_MEMBER,
  token: DEMO_MEMBER ? 'demo' : null,
  user: DEMO_MEMBER ? defaultMemberUser : null,

  setToken: token => set({ token, isLoggedIn: !!token }),
  setUser: user => set({ user }),
  login: (token, user) => set({ token, user, isLoggedIn: true }),
  logout: () => set({ token: null, user: null, isLoggedIn: false }),
}));
