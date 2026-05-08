import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  type NavigationContainerRefWithCurrent,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { dp, dpAtWidth } from '../utils/scale';
import {
  useIAP,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getReceiptIOS,
} from 'react-native-iap';
import { MainTabs } from './MainTabs';
import { DetailsScreen } from '../screens/Details';
import {
  DetailNavGlassIconButton,
} from '../screens/Details/components/DetailNavGlassIconButton';
import { DETAIL_NAV_LIQUID_GLASS } from '../screens/Details/detailNavChrome';
import { GenerateVideoScreen } from '../screens/GenerateVideo';
import { WorkDetailScreen } from '../screens/WorkDetail';
import { CustomPromptScreen } from '../screens/CustomPrompt';
import { GenerationInProgressScreen } from '../screens/GenerationInProgress';
import { SettingsScreen } from '../screens/SettingsScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { AccountPasswordLoginScreen } from '../screens/AccountPasswordLoginScreen';
import { WebViewScreen } from '../screens/WebViewScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import {
  LoginModal,
  LoginSubmittingOverlay,
  ShareModal,
  PremiumModal,
  ToastOverlay,
  UgcConsentModal,
} from '../components';
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
// 分享弹窗内置：X / 系统分享 / 下载 / 复制链接
import { getIAPErrorMessage } from '../services/iap';
import { setOn401 } from '../api';
import { refreshTokenAndApply, getProfile, profileToUserInfo } from '../api/services/user';
import {
  purchaseSubscription,
} from '../api/services/appleSubscription';
import { getSubscriptionList } from '../api/services/subscription';
import { setUgcConsentAccepted } from '../services/ugcConsentStorage';
import type { RootStackParamList } from './types';

const HEADER_BACK_ICON = require('../assets/details/arrow-left.png');

function StackHeaderBack() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Pressable onPress={() => navigation.goBack()} style={stackHeaderBackStyles.pressable}>
      <Image source={HEADER_BACK_ICON} style={stackHeaderBackStyles.icon} resizeMode="contain" />
    </Pressable>
  );
}



/** 非液体玻璃机型：毛玻璃圆底 + arrow-left.png */
function DetailHeaderGlassBack() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <DetailNavGlassIconButton
      onPress={() => navigation.goBack()}
    >
      <Image source={HEADER_BACK_ICON} style={stackHeaderBackStyles.icon} resizeMode="contain" />
    </DetailNavGlassIconButton>
  );
}

