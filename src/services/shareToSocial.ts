import { Alert, Linking, Platform, Share } from 'react-native';
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

function showShareFailure(appName: string): void {
  Alert.alert('分享失败', `未安装 ${appName}，请先安装该应用后重试。`);
}

/** 用户取消分享不提示 */
function isUserCancel(e: unknown): boolean {
  const msg = (e as { message?: string })?.message ?? '';
  return msg.includes('User did not share') || msg.includes('cancel') || msg.includes('Cancel');
}

/** 先检测是否安装，未安装直接提示；已安装再调 shareSingle，避免原生层打开浏览器 */
export async function shareToFacebook(payload: SharePayload): Promise<void> {
  if (Platform.OS === 'ios') {
    const installed = await isAppInstalledIOS('fb://');
    if (!installed) {
      showShareFailure('Facebook');
      return;
    }
  } else {
    const installed = await isAppInstalledAndroid('com.facebook.katana');
    if (!installed) {
      showShareFailure('Facebook');
      return;
    }
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
    showShareFailure('Facebook');
  }
}

export async function shareToInstagram(payload: SharePayload): Promise<void> {
  if (Platform.OS === 'ios') {
    const installed = await isAppInstalledIOS('instagram://app');
    if (!installed) {
      showShareFailure('Instagram');
      return;
    }
  } else {
    const installed = await isAppInstalledAndroid('com.instagram.android');
    if (!installed) {
      showShareFailure('Instagram');
      return;
    }
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
    showShareFailure('Instagram');
  }
}

/** X (Twitter)：先检测是否安装；iOS 用 shareSingle，Android 走系统分享 */
export async function shareToX(payload: SharePayload): Promise<void> {
  const message = buildMessage(payload);
  if (Platform.OS === 'ios') {
    const installed = await isAppInstalledIOS('twitter://');
    if (!installed) {
      showShareFailure('X (Twitter)');
      return;
    }
    try {
      await RNShare.shareSingle({
        title: payload.title ?? 'Share',
        message,
        url: payload.url || undefined,
        social: RNShare.Social.TWITTER,
      });
    } catch (e) {
      if (isUserCancel(e)) return;
      showShareFailure('X (Twitter)');
    }
  } else {
    await Share.share({ message, title: payload.title, url: payload.url });
  }
}

/** TikTok 未在 react-native-share 支持，统一走系统分享 */
export async function shareToTikTok(payload: SharePayload): Promise<void> {
  const message = buildMessage(payload);
  await Share.share({ message, title: payload.title, url: payload.url });
}
