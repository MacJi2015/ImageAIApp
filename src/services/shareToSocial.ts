import { Alert, Linking, Platform } from 'react-native';
// @ts-expect-error react-native-share default export
import RNShare from 'react-native-share';
import type { SharePayload } from '../store/useAppStore';

function buildMessage(payload: SharePayload): string {
  const message = payload.message ?? payload.title ?? payload.url ?? 'Share';
  const url = payload.url ?? '';
  return url ? `${message}\n${url}` : message;
}

/** iOS：检测是否已安装（需在 Info.plist 配置 LSApplicationQueriesSchemes） */
async function isAppInstalledIOS(scheme: string): Promise<boolean> {
  try {
    return await Linking.canOpenURL(scheme);
  } catch {
    return false;
  }
}

/** Android：检测是否已安装 */
async function isAppInstalledAndroid(packageName: string): Promise<boolean> {
  try {
    const { isInstalled } = await RNShare.isPackageInstalled(packageName);
    return !!isInstalled;
  } catch {
    return false;
  }
}

async function isAppInstalled(scheme: string, packageName: string): Promise<boolean> {
  if (Platform.OS === 'ios') return isAppInstalledIOS(scheme);
  return isAppInstalledAndroid(packageName);
}

function showShareFailure(appName: string, reason?: 'not_installed' | 'not_logged_in'): void {
  const message =
    reason === 'not_logged_in'
      ? `请先在 ${appName} 应用内登录后再试。`
      : `未安装 ${appName}，请先安装该应用后重试。`;
  Alert.alert('分享失败', message);
}

function showSdkNotSupported(appName: string): void {
  Alert.alert(
    '分享失败',
    `${appName} 分享能力当前不可用，请升级或检查 react-native-share 版本与原生集成。`,
  );
}

/** 是否为“需在应用内登录”类错误（Facebook 等会返回） */
function isLoginRequiredError(e: unknown): boolean {
  const raw =
    typeof e === 'string'
      ? e
      : String(
          (e as { message?: string })?.message ?? (e instanceof Error ? e.message : '') ?? ''
        );
  const msg = raw.toLowerCase();
  return (
    /login|登录|sign\s*in|account|未登录|未授权|authorize|auth/i.test(msg) ||
    msg.includes('user must be logged in') ||
    msg.includes('not logged in')
  );
}

/** 用户取消分享不提示 */
function isUserCancel(e: unknown): boolean {
  const msg = (e as { message?: string })?.message ?? '';
  return msg.includes('User did not share') || msg.includes('cancel') || msg.includes('Cancel');
}

/** 平台 SDK 能力不可用（常见于 social 常量不支持、原生桥未集成或版本不匹配） */
function isSdkNotSupportedError(e: unknown): boolean {
  const msg = String((e as { message?: string })?.message ?? '').toLowerCase();
  return (
    msg.includes('not supported') ||
    msg.includes('is not supported') ||
    msg.includes('social is not supported') ||
    msg.includes('unsupported social') ||
    msg.includes('cannot share with') ||
    msg.includes('not installed') ||
    msg.includes('native module cannot be null')
  );
}

/** Facebook：仅走 react-native-share 的 shareSingle，直达 Facebook */
export async function shareToFacebook(payload: SharePayload): Promise<void> {
  const installed = await isAppInstalled('fb://', 'com.facebook.katana');
  if (!installed) {
    showShareFailure('Facebook');
    return;
  }

  const message = buildMessage(payload);
  try {
    await RNShare.shareSingle({
      title: payload.title ?? 'Share',
      message,
      url: payload.url || undefined,
      social: RNShare.Social.FACEBOOK,
    });
  } catch (e) {
    if (isUserCancel(e)) return;
    if (isSdkNotSupportedError(e)) {
      showSdkNotSupported('Facebook');
      return;
    }
    if (isLoginRequiredError(e)) {
      showShareFailure('Facebook', 'not_logged_in');
      return;
    }
    showShareFailure('Facebook');
  }
}

export async function shareToInstagram(payload: SharePayload): Promise<void> {
  const installed = await isAppInstalled('instagram://app', 'com.instagram.android');
  if (!installed) {
    showShareFailure('Instagram');
    return;
  }

  const message = buildMessage(payload);
  try {
    await RNShare.shareSingle({
      title: payload.title ?? 'Share',
      message,
      url: payload.url || undefined,
      social: RNShare.Social.INSTAGRAM,
    });
  } catch (e) {
    if (isUserCancel(e)) return;
    if (isSdkNotSupportedError(e)) {
      showSdkNotSupported('Instagram');
      return;
    }
    showShareFailure('Instagram');
  }
}

/**
 * X (Twitter)：通过 Web Intent 跳转到 X App 并打开编辑页，预填文案与链接。
 * 使用 https://twitter.com/intent/tweet 在已安装 X 时会直接唤起 App 的发推编辑页，避免系统分享面板遮挡问题。
 */
export async function shareToX(payload: SharePayload): Promise<void> {
  const installed = await isAppInstalled('twitter://', 'com.twitter.android');
  if (!installed) {
    showShareFailure('X (Twitter)');
    return;
  }

  const message = payload.message ?? payload.title ?? 'Share';
  const url = payload.url ?? '';
  const fullText = url ? `${message}\n${url}` : message;

  const params = new URLSearchParams();
  params.set('text', fullText);

  const intentUrl = `https://twitter.com/intent/tweet?${params.toString()}`;
  try {
    const canOpen = await Linking.canOpenURL(intentUrl);
    if (!canOpen) {
      showShareFailure('X (Twitter)');
      return;
    }
    Alert.alert(
      '跳转到 X',
      '即将打开 X 发推，发布完成后请返回本 App。',
      [
        { text: '取消', style: 'cancel' },
        { text: '去发推', onPress: () => Linking.openURL(intentUrl) },
      ]
    );
  } catch (e) {
    showShareFailure('X (Twitter)', 'not_installed');
  }
}

/** TikTok：使用 TikTok SDK 单平台分享 */
export async function shareToTikTok(payload: SharePayload): Promise<void> {
  const installed = await isAppInstalled('snssdk1233://', 'com.zhiliaoapp.musically');
  if (!installed) {
    showShareFailure('TikTok');
    return;
  }

  const message = buildMessage(payload);
  try {
    await RNShare.shareSingle({
      title: payload.title ?? 'Share',
      message,
      url: payload.url || undefined,
      social: RNShare.Social.TIKTOK,
    });
  } catch (e) {
    if (isUserCancel(e)) return;
    if (isSdkNotSupportedError(e)) {
      showSdkNotSupported('TikTok');
      return;
    }
    showShareFailure('TikTok', isLoginRequiredError(e) ? 'not_logged_in' : 'not_installed');
  }
}
