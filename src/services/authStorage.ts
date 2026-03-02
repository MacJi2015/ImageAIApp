import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserInfo } from '../store/useUserStore';

const KEY_TOKEN = '@auth/token';
const KEY_USER = '@auth/user';

export async function saveAuth(token: string, user: UserInfo): Promise<void> {
  const tokenStr = token != null && typeof token === 'string' ? token : '';
  if (typeof AsyncStorage?.multiSet !== 'function') {
    if (__DEV__) console.warn('[saveAuth] AsyncStorage.multiSet 不可用');
    return;
  }
  await AsyncStorage.multiSet([
    [KEY_TOKEN, tokenStr],
    [KEY_USER, JSON.stringify(user)],
  ]);
}

/** multiGet 返回 [[key, value], [key, value], ...]，按 key 顺序与传入的 keys 一致 */
export async function loadAuth(): Promise<{ token: string; user: UserInfo } | null> {
  try {
    const pairs = await AsyncStorage.multiGet([KEY_TOKEN, KEY_USER]);
    const token = pairs[0]?.[1] ?? null;
    const userStr = pairs[1]?.[1] ?? null;
    if (!token || !userStr) return null;
    const user = JSON.parse(userStr) as UserInfo;
    if (!user?.id || !user?.name) return null;
    return { token, user };
  } catch {
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([KEY_TOKEN, KEY_USER]);
}
