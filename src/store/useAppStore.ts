import { create } from 'zustand';

/** 分享弹窗可携带的 payload，用于 Share API */
export interface SharePayload {
  url?: string;
  title?: string;
  message?: string;
  /** 为 true 时弹窗显示「同时分享到社区」行；仅部分入口需要（如我的页），不会传给原生分享 */
  showCommunityShareOption?: boolean;
  /** 是否同时分享到 PetsGO 社区；由分享弹窗勾选，仅当 showCommunityShareOption 为 true 时写入 */
  shareToCommunity?: boolean;
}

export interface AppState {
  isDarkMode: boolean;
  userName: string | null;
  /** 全局登录弹窗显隐，需要登录的页面可 setShowLoginModal(true) */
  showLoginModal: boolean;
  /** 全局分享弹窗显隐，任意页面可 openShareModal(payload) */
  showShareModal: boolean;
  sharePayload: SharePayload | null;
  /** 全局购买会员弹窗显隐，任意页面可 openPremiumModal() */
  showPremiumModal: boolean;
  /**
   * 登录成功等导致 token/用户态变化时递增；用于当前已聚焦的 Tab 在未失焦时也能重新拉取依赖登录态的数据。
   */
  authSessionEpoch: number;
  setDarkMode: (value: boolean) => void;
  setUserName: (name: string | null) => void;
  toggleTheme: () => void;
  setShowLoginModal: (show: boolean) => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openShareModal: (payload?: SharePayload) => void;
  closeShareModal: () => void;
  openPremiumModal: () => void;
  closePremiumModal: () => void;
  /** 三方登录等写入新 token 后调用，触发各页刷新 */
  notifyAuthSessionChanged: () => void;
  /** 正在请求后端 snsThreePartyLogin / 兑换登录（Firebase 等前置步骤完成后为 true） */
  socialLoginSubmitting: boolean;
  setSocialLoginSubmitting: (value: boolean) => void;
  /** loadAuth 已跑完，避免冷启动尚未恢复 token 就弹登录 */
  authHydrated: boolean;
  setAuthHydrated: (value: boolean) => void;
}

export const useAppStore = create<AppState>(set => ({
  isDarkMode: false,
  userName: null,
  showLoginModal: false,
  showShareModal: false,
  sharePayload: null,
  showPremiumModal: false,
  authSessionEpoch: 0,

  setDarkMode: value => set({ isDarkMode: value }),
  setUserName: name => set({ userName: name }),
  toggleTheme: () => set(state => ({ isDarkMode: !state.isDarkMode })),
  setShowLoginModal: show => set({ showLoginModal: show }),
  openLoginModal: () => set({ showLoginModal: true }),
  closeLoginModal: () => set({ showLoginModal: false }),
  openShareModal: payload => set({ showShareModal: true, sharePayload: payload ?? null }),
  closeShareModal: () => set({ showShareModal: false, sharePayload: null }),
  openPremiumModal: () => set({ showPremiumModal: true }),
  closePremiumModal: () => set({ showPremiumModal: false }),
  notifyAuthSessionChanged: () =>
    set(state => ({ authSessionEpoch: state.authSessionEpoch + 1 })),
  socialLoginSubmitting: false,
  setSocialLoginSubmitting: value => set({ socialLoginSubmitting: value }),
  authHydrated: false,
  setAuthHydrated: value => set({ authHydrated: value }),
}));
