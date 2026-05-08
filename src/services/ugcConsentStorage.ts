import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_UGC_CONSENT_ACCEPTED = '@ugc/consent_accepted';

let cachedConsentAccepted: boolean | null = null;

/** 读取 UGC 协议是否已同意（仅同意后记忆） */
export async function getUgcConsentAccepted(): Promise<boolean> {
  if (cachedConsentAccepted !== null) return cachedConsentAccepted;
  try {
    const raw = await AsyncStorage.getItem(KEY_UGC_CONSENT_ACCEPTED);
    cachedConsentAccepted = raw === '1';
    return cachedConsentAccepted;
  } catch {
    cachedConsentAccepted = false;
    return false;
  }
}

/** 标记用户已同意 UGC 协议 */
export async function setUgcConsentAccepted(): Promise<void> {
  cachedConsentAccepted = true;
  await AsyncStorage.setItem(KEY_UGC_CONSENT_ACCEPTED, '1');
}

