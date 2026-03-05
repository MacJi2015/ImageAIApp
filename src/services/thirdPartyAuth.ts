import { Platform, Alert, Linking } from 'react-native';
import CryptoJS from 'crypto-js';
import appleAuth from '@invertase/react-native-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import firebaseAuth from '@react-native-firebase/auth';
import { authorize as tikTokAuthorize, Scopes as TikTokScopes } from 'react-native-tiktok';
import {
  getAuth,
  signInWithCredential,
  getIdToken,
  AppleAuthProvider,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from '@react-native-firebase/auth';
import { AccessToken, LoginManager, Settings } from 'react-native-fbsdk-next';
import { setAuthToken } from '../api/request';
import { apiConfig, authConfig } from '../api/config';
import {
  snsThreePartyLogin,
  LoginFrom,
  getOAuthAuthorizeUrl,
  getXAuthorizeUrlPKCE,
  exchangeXCode,
  exchangeTikTokSdkCode,
} from '../api/services/auth';
import { useUserStore, type UserInfo } from '../store';
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

/** 初始化 Facebook SDK（建议在 App 启动时调用一次） */
export function initFacebookSdk() {
  try {
    Settings.initializeSDK();
  } catch {
    // ignore
  }
}

/** 是否支持 Apple 登录（当前仅 iOS 13+） */
export function isAppleSignInSupported(): boolean {
  return Platform.OS === 'ios';
}

const LOG_TAG = '[AppleLogin]';

type LoginFromValue = (typeof LoginFrom)[keyof typeof LoginFrom];

/** 统一登录收敛：Firebase idToken -> 后端 snsThreePartyLogin -> 本地写入登录态 */
async function applyFirebaseIdTokenLogin(idToken: string, loginFrom: LoginFromValue): Promise<void> {
  const result = await snsThreePartyLogin({ idToken, loginFrom });
  await applyLoginResult(result.token, result.user);
}

/** Apple 登录：Apple Sign In → Firebase credential → Firebase idToken → 后端 snsThreePartyLogin */
export async function loginWithApple(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    if (__DEV__) console.warn(LOG_TAG, '非 iOS 平台');
    Alert.alert('提示', '当前平台暂不支持 Apple 登录');
    return false;
  }
  try {
    if (__DEV__) console.warn(LOG_TAG, '1. 检查设备是否支持 Apple 登录');
    const supported = appleAuth.isSupported;
    const isSupported = typeof supported === 'function' ? await supported() : supported;
    if (!isSupported) {
      if (__DEV__) console.warn(LOG_TAG, '1. 设备不支持');
      Alert.alert('提示', '当前设备不支持 Apple 登录');
      return false;
    }
    if (__DEV__) console.warn(LOG_TAG, '2. 调起 Apple 授权...');
    const { identityToken, nonce, fullName } = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      nonceEnabled: true,
    });
    if (!identityToken || !nonce) {
      if (__DEV__) console.warn(LOG_TAG, '2. 未拿到 identityToken 或 nonce');
      Alert.alert('登录失败', '未获取到 Apple 凭证');
      return false;
    }
    if (__DEV__) console.warn(LOG_TAG, '2. Apple 授权成功，identityToken 长度:', identityToken?.length ?? 0);

    if (__DEV__) console.warn(LOG_TAG, '3. 用 Apple 凭证登录 Firebase...');
    const auth = getAuth();
    const appleCredential = AppleAuthProvider.credential(identityToken, nonce);
    const userCredential = await signInWithCredential(auth, appleCredential);
    if (__DEV__) console.warn(LOG_TAG, '3. Firebase signInWithCredential 成功');

    if (__DEV__) console.warn(LOG_TAG, '4. 获取 Firebase idToken...');
    const firebaseIdToken = await getFirebaseIdToken(auth, userCredential.user);
    if (__DEV__) console.warn(LOG_TAG, '4. Firebase idToken 长度:', firebaseIdToken?.length ?? 0);

    if (__DEV__) console.warn(LOG_TAG, '5. 调用后端 snsThreePartyLogin...');
    const result = await snsThreePartyLogin({ idToken: firebaseIdToken, loginFrom: LoginFrom.Apple });
    if (__DEV__) console.warn(LOG_TAG, '5. 后端登录成功');

    if (result.token == null || result.token === '') {
      if (__DEV__) console.warn(LOG_TAG, '[监控] 后端未返回 token，无法完成登录');
      Alert.alert('登录失败', '后端未返回登录凭证，请稍后重试或联系客服');
      return false;
    }

    if (__DEV__) {
      console.warn(LOG_TAG, '[监控] result.token 类型:', typeof result?.token, 'result.user 类型:', typeof result?.user);
      console.warn(LOG_TAG, '[监控] setAuthToken 类型:', typeof setAuthToken);
      console.warn(LOG_TAG, '[监控] useUserStore.getState 类型:', typeof useUserStore.getState);
      console.warn(LOG_TAG, '[监控] saveAuth 类型:', typeof saveAuth);
    }

    const stepTry = async (stepName: string, fn: () => void | Promise<void>) => {
      try {
        await fn();
      } catch (stepErr) {
        if (__DEV__) console.warn(LOG_TAG, '[监控] 步骤抛出:', stepName, stepErr);
        throw stepErr;
      }
    };

    let user: UserInfo;
    await stepTry('0 构建 user', () => {
      const name = fullName?.givenName && fullName?.familyName
        ? `${fullName.givenName} ${fullName.familyName}`.trim()
        : result.user?.name ?? 'User';
      user = { ...(result.user ?? {}), name: (result.user?.name || name) || 'User' } as UserInfo;
    });

    await stepTry('A applyLoginResult', () => applyLoginResult(result.token, user));
    if (__DEV__) console.warn(LOG_TAG, '6. 登录完成');
    return true;
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string; response?: { data?: unknown }; cause?: unknown; statusCode?: number; data?: unknown };
    if (__DEV__) {
      console.warn(LOG_TAG, '失败:', {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        responseData: err.response?.data ?? err.data,
        cause: err.cause,
        full: String(e),
      });
    }
    if (err.code === appleAuth.Error.CANCELED) return false;
    const errMsg = typeof err?.message === 'string' ? err.message : String(e);
    const isFirebaseAudience =
      err.code === 1170010001 ||
      String(err?.code) === '1170010001' ||
      errMsg.includes('Firebase') ||
      (errMsg.includes('aud') && errMsg.includes('Expected'));
    const message = isFirebaseAudience
      ? 'App 与后端使用的 Firebase 项目不一致。\n\n请二选一：\n1) 后端改用与 App 相同的 Firebase 项目（imageapp-1553c）校验 token；\n2) 或将 App 的 Firebase 配置改为后端使用的项目（facial-magic）。'
      : (err.code === appleAuth.Error.UNKNOWN || errMsg.includes('1000'))
        ? '请尝试：\n1) 在真机上测试（模拟器可能不支持）；\n2) 在 Xcode 中为 Target 添加「Sign in with Apple」能力；\n3) 若用模拟器，可到 appleid.apple.com 的「设备」中移除该模拟器后再试。'
        : errMsg;
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
    await applyFirebaseIdTokenLogin(firebaseIdToken, LoginFrom.Google);
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

