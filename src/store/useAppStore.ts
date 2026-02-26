import { create } from 'zustand';

/** 分享弹窗可携带的 payload，用于 Share API */
export interface SharePayload {
  url?: string;
  title?: string;
  message?: string;
}

export interface AppState {
  isDarkMode: boolean;
  userName: string | null;
  /** 全局登录弹窗显隐，需要登录的页面可 setShowLoginModal(true) */
  showLoginModal: boolean;
  /** 全局分享弹窗显隐，任意页面可 openShareModal(payload) */
  showShareModal: boolean;
  sharePayload: SharePayload | null;
  setDarkMode: (value: boolean) => void;
  setUserName: (name: string | null) => void;
  toggleTheme: () => void;
  setShowLoginModal: (show: boolean) => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openShareModal: (payload?: SharePayload) => void;
  closeShareModal: () => void;
}

export const useAppStore = create<AppState>(set => ({
  isDarkMode: false,
  userName: null,
  showLoginModal: false,
  showShareModal: false,
  sharePayload: null,

  setDarkMode: value => set({ isDarkMode: value }),
  setUserName: name => set({ userName: name }),
  toggleTheme: () => set(state => ({ isDarkMode: !state.isDarkMode })),
  setShowLoginModal: show => set({ showLoginModal: show }),
  openLoginModal: () => set({ showLoginModal: true }),
  closeLoginModal: () => set({ showLoginModal: false }),
  openShareModal: payload => set({ showShareModal: true, sharePayload: payload ?? null }),
  closeShareModal: () => set({ showShareModal: false, sharePayload: null }),
}));
