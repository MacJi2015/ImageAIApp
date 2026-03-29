/**
 * 开发调试用：非空且 App 在 __DEV__ 下启动时，优先使用该 Token 登录（会覆盖本地已存 token）。
 * 正式发版前请清空或删除，勿将真实 Token 提交到公开仓库。
 */
export const DEV_HARDCODED_AUTH_TOKEN =
  'oL8TR0BBZYtWb19Y2wpTTJ620JoKEtCiPZCjdWiUIONgSJxlayvSW/pDGVm6q8zJz6YD14a1KHZ6Wny2SgNgFxib4R3oM94+AKyRspYwmYEKg2uR6weUE7zSTc7cbZrm';

/** API 基础配置 */
export const apiConfig = {
  baseURL: process.env.API_BASE_URL || 'https://api.petsai.net/facial',
  // baseURL: process.env.API_BASE_URL || 'https://api.ipod.vip:3303/facial',
  defaultTimeout: 15000,
};

/** 第三方登录配置：Web Client ID 必须与 GoogleService-Info.plist 中 iOS 客户端同属一个 Firebase 项目，否则会报 invalid_audience */
export const authConfig = {
  /** Google OAuth Web Client ID（Firebase 控制台 → 项目设置 → 您的应用 → Web 应用客户端 ID） */
  googleWebClientId:
    process.env.GOOGLE_WEB_CLIENT_ID ||
    '823712304553-3613sgsqo0ipecmfub5nhvulcvc3v3p3.apps.googleusercontent.com',
  /**
   * TikTok OpenSDK 的 redirect_uri，须与 TikTok 开发者平台、后端兑换接口一致。
   * 未配置时 OpenSDK 会失败并自动走 WebView OAuth（仍依赖后端 authorize-url）。
   */
  tiktokOpenSdkRedirectUri: process.env.TIKTOK_OPENSDK_REDIRECT_URI || '',
  /** X (Twitter) OAuth 2.0 PKCE 回调地址，需与 X 开发者平台及后端配置一致 */
  xRedirectUri: process.env.X_REDIRECT_URI || 'imageai://auth/x',
  /**
   * X（Twitter）Firebase 登录页 URL（可选）。
   * 若后端用 Firebase 做 Twitter 登录且未提供 GET /auth/social/authorize-url?provider=x，
   * 可在此或环境变量 X_AUTHORIZE_URL 中配置后端提供的登录页地址，授权完成后需重定向到 imageai://auth/x?token=Firebase_idToken。
   * 未配置时不做默认回退，避免跳转到不存在页面导致 404。
   */
  xAuthorizeUrl: process.env.X_AUTHORIZE_URL || '',
};

export const setBaseURL = (url: string) => {
  apiConfig.baseURL = url.replace(/\/$/, '');
};