/** Facebook 登录：Facebook SDK -> Firebase credential -> Firebase idToken -> 后端 snsThreePartyLogin */
export async function loginWithFacebook(): Promise<boolean> {
  try {
    if (
      typeof LoginManager?.logInWithPermissions !== 'function' ||
      typeof AccessToken?.getCurrentAccessToken !== 'function'
    ) {
      Alert.alert(
        'Facebook 登录失败',
        'Facebook 原生模块未正确链接。请执行：cd ios && pod install，然后重新编译运行。',
      );
      return false;
    }

    const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
    if (result.isCancelled) return false;

    const accessTokenData = await AccessToken.getCurrentAccessToken();
    const accessToken = accessTokenData?.accessToken;
    if (!accessToken) {
      Alert.alert('登录失败', '未获取到 Facebook 凭证');
      return false;
    }

    const auth = getAuth();
    if (!auth || typeof auth.signInWithCredential !== 'function') {
      Alert.alert('Facebook 登录失败', 'Firebase Auth 未正确初始化，请检查 Firebase 配置与原生链接。');
      return false;
    }

    const facebookCredential = FacebookAuthProvider.credential(accessToken.toString());
    const userCredential = await signInWithCredential(auth, facebookCredential);
    const firebaseUser = userCredential?.user;
    if (!firebaseUser) {
      Alert.alert('Facebook 登录失败', '无法获取 Firebase 用户凭证，请重试或检查 Firebase Auth 配置。');
      return false;
    }

    const firebaseIdToken = await getFirebaseIdToken(auth, firebaseUser);
    await applyFirebaseIdTokenLogin(firebaseIdToken, LoginFrom.Meta);
    return true;
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    const msg = err?.message ?? String(e);
    const cancelled =
      err?.code === 'CANCELLED' ||
      err?.code === 'E_CANCELLED' ||
      /cancel/i.test(msg) ||
      /user cancelled/i.test(msg);
    if (cancelled) return false;
    Alert.alert('Facebook 登录失败', msg);
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

const PKCE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

/** 生成 OAuth 2.0 PKCE 的 code_verifier、code_challenge 和 state */
function generatePKCE(): { code_verifier: string; code_challenge: string; state: string } {
  const randomStr = (len: number) =>
    Array.from({ length: len }, () => PKCE_CHARS[Math.floor(Math.random() * PKCE_CHARS.length)]).join('');
  const code_verifier = randomStr(43);
  const hash = CryptoJS.SHA256(code_verifier).toString(CryptoJS.enc.Base64);
  const code_challenge = hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const state = randomStr(16);
  return { code_verifier, code_challenge, state };
}

/** X PKCE 流程中按 state 暂存 code_verifier，供深链回调时兑换 */
const xPkceStateStore = new Map<string, { code_verifier: string }>();

export type XSdkLoginResult = 'pending' | 'fallback';

/** X 登录：优先走 OAuth 2.0 PKCE（系统浏览器），失败或后端未支持时回退 WebView OAuth */
export async function loginWithXPreferPKCE(): Promise<XSdkLoginResult> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return 'fallback';
  const redirectUri = authConfig.xRedirectUri;
  if (!redirectUri) return 'fallback';
  try {
    const { code_verifier, code_challenge, state } = generatePKCE();
    const { url } = await getXAuthorizeUrlPKCE({
      code_challenge,
      state,
      redirect_uri: redirectUri,
    });
    if (!url) return 'fallback';
    xPkceStateStore.set(state, { code_verifier });
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      xPkceStateStore.delete(state);
      return 'fallback';
    }
    await Linking.openURL(url);
    return 'pending';
  } catch (e) {
    if (__DEV__) console.warn('[XLogin] PKCE 失败，回退 WebView:', e);
    return 'fallback';
  }
}

