/**
 * 苹果订阅相关接口（购买、续费、验证 Receipt）
 * 文档：POST 请求，参数在 query；base 使用当前 api baseURL（/facial）
 */
import { post } from '../request';

const BASE = 'app/apple/subscription';

/** 购买订阅 200 返回 ResultDO<long>，这里只取 entry */
export interface PurchaseSubscriptionResult {
  code?: number;
  entry?: number;
  success?: boolean;
  message?: string;
}

/**
 * 购买订阅
 * POST /facial/app/apple/subscription/purchase
 * query: appleId（Apple用户ID）, receiptData（Receipt 数据）
 */
export async function purchaseSubscription(appleId: string, receiptData: string): Promise<PurchaseSubscriptionResult> {
  const formData = new URLSearchParams({ appleId, receiptData }).toString();
  const res = await post<PurchaseSubscriptionResult>(`${BASE}/purchase`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return res as PurchaseSubscriptionResult;
}

/**
 * 处理订阅续费
 * POST /facial/app/apple/subscription/renewal
 * query: appleId, originalTransactionId（原始交易ID）, receiptData
 */
export async function renewalSubscription(
  appleId: string,
  originalTransactionId: string,
  receiptData: string
): Promise<{ success?: boolean; entry?: boolean; code?: number; message?: string }> {
  const res = await post<{ success?: boolean; entry?: boolean; code?: number; message?: string }>(
    `${BASE}/renewal`,
    undefined,
    {
      params: { appleId, originalTransactionId, receiptData } as Record<string, string>,
    }
  );
  return res as { success?: boolean; entry?: boolean; code?: number; message?: string };
}

/** 验证 Receipt 返回的 entry 结构（简化，用于解析到期时间等） */
export interface AppleReceiptVerifyEntry {
  status?: number;
  latest_receipt_info?: Array<{
    expires_date_ms?: string;
    product_id?: string;
    original_transaction_id?: string;
  }>;
  receipt?: { in_app?: Array<{ expires_date_ms?: string; product_id?: string }> };
}

export interface VerifyReceiptResult {
  code?: number;
  success?: boolean;
  entry?: AppleReceiptVerifyEntry;
  message?: string;
}

/**
 * 验证 Receipt
 * POST；文档路径为 /lianqi/apple/subscription/verify，若你方 verify 在 facial 下则用 app/apple/subscription/verify
 * query: receiptData
 */
export async function verifyReceipt(receiptData: string): Promise<VerifyReceiptResult> {
  const res = await post<VerifyReceiptResult>(`${BASE}/verify`, undefined, {
    params: { receiptData } as Record<string, string>,
  });
  return res as VerifyReceiptResult;
}

/** 判断 verify 接口是否表示收据有效（兼容 success / code / Apple entry.status） */
export function isVerifyReceiptSuccess(res: unknown): boolean {
  if (res == null || typeof res !== 'object') return false;
  const r = res as VerifyReceiptResult;
  if (r.success === true) return true;
  const code = r.code;
  if (code === 200 || code === 0) return true;
  if (code !== undefined && (String(code) === '200' || String(code) === '0')) return true;
  if (r.entry?.status === 0) return true;
  return false;
}
