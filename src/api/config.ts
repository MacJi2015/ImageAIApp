/**
 * 开发调试用：仅在 __DEV__ 且非空时覆盖本地已持久化的 token（会覆盖 AsyncStorage 里的登录态）。
 * 仓库内不设默认 token；需要本地连调时在 .env 配置 DEV_AUTH_TOKEN，勿提交真实值。
 */
export const DEV_HARDCODED_AUTH_TOKEN = (process.env.DEV_AUTH_TOKEN ?? '').trim();

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
   * X（Twitter）固定授权页：必须是「登录起始页」，禁止填 …/__/auth/handler（仅为 Firebase 内部回调，直接打开会 missing initial state）。
   * 须与 firebaseConfig.authDomain 同站点：用「项目ID.firebaseapp.com」，不要用 *.web.app，否则 Safari 存储分区会导致 signInWithRedirect 回到本页却无用户（按钮死循环）。
   * 部署：`firebase deploy --only hosting`。环境变量 X_AUTHORIZE_URL 可覆盖。
   */
  xAuthorizeUrl:
    process.env.X_AUTHORIZE_URL ||
    'https://imageapp-1553c.firebaseapp.com/x-twitter-login.html',
};

export const setBaseURL = (url: string) => {
  apiConfig.baseURL = url.replace(/\/$/, '');
};