/** 深链 imageai://auth/x?code=xxx&state=xxx 回调时，用暂存的 code_verifier 兑换并登录；返回是否成功 */
export async function exchangeXCodeFromDeepLink(code: string, state: string): Promise<boolean> {
  const stored = xPkceStateStore.get(state);
  xPkceStateStore.delete(state);
  if (!stored) {
    if (__DEV__) console.warn('[XLogin] 未找到 state 对应的 code_verifier，可能已过期或未走 PKCE');
    return false;
  }
  try {
    const resp = await exchangeXCode({
      code,
      code_verifier: stored.code_verifier,
      state,
      redirect_uri: authConfig.xRedirectUri,
    });
    if (resp?.idToken) {
      await applyFirebaseIdTokenLogin(resp.idToken, LoginFrom.Twitter);
      return true;
    }
    if (__DEV__) console.warn('[XLogin] code 兑换结果缺少 idToken（仅允许统一流程）');
    return false;
  } catch (e) {
    if (__DEV__) console.warn('[XLogin] code 兑换失败:', e);
    return false;
  }
}

/** 获取 X (Twitter) OAuth 授权页 URL（WebView 回退用）；后端用 Firebase 做 Twitter 登录时可配置 authConfig.xAuthorizeUrl 兜底 */
export async function getXAuthUrl(): Promise<string | null> {
  const normalizeUrl = (raw: string): string | null => {
    const value = raw.trim();
    if (!value) return null;
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    const base = apiConfig.baseURL?.trim();
    if (!base) return null;
    return `${base.replace(/\/$/, '')}/${value.replace(/^\//, '')}`;
  };

  try {
    const { url } = await getOAuthAuthorizeUrl('x');
    const normalized = typeof url === 'string' ? normalizeUrl(url) : null;
    if (normalized) return normalized;
  } catch (e) {
    if (__DEV__) console.warn('[XLogin] 获取授权 URL 接口失败，尝试使用配置的 xAuthorizeUrl', e);
  }
  const fallback = normalizeUrl(authConfig.xAuthorizeUrl ?? '');
  if (fallback) return fallback;
  Alert.alert(
    '提示',
    'X 登录授权地址无效或未配置。\n\n请检查后端 GET /auth/social/authorize-url?provider=x 返回完整可访问 URL；或在 .env 配置 X_AUTHORIZE_URL（完整 http/https 地址）。',
  );
  return null;
}