const stackHeaderBackStyles = StyleSheet.create({
  pressable: {
    width: dp(36),
    height: dp(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { width: 16, height: 16 },
});

const Stack = createNativeStackNavigator<RootStackParamList>();

type RootNavigatorProps = {
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>;
};

const SUBSCRIPTION_SKUS = ['com.petsgo.ai.premium.weekly', 'com.petsgo.ai.premium.monthly'];
const IOS_BUNDLE_PREFIX = 'com.petsgo.ai.';
const PREMIUM_PRIVACY_URL = 'https://www.petsgo.ai/privacyPolicy.html';
const PREMIUM_TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const UGC_PRIVACY_URL = 'https://www.petsgo.ai/privacyPolicy.html';
const UGC_TERMS_URL = 'https://www.petsgo.ai/termsService.html';

function getFallbackDurationDays(productId?: string | null): number {
  if (!productId) return 7;
  if (productId.includes('monthly') || productId.includes('30d')) return 30;
  if (productId.includes('weekly') || productId.includes('7d')) return 7;
  return 7;
}

function getPurchaseDedupKey(purchase: {
  transactionId?: string | null;
  purchaseToken?: string | null;
  id?: string | null;
  productId?: string | null;
  transactionDate?: number | null;
}): string {
  return (
    purchase.transactionId ??
    purchase.purchaseToken ??
    purchase.id ??
    `${purchase.productId ?? 'unknown'}-${purchase.transactionDate ?? Date.now()}`
  );
}

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
  const showUgcConsentModal = useAppStore(s => s.showUgcConsentModal);
  const ugcConsentCallbacks = useAppStore(s => s.ugcConsentCallbacks);
  const closeUgcConsentModal = useAppStore(s => s.closeUgcConsentModal);
  const setUser = useUserStore(s => s.setUser);

  const {
    connected,
    subscriptions,
    finishTransaction,
    requestPurchase,
    fetchProducts,
    restorePurchases,
  } = useIAP({
    onError: (error) => {
      __DEV__ && console.warn('[IAP] non-purchase error', error);
    },
  });

  const closePremiumModalRef = useRef(closePremiumModal);
  closePremiumModalRef.current = closePremiumModal;
  const pendingPurchaseSkusRef = useRef<Set<string>>(new Set());
  const processingPurchaseKeysRef = useRef<Set<string>>(new Set());
  const processedPurchaseKeysRef = useRef<Set<string>>(new Set());
  const purchaseSubmittingRef = useRef(false);
  const purchaseLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);
  const [restoreSubmitting, setRestoreSubmitting] = useState(false);

  const clearPurchaseSubmitting = useCallback(() => {
    purchaseSubmittingRef.current = false;
    setPurchaseSubmitting(false);
    if (purchaseLockTimerRef.current) {
      clearTimeout(purchaseLockTimerRef.current);
      purchaseLockTimerRef.current = null;
    }
  }, []);

  const markPurchaseSubmitting = useCallback(() => {
    purchaseSubmittingRef.current = true;
    setPurchaseSubmitting(true);
    if (purchaseLockTimerRef.current) {
      clearTimeout(purchaseLockTimerRef.current);
    }
    // 兜底解锁：避免极端情况下未收到回调导致按钮长期不可点
    purchaseLockTimerRef.current = setTimeout(() => {
      __DEV__ && console.warn('[IAP] purchase lock timeout, auto release');
      pendingPurchaseSkusRef.current.clear();
      clearPurchaseSubmitting();
    }, 30000);
  }, [clearPurchaseSubmitting]);

  // token 失效时尝试刷新并重试请求
  useEffect(() => {
    setOn401(() => refreshTokenAndApply().then(() => true).catch(() => false));
    return () => setOn401(null);
  }, []);

  useEffect(
    () => () => {
      if (purchaseLockTimerRef.current) {
        clearTimeout(purchaseLockTimerRef.current);
        purchaseLockTimerRef.current = null;
      }
    },
    [],
  );

  // 拉取订阅商品：优先用服务端套餐列表的 productId，失败则用本地 SKU 兜底
  useEffect(() => {
    if (!connected || Platform.OS !== 'ios') return;
    const platform = Platform.OS === 'ios' ? 1 : 2;
    (async () => {
      try {
        const list = await getSubscriptionList(platform);
        const skusFromServer = list
          .map((i) => i.productId)
          .filter(Boolean)
          .filter((id) => id.startsWith(IOS_BUNDLE_PREFIX));
        const skus = skusFromServer.length > 0 ? skusFromServer : SUBSCRIPTION_SKUS;
        __DEV__ && console.warn('[IAP] fetching subs skus:', skus);
        await fetchProducts({ skus, type: 'subs' });
      } catch (e) {
        __DEV__ && console.warn('[IAP] fetchProducts subs failed, fallback to local skus', e);
        try {
          await fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' });
        } catch (e2) {
          __DEV__ && console.warn('[IAP] fetchProducts subs fallback failed', e2);
        }
      }
    })();
  }, [connected, fetchProducts]);

  // 调试：打印订阅商品拉取结果（用于定位 sku-not-found / item-unavailable）
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (!connected) return;
    __DEV__ &&
      console.warn(
        '[IAP] subscriptions fetched:',
        subscriptions?.length ?? 0,
        (subscriptions ?? []).map((s) => s.id)
      );
  }, [connected, subscriptions]);

  // 监听购买成功：完成交易、上报后端购买/续费、更新会员状态、关闭弹窗
  useEffect(() => {
    const subUpdate = purchaseUpdatedListener(async (purchase) => {
      const dedupKey = getPurchaseDedupKey({
        transactionId: purchase.transactionId,
        purchaseToken: purchase.purchaseToken,
        id: purchase.id,
        productId: purchase.productId,
        transactionDate: purchase.transactionDate,
      });
      if (processingPurchaseKeysRef.current.has(dedupKey) || processedPurchaseKeysRef.current.has(dedupKey)) {
        __DEV__ && console.warn('[IAP] skip duplicated purchaseUpdated event', dedupKey);
        return;
      }
      processingPurchaseKeysRef.current.add(dedupKey);
      try {
        await finishTransaction({ purchase, isConsumable: false });
        const isUserInitiated = pendingPurchaseSkusRef.current.has(purchase.productId);
        pendingPurchaseSkusRef.current.delete(purchase.productId);
        const currentUser = useUserStore.getState().user;
        const appleId = currentUser?.id ?? '';
        if (!isUserInitiated) {
          __DEV__ && console.warn('[IAP] startup/restore event detected, skip receipt upload', purchase.productId);
          try {
            const profile = await getProfile();
            const base = profileToUserInfo(profile);
            setUser({
              ...currentUser,
              ...base,
              id: (base.id || currentUser?.id) ?? '',
              name: (base.name || currentUser?.name) ?? 'User',
              isPremium: base.isPremium ?? false,
              premiumExpireAt: base.premiumExpireAt ?? currentUser?.premiumExpireAt,
            });
          } catch {
            // ignore
          }
          processedPurchaseKeysRef.current.add(dedupKey);
          return;
        }
        if (Platform.OS === 'ios' && appleId) {
          let receiptData = '';
          try {
            receiptData = await getReceiptIOS();
          } catch {
            await new Promise<void>(resolve => setTimeout(resolve, 1500));
            try {
              receiptData = await getReceiptIOS();
            } catch {
              __DEV__ && console.warn('[IAP] getReceiptIOS failed, still updating local state');
            }
          }
          if (receiptData) {
            try {
              try {
                await purchaseSubscription(appleId, receiptData);
                try {
                  const profile = await getProfile();
                  const base = profileToUserInfo(profile);
                  const fallbackExpire = new Date();
                  fallbackExpire.setDate(
                    fallbackExpire.getDate() + getFallbackDurationDays(purchase.productId),
                  );
                  const expireStr = fallbackExpire.toISOString().slice(0, 10);
                  setUser({
                    ...currentUser,
                    ...base,
                    id: (base.id || currentUser?.id) ?? '',
                    name: (base.name || currentUser?.name) ?? 'User',
                    isPremium: base.isPremium ?? true,
                    premiumExpireAt: base.premiumExpireAt ?? expireStr,
                  });
                } catch {
                  if (currentUser) {
                    const expireAt = new Date();
                    expireAt.setDate(
                      expireAt.getDate() + getFallbackDurationDays(purchase.productId),
                    );
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
                  expireAt.setDate(
                    expireAt.getDate() + getFallbackDurationDays(purchase.productId),
                  );
                  setUser({
                    ...currentUser,
                    isPremium: true,
                    premiumExpireAt: expireAt.toISOString().slice(0, 10),
                  });
                }
              }
            } catch (e) {
              __DEV__ && console.warn('[IAP] verifyReceipt failed', e);
              const msg =
                e && typeof e === 'object' && 'message' in e
                  ? String((e as { message?: string }).message)
                  : '收据验证请求失败，请检查网络后重试。';
              Alert.alert('订阅验证失败', msg, [{ text: '知道了' }]);
            }
          } else if (currentUser) {
            const expireAt = new Date();
            expireAt.setDate(expireAt.getDate() + getFallbackDurationDays(purchase.productId));
            setUser({
              ...currentUser,
              isPremium: true,
              premiumExpireAt: expireAt.toISOString().slice(0, 10),
            });
          }
        } else if (currentUser) {
          const expireAt = new Date();
          expireAt.setDate(expireAt.getDate() + getFallbackDurationDays(purchase.productId));
          setUser({
            ...currentUser,
            isPremium: true,
            premiumExpireAt: expireAt.toISOString().slice(0, 10),
          });
        }
        processedPurchaseKeysRef.current.add(dedupKey);
        closePremiumModalRef.current();
      } catch {
        closePremiumModalRef.current();
      } finally {
        processingPurchaseKeysRef.current.delete(dedupKey);
        clearPurchaseSubmitting();
      }
    });
    const subError = purchaseErrorListener((error) => {
      __DEV__ && console.warn('[IAP] purchase error', error?.code, error?.message);
      pendingPurchaseSkusRef.current.clear();
      clearPurchaseSubmitting();
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
  }, [clearPurchaseSubmitting, finishTransaction, setUser]);

  const openPremiumLegalPage = useCallback(
    (url: string, title: string) => {
      closePremiumModal();
      navigationRef.current?.navigate('WebView', { url, title });
    },
    [closePremiumModal, navigationRef],
  );

  const openTermsExternal = useCallback(() => {
    closePremiumModal();
    Linking.openURL(PREMIUM_TERMS_URL).catch(() => {
      Alert.alert('Unable to Open Link', PREMIUM_TERMS_URL, [{ text: 'OK' }]);
    });
  }, [closePremiumModal]);

  const handleRestorePurchases = useCallback(async () => {
    if (restoreSubmitting) return;
    if (Platform.OS !== 'ios') {
      Alert.alert('Restore Purchases', 'Restore is currently supported on iOS only.', [{ text: 'OK' }]);
      return;
    }
    setRestoreSubmitting(true);
    try {
      await restorePurchases();
      try {
        const profile = await getProfile();
        const currentUser = useUserStore.getState().user;
        const base = profileToUserInfo(profile);
        setUser({
          ...currentUser,
          ...base,
          id: (base.id || currentUser?.id) ?? '',
          name: (base.name || currentUser?.name) ?? 'User',
          isPremium: base.isPremium ?? false,
          premiumExpireAt: base.premiumExpireAt ?? currentUser?.premiumExpireAt,
        });
      } catch {
        // ignore profile refresh failure; restore result still returned.
      }
      Alert.alert('Restore Completed', 'Restore request finished. If you had an active subscription, it is now synced.', [{ text: 'OK' }]);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: string }).message)
          : 'Restore failed. Please try again later.';
      Alert.alert('Restore Failed', msg, [{ text: 'OK' }]);
    } finally {
      setRestoreSubmitting(false);
    }
  }, [restorePurchases, restoreSubmitting, setUser]);

  const handleApple = useCallback(async () => {
    const ok = await loginWithApple();
    if (ok) closeLoginModal();
  }, [closeLoginModal]);

  const handleGoogle = useCallback(async () => {
    const ok = await loginWithGoogle();
    if (ok) closeLoginModal();
  }, [closeLoginModal]);

  const handleOpenAccountPassword = useCallback(() => {
    navigationRef.current?.navigate('AccountPasswordLogin');
  }, [navigationRef]);

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

  const handleAgreeUgcConsent = useCallback(async () => {
    await setUgcConsentAccepted();
    const callbacks = ugcConsentCallbacks;
    closeUgcConsentModal();
    callbacks?.onAgreed?.();
  }, [closeUgcConsentModal, ugcConsentCallbacks]);

  const handleDisagreeUgcConsent = useCallback(() => {
    const callbacks = ugcConsentCallbacks;
    closeUgcConsentModal();
    callbacks?.onDisagreed?.();
  }, [closeUgcConsentModal, ugcConsentCallbacks]);

  const handleOpenUgcPrivacy = useCallback(() => {
    closeUgcConsentModal();
    setTimeout(() => {
      navigationRef.current?.navigate('WebView', {
        url: UGC_PRIVACY_URL,
        title: 'Privacy Policy',
      });
    }, 200);
  }, [closeUgcConsentModal, navigationRef]);

  const handleOpenUgcTerms = useCallback(() => {
    closeUgcConsentModal();
    setTimeout(() => {
      navigationRef.current?.navigate('WebView', {
        url: UGC_TERMS_URL,
        title: 'Terms of Service',
      });
    }, 200);
  }, [closeUgcConsentModal, navigationRef]);

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
      <Stack.Screen
        name="Detail"
        component={DetailsScreen}
        options={{
          headerShown: true,
          title: '',
            /** 液体玻璃 iOS：仅图标；否则毛玻璃圆底 + 同资源箭头 */
          headerLeft: DETAIL_NAV_LIQUID_GLASS ? StackHeaderBack : DetailHeaderGlassBack,
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff' },
          headerTransparent: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen name="GenerateVideo" component={GenerateVideoScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkDetail" component={WorkDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CustomPrompt" component={CustomPromptScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GenerationInProgress" component={GenerationInProgressScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerBackTitle: '',
          headerLeft: StackHeaderBack,
          headerStyle: { backgroundColor: '#050A14' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit',
          headerLeft: StackHeaderBack,
          headerStyle: { backgroundColor: '#050A14' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="AccountPasswordLogin"
        component={AccountPasswordLoginScreen}
        options={{
          title: 'Account Login',
          headerLeft: StackHeaderBack,
          headerStyle: { backgroundColor: '#050A14' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={({ route }) => ({
          title: route.params.title,
          headerLeft: StackHeaderBack,
          headerStyle: { backgroundColor: '#050A14' },
          headerTintColor: '#fff',
        })}
      />
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{
          title: 'Feedback',
          headerLeft: StackHeaderBack,
          headerStyle: { backgroundColor: '#050A14' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
    <LoginModal
      visible={showLoginModal}
      onClose={closeLoginModal}
      onApple={handleApple}
      onGoogle={handleGoogle}
      onAccountPassword={handleOpenAccountPassword}
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
    />
    <PremiumModal
      visible={showPremiumModal}
      onClose={closePremiumModal}
      subscribing={purchaseSubmitting}
      restoring={restoreSubmitting}
      onRestorePurchases={handleRestorePurchases}
      onPressPrivacy={() => openPremiumLegalPage(PREMIUM_PRIVACY_URL, 'Privacy Policy')}
      onPressTerms={openTermsExternal}
      onSubscribe={async (productId: string) => {
        if (purchaseSubmittingRef.current) {
          __DEV__ && console.warn('[IAP] ignore duplicated subscribe press');
          return;
        }
        if (Platform.OS !== 'ios') {
          Alert.alert('提示', '当前仅支持在 iOS 设备上使用苹果支付。', [{ text: '知道了' }]);
          return;
        }
        
        // 如果订阅商品列表里都没有这个 productId，基本可以断定是 App Store Connect/沙盒/Bundle ID 问题
        if (!subscriptions?.some((s) => s.id === productId)) {
          __DEV__ &&
            console.warn(
              '[IAP] sku not found in subscriptions list:',
              productId,
              'connected:',
              connected,
              'subscriptions:',
              (subscriptions ?? []).map((s) => s.id)
            );
          Alert.alert('订阅失败', getIAPErrorMessage('sku-not-found'), [{ text: '知道了' }]);
          return;
        }
        try {
        markPurchaseSubmitting();
        pendingPurchaseSkusRef.current.add(productId);
        const res = await requestPurchase({
            type: 'subs',
            request: { apple: { sku: productId } },
          });
          console.log('============> requestPurchase res', res);
        } catch (e: unknown) {
          pendingPurchaseSkusRef.current.delete(productId);
          clearPurchaseSubmitting();
          console.log('============> requestPurchase error', e);
          const err = e as { code?: string; message?: string };
          Alert.alert(
            '订阅失败',
            getIAPErrorMessage(err?.code, err?.message ?? '请求支付时出错，请重试。'),
            [{ text: '知道了' }]
          );
        }
      }}
    />
    <UgcConsentModal
      visible={showUgcConsentModal}
      onAgree={handleAgreeUgcConsent}
      onDisagree={handleDisagreeUgcConsent}
      onPressPrivacy={handleOpenUgcPrivacy}
      onPressTerms={handleOpenUgcTerms}
    />
    <ToastOverlay />
    </>
  );
}
