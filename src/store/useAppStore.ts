import { create } from 'zustand';

export interface AppState {
  // 示例状态，按需扩展
  isDarkMode: boolean;
  userName: string | null;
  // actions
  setDarkMode: (value: boolean) => void;
  setUserName: (name: string | null) => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>(set => ({
  isDarkMode: false,
  userName: null,

  setDarkMode: value => set({ isDarkMode: value }),
  setUserName: name => set({ userName: name }),
  toggleTheme: () => set(state => ({ isDarkMode: !state.isDarkMode })),
}));
