/** API 基础配置 */
export const apiConfig = {
  baseURL: process.env.API_BASE_URL || 'https://api.ipod.vip:3303/facial',
  defaultTimeout: 15000,
};

/** 写死的默认 token，无 token 时请求层与 store 均使用；登录后会被正式 token 覆盖 */
export const DEFAULT_TOKEN =
  'oL8TR0BBZYtWb19Y2wpTTowL2U5b/Bv0PZCjdWiUIONtPjg4saQaFMxHFPJhQ1mntuVr0i+AsuFTT9b1IgpA+e1WRZNGM/XqAKyRspYwmYFLQ2NCeeQ0q4EEt6yn6QGK';

/** 第三方登录配置：Web Client ID 必须与 GoogleService-Info.plist 中 iOS 客户端同属一个 Firebase 项目，否则会报 invalid_audience */
export const authConfig = {
  /** Google OAuth Web Client ID（Firebase 控制台 → 项目设置 → 您的应用 → Web 应用客户端 ID） */
  googleWebClientId:
    process.env.GOOGLE_WEB_CLIENT_ID ||
    '823712304553-3613sgsqo0ipecmfub5nhvulcvc3v3p3.apps.googleusercontent.com',
};

export const setBaseURL = (url: string) => {
  apiConfig.baseURL = url.replace(/\/$/, '');
};
