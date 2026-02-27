import { useEffect, useCallback, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert, Linking, Platform, Pressable, Text } from 'react-native';
import {
  useIAP,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getReceiptIOS,
} from 'react-native-iap';
import { MainTabs } from './MainTabs';
import { DetailsScreen } from '../screens/Details';
import { SettingsScreen } from '../screens/SettingsScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { WebViewScreen } from '../screens/WebViewScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { LoginModal, ShareModal, PremiumModal } from '../components';
import { useAppStore, useUserStore } from '../store';
import {
  loginWithApple,
  loginWithGoogle,
  getInstagramAuthUrl,
  getXAuthUrl,
  exchangeWithIdToken,
} from '../services/thirdPartyAuth';
import {
  shareToFacebook,
  shareToInstagram,
  shareToX,
  shareToTikTok,
} from '../services/shareToSocial';
import { getSubscriptionSku, getIAPErrorMessage, type IAPPlanId } from '../services/iap';
import { setOn401 } from '../api';
import { refreshTokenAndApply } from '../api/services/user';
import { purchaseSubscription } from '../api/services/appleSubscription';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** OAuth 回调：imageai://auth/instagram?token=xxx 或 imageai://auth/x?token=xxx（Firebase idToken） */
const AUTH_DEEP_LINK_PREFIX = 'imageai://auth/';

function parseAuthCallbackUrl(url: string): { loginFrom: 7 | 8; idToken: string } | null {
  if (!url.startsWith(AUTH_DEEP_LINK_PREFIX)) return null;
  const path = url.slice(AUTH_DEEP_LINK_PREFIX.length);
  const [provider, query] = path.split('?');
  if (!query) return null;
  const params = new URLSearchParams(query);
  const token = params.get('token');
  if (!token) return null;
  if (provider === 'instagram') return { loginFrom: 7, idToken: token }; // Meta
  if (provider === 'x') return { loginFrom: 8, idToken: token };           // Twitter(X)
  return null;
}

type RootNavigatorProps = {
  navigationRef: React.RefObject<{
    navigate: (name: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]) => void;
    goBack: () => void;
    isReady: () => boolean;
  } | null>;
};

const SUBSCRIPTION_SKUS = [getSubscriptionSku('7d'), getSubscriptionSku('30d')];

