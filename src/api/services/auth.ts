import { post, get } from '../request';
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

/** Firebase 三方登录：POST idToken + loginFrom，返回 app token 与用户信息；将 userProfile 转为 user 并保证 id 来自 userProfile.id */
export async function snsThreePartyLogin(params: { idToken: string; loginFrom: number }): Promise<SnsThreePartyLoginResult> {
  const raw = await post<FirebaseLoginResp>('/app/user/snsThreePartyLogin', params);
  return {
    token: raw.token,
    user: profileToUserInfo(raw.userProfile ?? {}),
  };
}

/** 获取 OAuth 授权页 URL（Meta/Instagram、X 等），用于 WebView 打开后拿 idToken */
export const getOAuthAuthorizeUrl = (provider: 'instagram' | 'x') =>
  get<{ url: string }>('/auth/social/authorize-url', { params: { provider } });
