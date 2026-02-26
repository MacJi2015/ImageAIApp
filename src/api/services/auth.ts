import { post, get } from '../request';
import type { UserInfo } from '../../store/useUserStore';

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

/** Firebase 三方登录：POST idToken + loginFrom，返回 app token 与用户信息 */
export const snsThreePartyLogin = (params: { idToken: string; loginFrom: number }) =>
  post<SnsThreePartyLoginResult>('/app/user/snsThreePartyLogin', params);

/** 获取 OAuth 授权页 URL（Meta/Instagram、X 等），用于 WebView 打开后拿 idToken */
export const getOAuthAuthorizeUrl = (provider: 'instagram' | 'x') =>
  get<{ url: string }>('/auth/social/authorize-url', { params: { provider } });