export function RootNavigator({ navigationRef }: RootNavigatorProps) {
  const showLoginModal = useAppStore(s => s.showLoginModal);
  const closeLoginModal = useAppStore(s => s.closeLoginModal);
  const showShareModal = useAppStore(s => s.showShareModal);
  const closeShareModal = useAppStore(s => s.closeShareModal);
  const sharePayload = useAppStore(s => s.sharePayload);
  const showPremiumModal = useAppStore(s => s.showPremiumModal);
  const closePremiumModal = useAppStore(s => s.closePremiumModal);
  const setUser = useUserStore(s => s.setUser);

  const {
    connected,
    requestPurchase,
    finishTransaction,
    fetchProducts,
  } = useIAP();

  const closePremiumModalRef = useRef(closePremiumModal);
  closePremiumModalRef.current = closePremiumModal;

  // token 失效时尝试刷新并重试请求
  useEffect(() => {
    setOn401(() => refreshTokenAndApply().then(() => true).catch(() => false));
    return () => setOn401(null);
  }, []);

  // 拉取订阅商品（仅 iOS 需在 App Store Connect 配置对应产品 ID）
  useEffect(() => {
    if (!connected || Platform.OS !== 'ios') return;
    fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' }).catch(() => {});
  }, [connected, fetchProducts]);

  // 监听购买成功：完成交易、上报后端购买/续费、更新会员状态、关闭弹窗
  useEffect(() => {
    const subUpdate = purchaseUpdatedListener(async (purchase) => {
      try {
        await finishTransaction({ purchase });
        const currentUser = useUserStore.getState().user;
        const appleId = currentUser?.id ?? '';
        if (Platform.OS === 'ios' && appleId) {
          let receiptData = '';
          try {
            receiptData = await getReceiptIOS();
          } catch {
            await new Promise<void>(resolve => setTimeout(resolve, 1500));
            try {
              receiptData = await getReceiptIOS();
            } catch (_) {
              __DEV__ && console.warn('[IAP] getReceiptIOS failed, still updating local state');
            }
          }
          if (receiptData) {
            try {
              await purchaseSubscription(appleId, receiptData);
            } catch (e) {
              __DEV__ && console.warn('[IAP] purchaseSubscription API failed', e);
            }
          }
        }
        if (currentUser) {
          const expireAt = new Date();
          expireAt.setDate(expireAt.getDate() + (purchase.productId?.includes('30d') ? 30 : 7));
          setUser({
            ...currentUser,
            isPremium: true,
            premiumExpireAt: expireAt.toISOString().slice(0, 10),
          });
        }
        closePremiumModalRef.current();
      } catch (e) {
        closePremiumModalRef.current();
      }
    });
    const subError = purchaseErrorListener((error) => {
      __DEV__ && console.warn('[IAP] purchase error', error?.code, error?.message);
      const code = (error as { code?: string })?.code ?? '';
      const msg = getIAPErrorMessage(code, (error as { message?: string })?.message);
      if (code === 'user-cancelled' || code === 'canceled') {
        return;
      }
      Alert.alert('订阅失败', msg, [{ text: '知道了' }]);
    });
    return () => {
      subUpdate.remove();
      subError.remove();
    };
  }, [finishTransaction, setUser]);

  const handleApple = useCallback(async () => {
    const ok = await loginWithApple();
    if (ok) closeLoginModal();
  }, [closeLoginModal]);

  const handleGoogle = useCallback(async () => {
    const ok = await loginWithGoogle();
    if (ok) closeLoginModal();
  }, [closeLoginModal]);

  const handleInstagram = useCallback(async () => {
    const url = await getInstagramAuthUrl();
    if (url) {
      closeLoginModal();
      navigationRef.current?.navigate('WebView', { url, title: 'Instagram' });
    }
  }, [closeLoginModal, navigationRef]);

  const handleX = useCallback(async () => {
    const url = await getXAuthUrl();
    if (url) {
      closeLoginModal();
      navigationRef.current?.navigate('WebView', { url, title: 'X' });
    }
  }, [closeLoginModal, navigationRef]);

  useEffect(() => {
    const onUrl = async (event: { url: string }) => {
      const parsed = parseAuthCallbackUrl(event.url);
      if (!parsed) return;
      const ok = await exchangeWithIdToken(parsed.loginFrom, parsed.idToken);
      if (ok && navigationRef.current?.isReady()) navigationRef.current?.goBack();
    };
    const sub = Linking.addEventListener('url', onUrl);
    Linking.getInitialURL().then(url => {
      if (url) onUrl({ url });
    });
    return () => sub.remove();
  }, [navigationRef]);

  return (
    <>
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: { backgroundColor: '#f5f5f5' },
        headerTintColor: '#333',
        headerTitleStyle: { fontFamily: 'Space Grotesk', fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false, title: '' }}
      />
      <Stack.Screen name="Detail" component={DetailsScreen}  options={{ headerShown: false }} />
    
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={({ navigation }) => ({
          title: 'Settings',
          headerLeft: () => (
            <Pressable onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: 4 }}>
              <Text style={{ fontFamily: 'Space Grotesk', color: '#fff', fontSize: 22 }}>←</Text>
            </Pressable>
          ),
          headerStyle: { backgroundColor: '#0f1419' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        })}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={({ navigation }) => ({
          title: 'Edit',
          headerLeft: () => (
            <Pressable onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: 4 }}>
              <Text style={{ fontFamily: 'Space Grotesk', color: '#fff', fontSize: 22 }}>←</Text>
            </Pressable>
          ),
          headerStyle: { backgroundColor: '#0f1419' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        })}
      />
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={({ route }) => ({
          title: route.params.title,
          headerStyle: { backgroundColor: '#0f1419' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        })}
      />
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={({ navigation }) => ({
          title: 'Feedback',
          headerLeft: () => (
            <Pressable onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: 4 }}>
              <Text style={{ fontFamily: 'Space Grotesk', color: '#fff', fontSize: 22 }}>←</Text>
            </Pressable>
          ),
          headerStyle: { backgroundColor: '#0f1419' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        })}
      />
    </Stack.Navigator>
    <LoginModal
      visible={showLoginModal}
      onClose={closeLoginModal}
      onApple={handleApple}
      onGoogle={handleGoogle}
      onInstagram={handleInstagram}
      onX={handleX}
    />
    <ShareModal
      visible={showShareModal}
      onClose={closeShareModal}
      payload={sharePayload}
      onFacebook={shareToFacebook}
      onInstagram={shareToInstagram}
      onX={shareToX}
      onTikTok={shareToTikTok}
    />
    <PremiumModal
      visible={showPremiumModal}
      onClose={closePremiumModal}
      onSubscribe={async (planId: IAPPlanId) => {
        if (Platform.OS !== 'ios') {
          Alert.alert('提示', '当前仅支持在 iOS 设备上使用苹果支付。', [{ text: '知道了' }]);
          return;
        }
        try {
          await requestPurchase({
            type: 'subs',
            request: { apple: { sku: getSubscriptionSku(planId) } },
          });
        } catch (e: unknown) {
          const err = e as { code?: string; message?: string };
          Alert.alert(
            '订阅失败',
            getIAPErrorMessage(err?.code, err?.message ?? '请求支付时出错，请重试。'),
            [{ text: '知道了' }]
          );
        }
      }}
    />
    </>
  );
}
