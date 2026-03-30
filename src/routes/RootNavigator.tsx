import { useEffect, useCallback, useRef, useMemo } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert, Linking, Platform, Pressable, Text, useWindowDimensions } from 'react-native';
import { dpAtWidth } from '../utils/scale';
import {
  useIAP,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getReceiptIOS,
} from 'react-native-iap';
import { MainTabs } from './MainTabs';
import { DetailsScreen } from '../screens/Details';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GenerateVideoScreen } from '../screens/GenerateVideo';
import { WorkDetailScreen } from '../screens/WorkDetail';
import { CustomPromptScreen } from '../screens/CustomPrompt';
import { GenerationInProgressScreen } from '../screens/GenerationInProgress';
import { SettingsScreen } from '../screens/SettingsScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { WebViewScreen } from '../screens/WebViewScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { LoginModal, LoginSubmittingOverlay, ShareModal, PremiumModal, SplashScreen } from '../components';
import { useAppStore, useUserStore } from '../store';
import {
  loginWithApple,
  loginWithFacebook,
  loginWithGoogle,
  getInstagramAuthUrl,
  getXAuthUrl,
  getTikTokAuthUrl,
  loginWithXPreferPKCE,
  loginWithTikTokPreferSdk,
  loginWithXUsingAuthSession,
  exchangeWithIdToken,
  exchangeXCodeFromDeepLink,
} from '../services/thirdPartyAuth';
import { AUTH_DEEP_LINK_PREFIX, parseAuthCallbackUrl } from '../utils/authDeepLink';
import {
  shareToFacebook,
  shareToInstagram,
  shareToX,
  shareToTikTok,
} from '../services/shareToSocial';
import { getIAPErrorMessage } from '../services/iap';
import { setOn401 } from '../api';
import { refreshTokenAndApply, getProfile, profileToUserInfo } from '../api/services/user';
import { purchaseSubscription } from '../api/services/appleSubscription';
import { getSubscriptionList } from '../api/services/subscription';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const SPLASH_AUTO_ENTER_MS = 2500;

/** 启动页：中间图见 src/assets/unusualimage.png。作为首屏时无按钮，几秒后自动 replace 到 MainTabs；带 message/buttonText 时可用于异常态，按钮返回 */
function SplashRouteScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Splash'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Splash'>>();
  const params = route.params ?? {};
  const isLaunchScreen = params === undefined || (Object.keys(params).length === 0);

  useEffect(() => {
    if (!isLaunchScreen) return;
    const t = setTimeout(() => navigation.replace('MainTabs'), SPLASH_AUTO_ENTER_MS);
    return () => clearTimeout(t);
  }, [isLaunchScreen, navigation]);

  return (
    <SplashScreen
      message={params?.message}
      buttonText={isLaunchScreen ? undefined : (params?.buttonText ?? '返回')}
      onPress={isLaunchScreen ? undefined : () => navigation.goBack()}
    />
  );
}

type RootNavigatorProps = {
  navigationRef: React.RefObject<{
    navigate: (name: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]) => void;
    goBack: () => void;
    isReady: () => boolean;
    getRootState: () => { index: number; routes: { name: keyof RootStackParamList }[] };
  } | null>;
};

const SUBSCRIPTION_SKUS = ['com.imageaiapp.premium.7d', 'com.imageaiapp.premium.30d'];

