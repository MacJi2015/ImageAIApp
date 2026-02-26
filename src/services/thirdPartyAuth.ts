import { Platform, Alert } from 'react-native';
import appleAuth from '@invertase/react-native-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import firebaseAuth from '@react-native-firebase/auth';
import {
  getAuth,
  signInWithCredential,
  getIdToken,
  AppleAuthProvider,
  GoogleAuthProvider,
} from '@react-native-firebase/auth';
import { setAuthToken } from '../api/request';
import { authConfig } from '../api/config';
import { snsThreePartyLogin, LoginFrom, getOAuthAuthorizeUrl } from '../api/services/auth';
import { useUserStore } from '../store';
import { saveAuth } from './authStorage';

/** 从当前已登录的 Firebase 用户获取 idToken，兼容模拟器下 user 方法未绑定的情况 */
async function getFirebaseIdToken(auth: ReturnType<typeof getAuth>, user: unknown): Promise<string> {
  const authModule = typeof firebaseAuth === 'function' ? firebaseAuth() : auth;
  const tryNativeGetIdToken = async (): Promise<string> => {
    const native = (authModule as { native?: { getIdToken?: (force: boolean) => Promise<string> } })?.native;
    if (native && typeof native.getIdToken === 'function') return await native.getIdToken(false);
    throw new Error('native.getIdToken not available');
  };

  try {
    return await getIdToken(user as Parameters<typeof getIdToken>[0]);
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    if (!msg.includes('undefined is not a function')) throw e;
    try {
      return await tryNativeGetIdToken();
    } catch {
      // 再试一次：等原生状态同步后用 currentUser 取 token
      await new Promise(r => setTimeout(r, 200));
      const currentUser = (authModule as { currentUser?: unknown })?.currentUser;
      if (currentUser) {
        try {
          return await getIdToken(currentUser as Parameters<typeof getIdToken>[0]);
        } catch {
          // ignore
        }
      }
      try {
        return await tryNativeGetIdToken();
      } catch {
        throw e;
      }
    }
  }
}

/** 初始化 Google Sign-In（建议在 App 启动时调用一次） */
export function initGoogleSignIn() {
  if (authConfig.googleWebClientId) {
    GoogleSignin.configure({
      webClientId: authConfig.googleWebClientId,
      offlineAccess: true,
    });
  }
}

/** 是否支持 Apple 登录（当前仅 iOS 13+） */
export function isAppleSignInSupported(): boolean {
  return Platform.OS === 'ios';
}

/** Apple 登录：Apple Sign In → Firebase credential → Firebase idToken → 后端 snsThreePartyLogin */
export async function loginWithApple(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    Alert.alert('提示', '当前平台暂不支持 Apple 登录');
    return false;
  }
  try {
    const supported = appleAuth.isSupported;
    const isSupported = typeof supported === 'function' ? await supported() : supported;
    if (!isSupported) {
      Alert.alert('提示', '当前设备不支持 Apple 登录');
      return false;
    }
    const { identityToken, nonce, fullName } = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      nonceEnabled: true,
    });
    if (!identityToken || !nonce) {
      Alert.alert('登录失败', '未获取到 Apple 凭证');
      return false;
    }
    const auth = getAuth();
    const appleCredential = AppleAuthProvider.credential(identityToken, nonce);
    const userCredential = await signInWithCredential(auth, appleCredential);
    const firebaseIdToken = await getFirebaseIdToken(auth, userCredential.user);
    const result = await snsThreePartyLogin({ idToken: firebaseIdToken, loginFrom: LoginFrom.Apple });
    const name = fullName?.givenName && fullName?.familyName
      ? `${fullName.givenName} ${fullName.familyName}`.trim()
      : result.user?.name ?? 'User';
    const user = { ...result.user, name: result.user.name || name };
    setAuthToken(result.token);
    useUserStore.getState().login(result.token, user);
    await saveAuth(result.token, user);
    return true;
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === appleAuth.Error.CANCELED) return false;
    // 错误 1000：多为配置或模拟器问题，给出可操作提示
    const isError1000 =
      err.code === appleAuth.Error.UNKNOWN ||
      (typeof err?.message === 'string' && err.message.includes('1000'));
    const message = isError1000
      ? '请尝试：\n1) 在真机上测试（模拟器可能不支持）；\n2) 在 Xcode 中为 Target 添加「Sign in with Apple」能力；\n3) 若用模拟器，可到 appleid.apple.com 的「设备」中移除该模拟器后再试。'
      : (err?.message ?? String(e));
    Alert.alert('Apple 登录失败', message);
    return false;
  }
}

