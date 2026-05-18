import { create } from 'zustand';

export type DetailPagerSource = 'feed' | 'effect';

export type DetailPagerItem = {
  id: string;
  source: DetailPagerSource;
  title?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  userName?: string;
  userAvatarUrl?: string;
  likeCount?: number;
  viewCount?: number;
  liked?: boolean;
  templateIdForPrompt?: string;
  templateThumbnailUrlForPrompt?: string;
};

export type DetailPagerSession = {
  source: DetailPagerSource;
  items: DetailPagerItem[];
  initialIndex: number;
  pageNum: number;
  pageSize: number;
  hasMore: boolean;
  loop: boolean;
};

type DetailPagerState = {
  session: DetailPagerSession | null;
  initSession: (session: DetailPagerSession) => void;
  appendItems: (items: DetailPagerItem[]) => void;
  removeItem: (id: string) => void;
  patchItem: (id: string, partial: Partial<DetailPagerItem>) => void;
  setHasMore: (hasMore: boolean) => void;
  setPageNum: (pageNum: number) => void;
  clearSession: () => void;
};

export const useDetailPagerStore = create<DetailPagerState>((set, get) => ({
  session: null,

  initSession: (session) => set({ session }),

  appendItems: (incoming) => {
    const { session } = get();
    if (!session) return;
    const existingIds = new Set(session.items.map((i) => i.id));
    const merged = [...session.items];
    for (const item of incoming) {
      if (!existingIds.has(item.id)) {
        existingIds.add(item.id);
        merged.push(item);
      }
    }
    set({ session: { ...session, items: merged } });
  },

  removeItem: (id) => {
    const { session } = get();
    if (!session) return;
    set({
      session: {
        ...session,
        items: session.items.filter((i) => i.id !== id),
      },
    });
  },

  patchItem: (id, partial) => {
    const { session } = get();
    if (!session) return;
    set({
      session: {
        ...session,
        items: session.items.map((i) => (i.id === id ? { ...i, ...partial } : i)),
      },
    });
  },

  setHasMore: (hasMore) => {
    const { session } = get();
    if (!session) return;
    set({ session: { ...session, hasMore } });
  },

  setPageNum: (pageNum) => {
    const { session } = get();
    if (!session) return;
    set({ session: { ...session, pageNum } });
  },

  clearSession: () => set({ session: null }),
}));
