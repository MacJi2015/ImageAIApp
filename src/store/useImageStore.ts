import { create } from 'zustand';

export interface GeneratedImage {
  id: string;
  uri: string;
  prompt: string;
  createdAt: number;
  width?: number;
  height?: number;
}

export interface ImageState {
  /** 当前输入/生成的提示词 */
  currentPrompt: string;
  /** 是否正在生成 */
  isGenerating: boolean;
  /** 生成历史（可按需限制条数） */
  generatedImages: GeneratedImage[];
  /** 单次最多保留的历史数量，超出时删除最旧的 */
  maxHistorySize: number;
  // actions
  setCurrentPrompt: (prompt: string) => void;
  setIsGenerating: (value: boolean) => void;
  addImage: (image: Omit<GeneratedImage, 'id' | 'createdAt'>) => void;
  removeImage: (id: string) => void;
  clearHistory: () => void;
  setMaxHistorySize: (size: number) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useImageStore = create<ImageState>((set, get) => ({
  currentPrompt: '',
  isGenerating: false,
  generatedImages: [],
  maxHistorySize: 50,

  setCurrentPrompt: prompt => set({ currentPrompt: prompt }),
  setIsGenerating: value => set({ isGenerating: value }),
  addImage: image => {
    const newItem: GeneratedImage = {
      ...image,
      id: generateId(),
      createdAt: Date.now(),
    };
    set(state => {
      const list = [newItem, ...state.generatedImages].slice(0, state.maxHistorySize);
      return { generatedImages: list };
    });
  },
  removeImage: id =>
    set(state => ({
      generatedImages: state.generatedImages.filter(img => img.id !== id),
    })),
  clearHistory: () => set({ generatedImages: [] }),
  setMaxHistorySize: size => set({ maxHistorySize: size }),
}));
