/**
 * 苹果内购订阅产品 ID（需在 App Store Connect 中创建一致的产品 ID）
 *
 * 配置步骤：
 * 1. Xcode：Target → Signing & Capabilities → + Capability → In-App Purchase
 * 2. App Store Connect：你的 App → 订阅 (Subscriptions) 或 In-App Purchases
 *    创建两个自动续期订阅，产品 ID 填下面两个之一（或改成你自己的后同步改这里）
 * 3. 真机测试：需用沙盒账号，设置 → App Store → 沙盒账号
 */
export const IAP_SUBSCRIPTION_IDS = {
  '7d': 'com.imageaiapp.premium.7d',
  '30d': 'com.imageaiapp.premium.30d',
} as const;

export type IAPPlanId = keyof typeof IAP_SUBSCRIPTION_IDS;

export function getSubscriptionSku(planId: IAPPlanId): string {
  return IAP_SUBSCRIPTION_IDS[planId];
}

/**
 * 根据 IAP 错误码返回用户可读的提示文案
 */
export function getIAPErrorMessage(code?: string, nativeMessage?: string): string {
  switch (code) {
    case 'sku-not-found':
      return '当前无法获取该订阅商品，请确认已在 App Store Connect 配置对应产品，或使用真机并登录沙盒账号后重试。';
    case 'user-cancelled':
    case 'canceled':
      return '已取消购买';
    case 'connection-closed':
    case 'billing-unavailable':
      return '无法连接商店，请检查网络后重试。';
    case 'already-owned':
      return '您已拥有该订阅。';
    case 'deferred-payment':
      return '支付待家长批准，请稍后在「设置 → Apple ID → 订阅」中查看。';
    case 'product-not-supported':
      return '当前设备或地区不支持该订阅。';
    default:
      return nativeMessage && nativeMessage.length > 0
        ? nativeMessage
        : '订阅暂时不可用，请稍后重试。';
  }
}
