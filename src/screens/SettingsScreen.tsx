import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RNFS from 'react-native-fs';
import { useUserStore } from '../store';
import { setAuthToken } from '../api/request';
import { logoutApi } from '../api/services/user';
import { clearAuth } from '../services/authStorage';
import { dp, hp } from '../utils/scale';
import ArrowRightIcon from '../assets/my/arrow-right.svg';
import DeviceInfo from 'react-native-device-info';

const APP_VERSION = DeviceInfo.getVersion();

/** 设计稿背景蓝 */
const BG = '#050A14';
/** 设计稿列表背景： #303E57 20% 透明度 */
const LIST_BG = '#0A101F';
const TEXT_MAIN = '#ffffff';
/** 缓存数值、箭头、版本号、列表分割线 */
const TEXT_SECONDARY = '#3A4A65';
const FEEDBACK_BG = '#00FFFF';
/** FEEDBACK 按钮文字色 */
const FEEDBACK_TEXT = '#020410';
/** LOG OUT 按钮 */
const LOGOUT_BG = '#09111F';
/** #00FFFF 20%（设计稿 #00FFFF33） */
const LOGOUT_BORDER = 'rgba(0, 255, 255, 0.2)';
/** App Store 的数字 ID（App Store Connect 里显示的 Apple ID） */
const APP_STORE_ID = '6762184453';
const APP_STORE_SUBSCRIPTION_URL = 'https://apps.apple.com/account/subscriptions';
const APP_STORE_REVIEW_URL = `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;
const CONTACT_EMAIL = 'xx@qq.com';
const PRIVACY_POLICY_URL = 'https://www.petsgo.ai/privacyPolicy.html';
const TERMS_OF_SERVICE_URL = 'https://www.petsgo.ai/termsService.html';
const ABOUT_URL = 'https://www.petsgo.ai/about.html';

const SETTINGS_ITEMS = [
  { id: 'subscription', label: 'Manage Subscription' },
  { id: 'rate', label: 'Rate Us' },
  // { id: 'contact', label: 'Contact Us' },
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'terms', label: 'Terms of Service' },
  { id: 'cache', label: 'Clear Cache' },
  { id: 'about', label: 'About PetsGO' },
];

export function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const logout = useUserStore(state => state.logout);
  const [cacheSize, setCacheSize] = useState('0M');

  const formatBytes = useCallback((bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0B';
    if (bytes < 1024) return `${Math.round(bytes)}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}G`;
  }, []);

  const getPathSize = useCallback(async (path: string): Promise<number> => {
    try {
      const exists = await RNFS.exists(path);
      if (!exists) return 0;
      const stat = await RNFS.stat(path);
      if (stat.isFile()) return Number(stat.size) || 0;
      const items = await RNFS.readDir(path);
      const sizes = await Promise.all(items.map(item => getPathSize(item.path)));
      return sizes.reduce((sum, size) => sum + size, 0);
    } catch {
      return 0;
    }
  }, []);

  const loadCacheSize = useCallback(async () => {
    const paths = [RNFS.CachesDirectoryPath];
    if (RNFS.TemporaryDirectoryPath) paths.push(RNFS.TemporaryDirectoryPath);
    const sizes = await Promise.all(paths.map(path => getPathSize(path)));
    setCacheSize(formatBytes(sizes.reduce((sum, size) => sum + size, 0)));
  }, [formatBytes, getPathSize]);

  const clearCacheFiles = useCallback(async () => {
    const paths = [RNFS.CachesDirectoryPath];
    if (RNFS.TemporaryDirectoryPath) paths.push(RNFS.TemporaryDirectoryPath);
    for (const path of paths) {
      try {
        const exists = await RNFS.exists(path);
        if (!exists) continue;
        const items = await RNFS.readDir(path);
        await Promise.all(
          items.map(async item => {
            try {
              await RNFS.unlink(item.path);
            } catch {
              // ignore individual file cleanup failures
            }
          })
        );
      } catch {
        // ignore per-directory failures
      }
    }
  }, []);

  useEffect(() => {
    loadCacheSize();
  }, [loadCacheSize]);

  const openUrl = useCallback(async (url: string) => {
    const can = await Linking.canOpenURL(url);
    if (can) Linking.openURL(url);
    else Alert.alert('无法打开链接', url);
  }, []);

  const handleItemPress = useCallback(
    (id: string) => {
      switch (id) {
        case 'subscription':
          if (Platform.OS === 'ios') {
            openUrl(APP_STORE_SUBSCRIPTION_URL);
          } else {
            openUrl(`https://play.google.com/store/apps/details?id=${APP_STORE_ID}`);
          }
          break;
        case 'rate':
          if (Platform.OS === 'ios') {
            openUrl(APP_STORE_REVIEW_URL);
          } else {
            openUrl(`https://play.google.com/store/apps/details?id=${APP_STORE_ID}`);
          }
          break;
        case 'contact':
          openUrl(`mailto:${CONTACT_EMAIL}`);
          break;
        case 'privacy':
          navigation.navigate('WebView', {
            url: PRIVACY_POLICY_URL,
            title: 'Privacy Policy',
          });
          break;
        case 'terms':
          navigation.navigate('WebView', {
            url: TERMS_OF_SERVICE_URL,
            title: 'Terms of Service',
          });
          break;
        case 'cache':
          Alert.alert('清除缓存', '确定要清除应用缓存吗？', [
            { text: '取消', style: 'cancel' },
            {
              text: '确定',
              onPress: async () => {
                await clearCacheFiles();
                await loadCacheSize();
                Alert.alert('已清除', '缓存已清理完成');
              },
            },
          ]);
          break;
        case 'about':
          navigation.navigate('WebView', {
            url: ABOUT_URL,
            title: 'About PetsGO',
          });
          break;
        default:
          break;
      }
    },
    [clearCacheFiles, loadCacheSize, navigation, openUrl]
  );

  const handleLogout = async () => {
    try {
      await logoutApi();
      await clearAuth();
      setAuthToken(null);
      logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '退出失败，请重试';
      Alert.alert('退出失败', msg, [{ text: '知道了' }]);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listBox}>
          {SETTINGS_ITEMS.map((item, index) => (
            <Pressable
              key={item.id}
              style={[
                styles.row,
                index === SETTINGS_ITEMS.length - 1 && styles.rowLast,
              ]}
              onPress={() => handleItemPress(item.id)}
            >
              <Text style={styles.rowLabel}>{item.label}</Text>
              {item.id === 'cache' ? (
                <Text style={styles.rowRight}>{cacheSize}</Text>
              ) : null}
              <ArrowRightIcon width={dp(7)} height={hp(10)} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.version}>{`V  ${APP_VERSION}`}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.feedbackBtn} onPress={() => navigation.navigate('Feedback')}>
          <Text style={styles.feedbackBtnText}>FEEDBACK</Text>
        </Pressable>
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>LOG OUT</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: dp(16),
    paddingTop: hp(8),
  },
  listBox: {
    backgroundColor: LIST_BG,
    borderRadius: dp(12),
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(58, 74, 101, 0.20)',
    paddingHorizontal: dp(16),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp(56),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(58, 74, 101, 0.20)',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontFamily: 'Space Grotesk',
    flex: 1,
    fontSize: 16,
    color: TEXT_MAIN,
  },
  rowRight: {
    fontFamily: 'Space Grotesk',
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginRight: 8,
  },
  version: {
    fontFamily: 'Space Grotesk',
    alignSelf: 'center',
    marginTop: 32,
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },
  feedbackBtn: {
    backgroundColor: FEEDBACK_BG,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  feedbackBtnText: {
    fontFamily: 'Space Grotesk',
    fontSize: 16,
    fontWeight: '700',
    color: FEEDBACK_TEXT,
    letterSpacing: 0.5,
  },
  logoutBtn: {
    backgroundColor: LOGOUT_BG,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LOGOUT_BORDER,
  },
  logoutBtnText: {
    fontFamily: 'Space Grotesk',
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
    letterSpacing: 0.5,
  },
});
