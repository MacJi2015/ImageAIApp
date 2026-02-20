import { create } from 'zustand';

export interface UserInfo {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
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

export const useUserStore = create<UserState>(set => ({
  isLoggedIn: false,
  token: null,
  user: null,

  setToken: token => set({ token, isLoggedIn: !!token }),
  setUser: user => set({ user }),
  login: (token, user) => set({ token, user, isLoggedIn: true }),
  logout: () => set({ token: null, user: null, isLoggedIn: false }),
}));
