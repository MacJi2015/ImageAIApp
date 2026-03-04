import { post, get } from '../request';
import { ApiError } from '../types';
import type { UserInfo } from '../../store/useUserStore';
import type { UserProfile } from './user';
import { profileToUserInfo } from './user';

/** 登录来源：与后端约定 5-Google 6-Apple 7-Meta 8-Twitter(X) 9-TikTok */
export const LoginFrom = {
  Google: 5,
  Apple: 6,
  Meta: 7,
  Twitter: 8, // X
  TikTok: 9,
} as const;

export interface SnsThreePartyLoginResult {
  token: string;
  user: UserInfo;
}

/** 后端实际返回：token + userProfile（其中 userProfile.id 为用户账号ID，刷新 token 时 uid 需为其 MD5） */
interface FirebaseLoginResp {
  token: string;
  userProfile: UserProfile;
}

const TOKEN_KEYS = ['token', 'accessToken', 'access_token', 'jwt', 'authToken', 'authorization'] as const;
const NEST_KEYS = ['data', 'result', 'body', 'payload'];

function pickToken(obj: unknown): string | undefined {
  if (obj == null || typeof obj !== 'object') return undefined;
  const r = obj as Record<string, unknown>;
  for (const key of TOKEN_KEYS) {
    const v = r[key];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  for (const key of NEST_KEYS) {
    const next = r[key];
    if (next != null && typeof next === 'object') {
      const found = pickToken(next);
      if (found) return found;
    }
  }
  return undefined;
}

/** 后端业务错误格式：status=false 且 code/message 表示失败（如 11011 请登录后再试） */
function isBackendBizError(raw: unknown): raw is { status: false; code?: string; message?: string } {
  return (
    raw != null &&
    typeof raw === 'object' &&
    (raw as Record<string, unknown>).status === false
  );
}

/** Firebase 三方登录：POST idToken + loginFrom，返回 app token 与用户信息；将 userProfile 转为 user 并保证 id 来自 userProfile.id */
export async function snsThreePartyLogin(params: { idToken: string; loginFrom: number }): Promise<SnsThreePartyLoginResult> {
  if (__DEV__) {
    console.warn('[snsThreePartyLogin] 请求参数:', {
      loginFrom: params.loginFrom,
      idToken: params.idToken,
    });
  }
  const raw = await post<FirebaseLoginResp & Record<string, unknown>>('/app/user/snsThreePartyLogin', params);

  if (isBackendBizError(raw)) {
    const msg = raw.message ?? '登录失败';
    const exception = String((raw as { exception?: string }).exception ?? '');
    const isFirebaseAudience =
      raw.code === '1170010001' ||
      exception.includes('Invalid Firebase ID token') ||
      (exception.includes('aud') && exception.includes('Expected'));
    const hint = isFirebaseAudience
      ? '\n\n原因：App 与后端使用的 Firebase 项目不一致（当前 token 的 audience 与后端期望不符）。请让后端使用与 App 相同的 Firebase 项目校验 token，或将 App 的 GoogleService-Info/GoogleService-Info.plist 改为后端使用的项目（如 facial-magic）。'
      : raw.code === '11011' || (typeof msg === 'string' && msg.includes('请登录'))
        ? '\n\n原因：后端把「三方登录」接口也做了登录校验，需要将 /app/user/snsThreePartyLogin 加入拦截器白名单（未登录可访问）。'
        : '';
    throw new ApiError(String(msg) + hint, Number(raw.code) || -1, undefined, raw);
  }

  const token = pickToken(raw) ?? (raw?.data && typeof raw.data === 'object' ? pickToken((raw as { data: Record<string, unknown> }).data) : undefined);
  if (token == null || token === '') {
    if (__DEV__) console.warn('[snsThreePartyLogin] 成功响应但未解析到 token，raw 键:', raw && typeof raw === 'object' ? Object.keys(raw) : []);
    throw new ApiError('后端未返回登录凭证', -1, undefined, raw);
  }
  return {
    token,
    user: profileToUserInfo((raw as { userProfile?: UserProfile }).userProfile ?? {}),
  };
}

/** 获取 OAuth 授权页 URL（Meta/Instagram、X 等），用于 WebView 打开后拿 idToken */
export const getOAuthAuthorizeUrl = (provider: 'instagram' | 'x') =>
  get<{ url: string }>('/auth/social/authorize-url', { params: { provider } });
