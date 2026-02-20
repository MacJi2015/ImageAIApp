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
  Detail: { id: string; title?: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/** 用于 useNavigation 的泛型 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
