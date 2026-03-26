import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppVideoTask } from '../api/services/video';

/** 底部 Tab 的页面名与参数 */
export type MainTabParamList = {
  Home: undefined;
  Add: undefined;
  My: undefined;
};

/** 根 Stack 的页面名与参数（Tab 容器 + 可 push 的详情等） */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  /** 详情仅传 id + source，页面内请求详情接口渲染 */
  Detail: { id: string; source: 'effect' | 'feed' };
  GenerateVideo: { imageUri: string; source?: 'gallery' | 'camera'; videoUri?: string };
  WorkDetail: { item: Partial<AppVideoTask> };
  CustomPrompt: { imageUri: string; petImageUrl?: string; templateId?: string; templateThumbnailUrl?: string };
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
