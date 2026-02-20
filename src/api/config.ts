/** API 基础配置，部署时改为实际服务地址 */
export const apiConfig = {
  baseURL: process.env.API_BASE_URL || 'https://api.example.com',
  defaultTimeout: 15000,
};

export const setBaseURL = (url: string) => {
  apiConfig.baseURL = url.replace(/\/$/, '');
};
