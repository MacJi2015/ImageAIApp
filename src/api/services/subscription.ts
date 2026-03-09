/**
 * 获取订阅套餐列表
 * GET /facial/app/subscription/list?platform=1|2
 * 平台: 1-ApplePay 2-GooglePay
 */
import { get } from '../request';

export type SubscriptionPlatform = 1 | 2;

export interface AppSubscriptionConfig {
  id: number;
  name: string;
  description?: string;
  /** 折扣文案，用于红色标签展示，如 "8折" "20% off" */
  discount?: string;
  price: number;
  currency: string;
  productId: string;
  durationDays: number;
  durationMonths: number;
  subscriptionType: number; // 1-月 2-季 3-年
  platform: number;
  priority: number; // 1-10 越大越靠前
  status: string; // ACTIVE | INACTIVE
  totalQuota?: number;
  createdTime?: string;
  modifiedTime?: string;
}

const PATH = 'app/subscription/list';

/** 服务端订阅列表响应：列表在 entry 中 */
interface SubscriptionListResponse {
  entry?: AppSubscriptionConfig[];
  list?: AppSubscriptionConfig[];
}

export async function getSubscriptionList(
  platform: SubscriptionPlatform
): Promise<AppSubscriptionConfig[]> {
  const raw = await get<AppSubscriptionConfig[] | SubscriptionListResponse>(PATH, {
    params: { platform },
  });
  let list: AppSubscriptionConfig[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === 'object') {
    const res = raw as SubscriptionListResponse;
    if (Array.isArray(res.entry)) list = res.entry;
    else if (Array.isArray(res.list)) list = res.list;
  }
  return list
    .filter((item) => item && item.status === 'ACTIVE' && item.productId)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