/** Google 登录：Google Sign In → Firebase credential → Firebase idToken → 后端 snsThreePartyLogin */
export async function loginWithGoogle(): Promise<boolean> {
  try {
    if (!authConfig.googleWebClientId) {
      Alert.alert('提示', '请先配置 Google Web Client ID（或 Firebase google-services 中的 client_id）');
      return false;
    }
    if (typeof GoogleSignin.signIn !== 'function') {
      Alert.alert(
        'Google 登录失败',
        'Google Sign-In 原生模块未正确链接。请执行：cd ios && pod install，然后重新编译运行。',
      );
      return false;
    }
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    const signInResult = await GoogleSignin.signIn();
    if (!signInResult || signInResult.type !== 'success') {
      return false;
    }
    let idToken = signInResult.data?.idToken ?? (signInResult as { idToken?: string }).idToken;
    if (!idToken && typeof GoogleSignin.getTokens === 'function') {
      try {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken ?? null;
      } catch {
        // ignore
      }
    }
    if (!idToken) {
      Alert.alert('登录失败', '未获取到 Google 凭证');
      return false;
    }
    const auth = getAuth();
    if (!auth || typeof auth.signInWithCredential !== 'function') {
      Alert.alert('Google 登录失败', 'Firebase Auth 未正确初始化，请检查 Firebase 配置与原生链接。');
      return false;
    }
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, googleCredential);
    const firebaseUser = userCredential?.user;
    if (!firebaseUser) {
      Alert.alert('Google 登录失败', '无法获取 Firebase 用户凭证，请重试或检查 Firebase Auth 配置。');
      return false;
    }
    const firebaseIdToken = await getFirebaseIdToken(auth, firebaseUser);
    const result = await snsThreePartyLogin({ idToken: firebaseIdToken, loginFrom: LoginFrom.Google });
    setAuthToken(result.token);
    useUserStore.getState().login(result.token, result.user);
    await saveAuth(result.token, result.user);
    return true;
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === 'SIGN_IN_CANCELLED' || err.code === '12501') return false;
    const msg = err?.message ?? String(e);
    const isUndefinedNotFunction = typeof msg === 'string' && msg.includes('undefined is not a function');
    const displayMessage = isUndefinedNotFunction
      ? '原生模块未正确链接或版本不匹配。请执行：cd ios && pod install，然后重新编译运行。'
      : msg;
    Alert.alert('Google 登录失败', displayMessage);
    return false;
  }
}

/** 获取 Instagram OAuth 授权页 URL，用于在 WebView 中打开；完成后后端应重定向到应用（如 imageai://auth/instagram?token=xxx） */
export async function getInstagramAuthUrl(): Promise<string | null> {
  try {
    const { url } = await getOAuthAuthorizeUrl('instagram');
    return url || null;
  } catch {
    Alert.alert('提示', 'Instagram 登录暂未开放，请使用 Apple 或 Google 登录');
    return null;
  }
}

/** 获取 X (Twitter) OAuth 授权页 URL */
export async function getXAuthUrl(): Promise<string | null> {
  try {
    const { url } = await getOAuthAuthorizeUrl('x');
    return url || null;
  } catch {
    Alert.alert('提示', 'X 登录暂未开放，请使用 Apple 或 Google 登录');
    return null;
  }
}

/** 使用 OAuth 回调中的 idToken 调用三方登录（Meta/Instagram=7, X(Twitter)=8）；深链格式 imageai://auth/instagram?token=xxx */
export async function exchangeWithIdToken(loginFrom: 7 | 8, idToken: string): Promise<boolean> {
  try {
    const result = await snsThreePartyLogin({ idToken, loginFrom });
    setAuthToken(result.token);
    useUserStore.getState().login(result.token, result.user);
    await saveAuth(result.token, result.user);
    return true;
  } catch (e) {
    Alert.alert('登录失败', (e as Error)?.message ?? '兑换凭证失败');
    return false;
  }
}
