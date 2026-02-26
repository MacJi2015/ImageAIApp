/** API 基础配置 */
export const apiConfig = {
  baseURL: process.env.API_BASE_URL || 'https://api.ipod.vip:3303/facial',
  defaultTimeout: 15000,
};

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
