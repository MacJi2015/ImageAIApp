import { create } from 'zustand';

/** 分享弹窗可携带的 payload，用于 Share API */
export interface SharePayload {
  url?: string;
  title?: string;
  message?: string;
  /** 反馈/举报目标内容 ID（如 feed id / taskId） */
  feedbackTargetId?: string | number;
  /** 举报目标类型：feed 视频 / 模版视频 */
  reportTargetType?: 'feed' | 'template';
  /** 举报/屏蔽成功后的回调（用于页面返回与列表刷新） */
  onModerationDone?: () => void;
  /** 为 true 时弹窗显示「同时分享到社区」行；需同时传 communityShareTaskId（任务 ID / taskId） */
  showCommunityShareOption?: boolean;
  /**
   * 视频任务 ID（与列表/详情的 taskId，UUID）；请求 shareVideoToCommunity 时作为 query taskId 传递。
   * 未传或空字符串则不展示勾选，也不会请求社区接口。
   */
  communityShareTaskId?: string;
  /** 是否同时分享到 PetsGO 社区；由分享弹窗勾选，仅当展示社区行时写入 */
  shareToCommunity?: boolean;
}

export interface UgcConsentModalCallbacks {
  onAgreed?: () => void;
  onDisagreed?: () => void;
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
  /** 全局 UGC 协议弹窗显隐 */
  showUgcConsentModal: boolean;
  ugcConsentCallbacks: UgcConsentModalCallbacks | null;
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
  openUgcConsentModal: (callbacks?: UgcConsentModalCallbacks) => void;
  closeUgcConsentModal: () => void;
  /** 三方登录等写入新 token 后调用，触发各页刷新 */
  notifyAuthSessionChanged: () => void;
  /** 正在请求后端 snsThreePartyLogin / 兑换登录（Firebase 等前置步骤完成后为 true） */
  socialLoginSubmitting: boolean;
  setSocialLoginSubmitting: (value: boolean) => void;
  /** loadAuth 已跑完，避免冷启动尚未恢复 token 就弹登录 */
  authHydrated: boolean;
  setAuthHydrated: (value: boolean) => void;
  /** MainTabs 底栏背景是否半透明 */
  tabBarTranslucent: boolean;
  setTabBarTranslucent: (value: boolean) => void;
  /** Feed 数据变更（详情点赞等）后递增，用于触发 Home/FeedTab 刷新 */
  feedRefreshEpoch: number;
  notifyFeedRefresh: () => void;
  /** 本地立即隐藏的 Feed ID（举报/屏蔽后用于即时从列表移除） */
  hiddenModeratedFeedIds: string[];
  hideModeratedFeedId: (feedId: string) => void;
  clearHiddenModeratedFeedIds: () => void;

  /** 全局轻提示（Toast） */
  toastMessage: string | null;
  toastEpoch: number;
  showToast: (message: string) => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>(set => ({
  isDarkMode: false,
  userName: null,
  showLoginModal: false,
  showShareModal: false,
  sharePayload: null,
  showPremiumModal: false,
  showUgcConsentModal: false,
  ugcConsentCallbacks: null,
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
  openUgcConsentModal: callbacks =>
    set({
      showUgcConsentModal: true,
      ugcConsentCallbacks: callbacks ?? null,
    }),
  closeUgcConsentModal: () =>
    set({
      showUgcConsentModal: false,
      ugcConsentCallbacks: null,
    }),
  notifyAuthSessionChanged: () =>
    set(state => ({ authSessionEpoch: state.authSessionEpoch + 1 })),
  socialLoginSubmitting: false,
  setSocialLoginSubmitting: value => set({ socialLoginSubmitting: value }),
  authHydrated: false,
  setAuthHydrated: value => set({ authHydrated: value }),
  tabBarTranslucent: false,
  setTabBarTranslucent: value => set({ tabBarTranslucent: value }),
  feedRefreshEpoch: 0,
  notifyFeedRefresh: () => set(state => ({ feedRefreshEpoch: state.feedRefreshEpoch + 1 })),
  hiddenModeratedFeedIds: [],
  hideModeratedFeedId: (feedId: string) =>
    set(state => {
      const id = feedId.trim();
      if (!id || state.hiddenModeratedFeedIds.includes(id)) return state;
      return { hiddenModeratedFeedIds: [...state.hiddenModeratedFeedIds, id] };
    }),
  clearHiddenModeratedFeedIds: () => set({ hiddenModeratedFeedIds: [] }),

  toastMessage: null,
  toastEpoch: 0,
  showToast: (message: string) =>
    set(state => ({ toastMessage: message, toastEpoch: state.toastEpoch + 1 })),
  clearToast: () => set({ toastMessage: null }),
}));
