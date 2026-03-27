import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs';

export type SaveMediaType = 'video' | 'photo';
export type SaveMediaResult =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'permission' | 'error'; message?: string };

async function requestAndroidPermission(type: SaveMediaType): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  if (Platform.Version < 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  const permission =
    type === 'video'
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
      : PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
  const granted = await PermissionsAndroid.request(permission);
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

function isPermissionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybeMessage = (error as { message?: unknown }).message;
  if (typeof maybeMessage !== 'string') return false;
  const msg = maybeMessage.toLowerCase();
  return msg.includes('permission') || msg.includes('denied') || msg.includes('not authorized');
}

function isRemoteUri(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

function buildTempMediaPath(type: SaveMediaType): string {
  const ext = type === 'video' ? 'mp4' : 'jpg';
  const ts = Date.now();
  return `${RNFS.CachesDirectoryPath}/save-media-${ts}.${ext}`;
}

async function downloadToLocalFile(uri: string, type: SaveMediaType): Promise<string> {
  const candidates = Array.from(new Set([uri, encodeURI(uri)]));
  let lastStatusCode: number | undefined;

  for (const fromUrl of candidates) {
    const toFile = buildTempMediaPath(type);
    const result = await RNFS.downloadFile({
      fromUrl,
      toFile,
      background: true,
      discretionary: true,
    }).promise;
    if (result.statusCode >= 200 && result.statusCode < 300) {
      return `file://${toFile}`;
    }
    lastStatusCode = result.statusCode;
    RNFS.unlink(toFile).catch(() => {});
  }

  throw new Error(`Download failed with status ${lastStatusCode ?? 'unknown'}`);
}

export async function saveMediaToGallery(
  uri: string | undefined | null,
  type: SaveMediaType,
): Promise<SaveMediaResult> {
  if (!uri) return { ok: false, reason: 'empty' };

  const granted = await requestAndroidPermission(type);
  if (!granted) return { ok: false, reason: 'permission' };

  let localTempPath: string | null = null;
  let primaryUri = uri;
  try {
    if (isRemoteUri(uri)) {
      primaryUri = await downloadToLocalFile(uri, type);
      localTempPath = primaryUri.replace(/^file:\/\//, '');
    }
  } catch (e) {
    return {
      ok: false,
      reason: 'error',
      message: e instanceof Error ? e.message : 'Failed to download media.',
    };
  }

  const candidates = Array.from(new Set([primaryUri, encodeURI(primaryUri)]));
  let lastError: unknown;

  try {
    for (const candidate of candidates) {
      try {
        await CameraRoll.save(candidate, { type });
        return { ok: true };
      } catch (e) {
        lastError = e;
        if (isPermissionError(e)) {
          return {
            ok: false,
            reason: 'permission',
            message: e instanceof Error ? e.message : undefined,
          };
        }
      }
    }
  } finally {
    if (localTempPath) {
      RNFS.unlink(localTempPath).catch(() => {});
    }
  }

  return {
    ok: false,
    reason: 'error',
    message: lastError instanceof Error ? lastError.message : undefined,
  };
}
