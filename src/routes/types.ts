import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** 底部 Tab 的页面名与参数 */
export type MainTabParamList = {
  Home: undefined;
  Add: undefined;
  My: undefined;
};

/** 根 Stack 的页面名与参数（Tab 容器 + 可 push 的详情等） */
export type RootStackParamList = {
  MainTabs: undefined;
  /** source: effect = 点击播放，feed = 自动播放；缺省为 effect */
  Detail: {
    id: string;
    title?: string;
    source?: 'effect' | 'feed';
    videoUrl?: string;
    thumbnailUrl?: string;
    userName?: string;
    likeCount?: number;
  };
  GenerateVideo: { imageUri: string; source?: 'gallery' | 'camera'; videoUri?: string };
  CustomPrompt: { imageUri: string; petImageUrl?: string; templateId?: string };
  GenerationInProgress: { taskId: string; imageUri: string; estimatedTime?: number };
  Settings: undefined;
  EditProfile: undefined;
  WebView: { url: string; title: string };
  Feedback: undefined;
  /** 启动页（默认首屏），可选 message / buttonText 时可用于异常态展示（中间图见 assets/unusualimage.png） */
  Splash: { message?: string; buttonText?: string } | undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/** 用于 useNavigation 的泛型 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
