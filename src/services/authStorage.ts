import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserInfo } from '../store/useUserStore';

const KEY_TOKEN = '@auth/token';
const KEY_USER = '@auth/user';

export async function saveAuth(token: string, user: UserInfo): Promise<void> {
  const tokenStr = token != null && typeof token === 'string' ? token : '';
  const userJson = JSON.stringify(user);
  try {
    if (typeof AsyncStorage?.multiSet === 'function') {
      await AsyncStorage.multiSet([
        [KEY_TOKEN, tokenStr],
        [KEY_USER, userJson],
      ]);
      return;
    }
  } catch {
    // fall through to setItem
  }
  await AsyncStorage.setItem(KEY_TOKEN, tokenStr);
  await AsyncStorage.setItem(KEY_USER, userJson);
}

/** 从本地恢复登录态；仅要求 token + 用户 id（name 可为空，后端有时不返昵称） */
export async function loadAuth(): Promise<{ token: string; user: UserInfo } | null> {
  try {
    let token: string | null = null;
    let userStr: string | null = null;
    if (typeof AsyncStorage?.multiGet === 'function') {
      const pairs = await AsyncStorage.multiGet([KEY_TOKEN, KEY_USER]);
      token = pairs[0]?.[1] ?? null;
      userStr = pairs[1]?.[1] ?? null;
    } else {
      token = await AsyncStorage.getItem(KEY_TOKEN);
      userStr = await AsyncStorage.getItem(KEY_USER);
    }
    if (!token || !userStr) return null;
    const user = JSON.parse(userStr) as UserInfo;
    const id = user?.id != null ? String(user.id).trim() : '';
    if (!id) return null;
    return {
      token,
      user: {
        ...user,
        id,
        name: user.name?.trim() || 'User',
      },
    };
  } catch {
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  try {
    if (typeof AsyncStorage?.multiRemove === 'function') {
      await AsyncStorage.multiRemove([KEY_TOKEN, KEY_USER]);
      return;
    }
  } catch {
    // fall through to removeItem
  }
  await AsyncStorage.removeItem(KEY_TOKEN).catch(() => {});
  await AsyncStorage.removeItem(KEY_USER).catch(() => {});
}