export function RootNavigator({ navigationRef }: RootNavigatorProps) {
  const { width: windowWidth } = useWindowDimensions();
  /** 设计稿：Space Grotesk Bold 18 / 行高 18 / 字间距 0，标题居中 */
  const headerTitleStyle = useMemo(
    () => ({
      fontFamily: 'Space Grotesk',
      fontWeight: '700' as const,
      fontSize: dpAtWidth(18, windowWidth),
      lineHeight: dpAtWidth(18, windowWidth),
      letterSpacing: 0,
    }),
    [windowWidth],
  );

  const showLoginModal = useAppStore(s => s.showLoginModal);
  const closeLoginModal = useAppStore(s => s.closeLoginModal);
  const socialLoginSubmitting = useAppStore(s => s.socialLoginSubmitting);
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

  // 拉取订阅商品：优先用服务端套餐列表的 productId，失败则用本地 SKU 兜底
  useEffect(() => {
    if (!connected || Platform.OS !== 'ios') return;
    const platform = Platform.OS === 'ios' ? 1 : 2;
    getSubscriptionList(platform)
      .then((list) => {
        const skus = list.map((i) => i.productId).filter(Boolean);
        if (skus.length > 0) {
          return fetchProducts({ skus, type: 'subs' });
        }
        return fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' });
      })
      .catch(() => fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' }))
      .catch(() => {});
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
              try {
                const profile = await getProfile();
                const base = profileToUserInfo(profile);
                const fallbackExpire = new Date();
                fallbackExpire.setDate(fallbackExpire.getDate() + (purchase.productId?.includes('30d') ? 30 : 7));
                const expireStr = fallbackExpire.toISOString().slice(0, 10);
                setUser({
                  ...currentUser,
                  ...base,
                  id: (base.id || currentUser?.id) ?? '',
                  name: (base.name || currentUser?.name) ?? 'User',
                  isPremium: base.isPremium ?? true,
                  premiumExpireAt: base.premiumExpireAt ?? expireStr,
                });
              } catch (_) {
                if (currentUser) {
                  const expireAt = new Date();
                  expireAt.setDate(expireAt.getDate() + (purchase.productId?.includes('30d') ? 30 : 7));
                  setUser({
                    ...currentUser,
                    isPremium: true,
                    premiumExpireAt: expireAt.toISOString().slice(0, 10),
                  });
                }
              }
            } catch (e) {
              __DEV__ && console.warn('[IAP] purchaseSubscription API failed', e);
              if (currentUser) {
                const expireAt = new Date();
                expireAt.setDate(expireAt.getDate() + (purchase.productId?.includes('30d') ? 30 : 7));
                setUser({
                  ...currentUser,
                  isPremium: true,
                  premiumExpireAt: expireAt.toISOString().slice(0, 10),
                });
              }
            }
          } else if (currentUser) {
            const expireAt = new Date();
            expireAt.setDate(expireAt.getDate() + (purchase.productId?.includes('30d') ? 30 : 7));
            setUser({
              ...currentUser,
              isPremium: true,
              premiumExpireAt: expireAt.toISOString().slice(0, 10),
            });
          }
        } else if (currentUser) {
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

  const handleFacebook = useCallback(async () => {
    const ok = await loginWithFacebook();
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
    const sdkResult = await loginWithXPreferPKCE();
    if (sdkResult === 'pending') {
      closeLoginModal();
      return;
    }
    const url = await getXAuthUrl();
    if (url) {
      closeLoginModal();
      const isHttp = url.startsWith('https://') || url.startsWith('http://');
      /**
       * iOS/Android：优先 ASWebAuthenticationSession / Chrome Custom Tabs（openAuth）。
       * 授权页跳转到 imageai://auth/x?token=… 时由系统把 URL 直接交给本调用，不依赖外部 Safari 能否唤起 App（解决「一直停在 Safari」）。
       */
      if (isHttp && (Platform.OS === 'ios' || Platform.OS === 'android')) {
        const sessionResult = await loginWithXUsingAuthSession(url);
        if (sessionResult === 'ok' || sessionResult === 'aborted') return;
        // fallback：未拉起认证会话时再尝试外开浏览器
      }
      /** 回退：外开系统浏览器（仅当 openAuth 不可用或用户取消时再试） */
      if (isHttp) {
        try {
          await Linking.openURL(url);
          return;
        } catch (e) {
          Alert.alert(
            '无法打开 X 授权页',
            `${(e as Error)?.message ?? String(e)}\n\n将尝试应用内 WebView（可能无法完成登录）。`,
          );
        }
      }
      navigationRef.current?.navigate('WebView', { url, title: 'X' });
    }
  }, [closeLoginModal, navigationRef]);

  const handleTikTok = useCallback(async () => {
    const sdkResult = await loginWithTikTokPreferSdk();
    if (sdkResult === 'success') {
      closeLoginModal();
      return;
    }
    if (sdkResult === 'cancelled') {
      return;
    }
    const url = await getTikTokAuthUrl();
    if (url) {
      closeLoginModal();
      navigationRef.current?.navigate('WebView', { url, title: 'TikTok' });
    }
  }, [closeLoginModal, navigationRef]);

  useEffect(() => {
    const onUrl = async (event: { url: string }) => {
      const raw = event.url ?? '';
      try {
        if (raw.startsWith(AUTH_DEEP_LINK_PREFIX)) {
          const parsed = parseAuthCallbackUrl(raw);
          if (!parsed) {
            Alert.alert(
              'OAuth 深链无法解析',
              `请把下面内容发给开发排查（勿在公开群发送完整链接）：\n\n长度 ${raw.length}\n前 240 字：\n${raw.slice(0, 240)}${raw.length > 240 ? '…' : ''}`,
            );
            return;
          }
          let ok = false;
          if (parsed.type === 'x_code') {
            ok = await exchangeXCodeFromDeepLink(parsed.code, parsed.state);
          } else {
            ok = await exchangeWithIdToken(parsed.loginFrom, parsed.idToken);
          }
          if (ok) {
            closeLoginModal();
            const nav = navigationRef.current;
            if (nav?.isReady()) {
              const root = nav.getRootState();
              const idx = root?.index ?? 0;
              const topName = root?.routes?.[idx]?.name;
              if (topName === 'WebView') nav.goBack();
            }
          }
          return;
        }
      } catch (e) {
        Alert.alert(
          'OAuth 深链处理异常',
          (e as Error)?.message ?? String(e),
        );
      }
    };
    const sub = Linking.addEventListener('url', onUrl);
    Linking.getInitialURL().then(url => {
      if (url) onUrl({ url });
    });
    return () => sub.remove();
  }, [navigationRef, closeLoginModal]);

  return (
    <>
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: { backgroundColor: '#f5f5f5' },
        headerTintColor: '#333',
        headerTitleAlign: 'center',
        headerTitleStyle,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false, title: '' }}
      />
      <Stack.Screen name="Detail" component={DetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GenerateVideo" component={GenerateVideoScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkDetail" component={WorkDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CustomPrompt" component={CustomPromptScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GenerationInProgress" component={GenerationInProgressScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={({ navigation }) => ({
          title: 'Settings',
          headerBackTitle: '',
          headerLeft: () => (
            <Pressable onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: 4 }}>
              <Text style={{ fontFamily: 'Space Grotesk', color: '#fff', fontSize: 22 }}>←</Text>
            </Pressable>
          ),
          headerStyle: { backgroundColor: '#050A14' },
          headerTintColor: '#fff',
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
        })}
      />
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={({ route, navigation }) => ({
          title: route.params.title,
          headerLeft: () => (
            <Pressable onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: 4 }}>
              <Text style={{ fontFamily: 'Space Grotesk', color: '#fff', fontSize: 22 }}>←</Text>
            </Pressable>
          ),
          headerStyle: { backgroundColor: '#0f1419' },
          headerTintColor: '#fff',
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
        })}
      />
      <Stack.Screen
        name="Splash"
        component={SplashRouteScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
    <LoginModal
      visible={showLoginModal}
      onClose={closeLoginModal}
      onApple={handleApple}
      onGoogle={handleGoogle}
      onFacebook={handleFacebook}
      onInstagram={handleInstagram}
      onX={handleX}
      onTikTok={handleTikTok}
    />
    {/* iOS 上双 Modal 叠层后一层常不显示；登录弹窗打开时在 LoginModal 内展示 loading；此处仅弹窗关闭时（如 OAuth 深链兑换） */}
    <LoginSubmittingOverlay visible={socialLoginSubmitting && !showLoginModal} />
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
      onSubscribe={async (productId: string) => {
        if (Platform.OS !== 'ios') {
          Alert.alert('提示', '当前仅支持在 iOS 设备上使用苹果支付。', [{ text: '知道了' }]);
          return;
        }
        try {
          await requestPurchase({
            type: 'subs',
            request: { apple: { sku: productId } },
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
