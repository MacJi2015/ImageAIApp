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
import { useUserStore } from '../store';

const BG = '#0f1419';
/** 设计稿列表背景： #303E57 20% 透明度 */
const LIST_BG = 'rgba(48, 62, 87, 0.2)';
const TEXT_MAIN = '#ffffff';
const TEXT_MUTED = '#8b949e';
const FEEDBACK_BG = '#22c4c4';
const BORDER = 'rgba(139, 148, 158, 0.2)';
/** 设计稿单行高度 56.5，使用 dp 适配不同屏幕 */
const ROW_HEIGHT = 56.5;

/** 替换为你的 App Store 应用 ID */
const APP_STORE_ID = 'YOUR_APP_STORE_ID';
const APP_STORE_SUBSCRIPTION_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
const APP_STORE_REVIEW_URL = `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;
const CONTACT_EMAIL = 'xx@qq.com';
const PRIVACY_POLICY_URL = 'https://example.com/privacy';
const TERMS_OF_SERVICE_URL = 'https://example.com/terms';
const ABOUT_URL = 'https://example.com/about';

const SETTINGS_ITEMS = [
  { id: 'subscription', label: 'Manage Subscription' },
  { id: 'rate', label: 'Rate Us' },
  { id: 'contact', label: 'Contact Us' },
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

  const loadCacheSize = useCallback(async () => {
    // 可接入 react-native-fs 等获取真实缓存大小，此处为占位
    setCacheSize('324M');
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
              onPress: () => {
                setCacheSize('0M');
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
    [navigation, openUrl]
  );

  const handleLogout = () => {
    logout();
    navigation.goBack();
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
                { minHeight: ROW_HEIGHT },
                index === SETTINGS_ITEMS.length - 1 && styles.rowLast,
              ]}
              onPress={() => handleItemPress(item.id)}
            >
              <Text style={styles.rowLabel}>{item.label}</Text>
              {item.id === 'cache' ? (
                <Text style={styles.rowRight}>{cacheSize}</Text>
              ) : null}
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.version}>V 1.0.0</Text>
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
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listBox: {
    backgroundColor: LIST_BG,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: TEXT_MAIN,
  },
  rowRight: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginRight: 8,
  },
  chevron: {
    fontSize: 18,
    color: TEXT_MUTED,
    fontWeight: '300',
  },
  version: {
    alignSelf: 'center',
    marginTop: 32,
    fontSize: 14,
    color: TEXT_MUTED,
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
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
    letterSpacing: 0.5,
  },
  logoutBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  logoutBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
    letterSpacing: 0.5,
  },
});