/** 获取 TikTok OAuth 授权页 URL */
export async function getTikTokAuthUrl(): Promise<string | null> {
  try {
    const { url } = await getOAuthAuthorizeUrl('tiktok');
    return url || null;
  } catch {
    Alert.alert('提示', 'TikTok 登录暂未开放，请使用 Apple 或 Google 登录');
    return null;
  }
}

type TikTokSdkLoginResult = 'success' | 'fallback' | 'cancelled';

function applyLoginResult(token: string, user: UserInfo): Promise<void> {
  setAuthToken(token);
  useUserStore.getState().login(token, user);
  return saveAuth(token, user);
}

function isUserCancelledError(e: unknown): boolean {
  const err = e as { code?: string; message?: string };
  const msg = (err?.message ?? String(e)).toLowerCase();
  return (
    err?.code === 'CANCELLED' ||
    err?.code === 'E_CANCELLED' ||
    msg.includes('cancel') ||
    msg.includes('user cancelled')
  );
}

function requestTikTokOpenSdkAuthCode(): Promise<{ authCode: string; codeVerifier?: string }> {
  const redirectURI = authConfig.tiktokOpenSdkRedirectUri;
  if (!redirectURI) {
    return Promise.reject(
      new Error('缺少 TikTok OpenSDK redirectURI，请配置 TIKTOK_OPENSDK_REDIRECT_URI'),
    );
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('TikTok OpenSDK 授权超时'));
    }, 15000);
    try {
      tikTokAuthorize({
        redirectURI,
        scopes: [TikTokScopes.user.info.basic],
        callback: (authCode: string, codeVerifier?: string) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (!authCode) {
            reject(new Error('TikTok OpenSDK 未返回 authCode'));
            return;
          }
          resolve({ authCode, codeVerifier });
        },
      });
    } catch (e) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(e as Error);
    }
  });
}

/** TikTok 登录：优先走 OpenSDK（原生），失败自动回退 OAuth；用户主动取消则不回退 */
export async function loginWithTikTokPreferSdk(): Promise<TikTokSdkLoginResult> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return 'fallback';
  try {
    const { authCode, codeVerifier } = await requestTikTokOpenSdkAuthCode();
    const sdkResp = await exchangeTikTokSdkCode({
      authCode,
      codeVerifier,
      redirectUri: authConfig.tiktokOpenSdkRedirectUri,
    });

    if (sdkResp?.idToken) {
      await applyFirebaseIdTokenLogin(sdkResp.idToken, LoginFrom.TikTok);
      return 'success';
    }
    if (__DEV__) console.warn('[TikTokLogin] OpenSDK 兑换结果缺少 idToken（仅允许统一流程），回退 OAuth');
    return 'fallback';
  } catch (e) {
    if (isUserCancelledError(e)) return 'cancelled';
    if (__DEV__) console.warn('[TikTokLogin] OpenSDK 失败，回退 OAuth:', e);
    return 'fallback';
  }
}

/** 使用 OAuth 回调中的 idToken 调用三方登录（Meta/Instagram=7, X(Twitter)=8, TikTok=9）；深链格式 imageai://auth/instagram?token=xxx */
export async function exchangeWithIdToken(loginFrom: 7 | 8 | 9, idToken: string): Promise<boolean> {
  try {
    await applyFirebaseIdTokenLogin(idToken, loginFrom);
    return true;
  } catch (e) {
    Alert.alert('登录失败', (e as Error)?.message ?? '兑换凭证失败');
    return false;
  }
}
