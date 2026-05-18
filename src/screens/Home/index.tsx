import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../routes/types';
import LinearGradient from 'react-native-linear-gradient';
import { EffectsTab } from './components/EffectsTab';
import { FeedTab, type FeedTabRef } from './components/FeedTab';
import logoIcon from '../../assets/logoIcon.png';
import homeTips from '../../assets/home-tips.png';
import { dp, hp } from '../../utils/scale';
import { useAppStore, useUserStore } from '../../store';
import { getProfile, profileToUserInfo } from '../../api/services/user';
import { getUgcConsentAccepted } from '../../services/ugcConsentStorage';

const COLORS = { bg: '#050a14', accent: '#00ffff' };

type HomeScreenProps = {
  onTabBarOverlayChange?: (translucent: boolean) => void;
};

export function HomeScreen(_props?: HomeScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const token = useUserStore((s) => s.token);
  const authSessionEpoch = useAppStore((s) => s.authSessionEpoch);
  const authHydrated = useAppStore((s) => s.authHydrated);
  const feedRefreshEpoch = useAppStore((s) => s.feedRefreshEpoch);
  const setTabBarTranslucent = useAppStore((s) => s.setTabBarTranslucent);
  const openLoginModal = useAppStore((s) => s.openLoginModal);
  const openUgcConsentModal = useAppStore((s) => s.openUgcConsentModal);
  const isPro = user?.userType === 'Pro' || user?.isPremium === true;
  const [activeTab, setActiveTab] = useState<'effects' | 'feed'>('effects');
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [logoStickyThreshold, setLogoStickyThreshold] = useState(0);
  const [tabStickyThreshold, setTabStickyThreshold] = useState(0);
  const [showStickyLogo, setShowStickyLogo] = useState(false);
  const [showStickyTabs, setShowStickyTabs] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [ugcConsentAccepted, setUgcConsentAcceptedState] = useState(false);
  const feedTabRef = useRef<FeedTabRef>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const tabBarHeight = 56 + Math.max(insets.bottom, 8);

  useEffect(() => {
    let mounted = true;
    getUgcConsentAccepted().then((accepted) => {
      if (!mounted) return;
      setUgcConsentAcceptedState(accepted);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    scrollYRef.current = 0;
    setShowStickyLogo(false);
    setShowStickyTabs(false);
    setHasScrolled(false);
    setTabBarTranslucent(false);
  }, [setTabBarTranslucent]);

  const isFirstTabRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstTabRenderRef.current) {
      isFirstTabRenderRef.current = false;
      return;
    }
    scrollToTop();
  }, [activeTab, scrollToTop]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const y = contentOffset.y;
      scrollYRef.current = y;
      const maxOffsetY = Math.max(0, contentSize.height - layoutMeasurement.height);
      const clampedY = Math.min(Math.max(y, 0), maxOffsetY);
      const bottomRegionTop = clampedY + layoutMeasurement.height - tabBarHeight;
      const effectiveContentHeight = Math.max(0, contentSize.height - tabBarHeight);
      const intersectsTabArea = bottomRegionTop < effectiveContentHeight;
      setTabBarTranslucent(intersectsTabArea);
      setHasScrolled(y > 0);
      const LOGO_OFFSET = 8;
      const TAB_OFFSET = 60; // 刚接触到 tab 即吸顶

      setShowStickyLogo(logoStickyThreshold > 0 && y + LOGO_OFFSET >= logoStickyThreshold);
      setShowStickyTabs(tabStickyThreshold > 0 && y + TAB_OFFSET >= tabStickyThreshold);

      if (activeTab === 'feed') {
        const threshold = 150;
        const nearBottom =
          layoutMeasurement.height + y >= contentSize.height - threshold;
        if (nearBottom) {
          feedTabRef.current?.loadMore();
        }
      }
    },
    [activeTab, logoStickyThreshold, setTabBarTranslucent, tabBarHeight, tabStickyThreshold]
  );

  const onHeroLayout = useCallback((e: LayoutChangeEvent) => {
    setTabStickyThreshold(e.nativeEvent.layout.height);
  }, []);

  const onHeroLogoLayout = useCallback((e: LayoutChangeEvent) => {
    setLogoStickyThreshold(e.nativeEvent.layout.y);
  }, []);

  const handleProBadgePress = useCallback(() => {
    // navigation.navigate('GenerationInProgress', {
    //   taskId: 'dev-preview-task',
    //   imageUri: 'https://picsum.photos/seed/petsgo-preview/400/400',
    //   // estimatedTime: 120,
    // });
  }, []);

  const handleFeedTabPress = useCallback(() => {
    const run = async () => {
      if (ugcConsentAccepted) {
        setActiveTab('feed');
        return;
      }
      const accepted = await getUgcConsentAccepted();
      if (accepted) {
        setUgcConsentAcceptedState(true);
        setActiveTab('feed');
        return;
      }
      openUgcConsentModal({
        onAgreed: () => {
          setUgcConsentAcceptedState(true);
          setActiveTab('feed');
        },
      });
    };
    run().catch((error) => {
      __DEV__ && console.warn('[HomeScreen] failed to check UGC consent', error);
    });
  }, [openUgcConsentModal, ugcConsentAccepted]);

  useFocusEffect(
    useCallback(() => {
      // 首页聚焦时不强制刷新 Feed/Effects，仅在已登录时同步用户信息用于右上角 FREE/PRO。
      if (!authHydrated || !token) {
        return undefined;
      }
      (async () => {
        try {
          const profile = await getProfile();
          const base = profileToUserInfo(profile);
          setUser({
            ...base,
            isPremium: base.isPremium ?? false,
            premiumExpireAt: base.premiumExpireAt ?? user?.premiumExpireAt,
          });
        } catch {
          // 静默失败，保留本地用户信息
        }
      })();
      return undefined;
    }, [authHydrated, setUser, token, user?.premiumExpireAt])
  );

  const renderHeroBlock = () => (
    <View style={styles.heroBlock} onLayout={onHeroLayout}>
      <View style={styles.heroLogoRow} onLayout={onHeroLogoLayout}>
        <Image source={logoIcon} style={styles.heroLogo} resizeMode="contain" />
        <TouchableOpacity
          style={[styles.proBadge, isPro && styles.proBadgePro]}
          activeOpacity={0.8}
          onPress={handleProBadgePress}
        >
          <Text style={[styles.proText, isPro && styles.proTextPro]}>
            {isPro ? 'PRO' : 'FREE'}
          </Text>
        </TouchableOpacity>
      </View>
      <Image source={homeTips} style={styles.homeTipsImage} resizeMode="contain" />
      <Text style={styles.heroSubtitle}>
        Upload your pet—instant AI video magic.
      </Text>
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBarWrap}>
        <View style={styles.tabContainerSticky}>
        <View style={styles.tabBackground} />
        <View
          style={[
            styles.tabActiveBackground,
            activeTab === 'feed' ? styles.tabActivePosRight : styles.tabActivePosLeft,
          ]}
        />
        <TouchableOpacity
          style={styles.tabTouchLeft}
          onPress={() => setActiveTab('effects')}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.tabEffects, activeTab === 'effects' && styles.tabEffectsActive]}
          >
            Effects
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabTouchRight}
          onPress={handleFeedTabPress}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.tabFeed, activeTab === 'feed' && styles.tabFeedActive]}
          >
            Feed
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStickyOverlay = () =>
    showStickyLogo || showStickyTabs ? (
      <View
        style={[styles.stickyOverlay, { top: insets.top }]}
        pointerEvents="box-none"
      >
        <View style={[styles.stickyHeader, !showStickyLogo && styles.stickyHeaderTabsOnly]}>
          {showStickyLogo && (
            <View style={styles.stickyHeaderRow}>
              <Image source={logoIcon} style={styles.stickyLogo} resizeMode="contain" />
              <View style={[styles.proBadge, isPro && styles.proBadgePro]}>
                <Text style={[styles.proText, isPro && styles.proTextPro]}>
                  {isPro ? 'PRO' : 'FREE'}
                </Text>
              </View>
            </View>
          )}
          {showStickyTabs && (
            <View style={styles.tabContainerSticky}>
              <View style={styles.tabBackground} />
              <View
                style={[
                  styles.tabActiveBackground,
                  activeTab === 'feed' ? styles.tabActivePosRight : styles.tabActivePosLeft,
                ]}
              />
              <TouchableOpacity
                style={styles.tabTouchLeft}
                onPress={() => setActiveTab('effects')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabEffects,
                    activeTab === 'effects' && styles.tabEffectsActive,
                  ]}
                >
                  Effects
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tabTouchRight}
                onPress={handleFeedTabPress}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.tabFeed, activeTab === 'feed' && styles.tabFeedActive]}
                >
                  Feed
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    ) : null;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.statusBarBg,
          { height: insets.top },
          hasScrolled && styles.statusBarBgFilled,
        ]}
      />
      <LinearGradient
        colors={['#05202A', '#050A14']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.topGradient]}
        pointerEvents="none"
      />
     
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            progressViewOffset={insets.top + hp(16)}
          />
        }
      >
        {renderHeroBlock()}
        {renderTabBar()}
        <View style={styles.tabContentArea}>
          <View
            pointerEvents={activeTab === 'effects' ? 'auto' : 'none'}
            style={[
              styles.tabPanel,
              activeTab === 'effects' ? styles.tabPanelActive : styles.tabPanelInactive,
            ]}
            collapsable={false}
          >
            <EffectsTab
              refreshKey={refreshKey}
              authSessionEpoch={authSessionEpoch}
              authHydrated={authHydrated}
            />
          </View>
          <View
            pointerEvents={activeTab === 'feed' ? 'auto' : 'none'}
            style={[
              styles.tabPanel,
              activeTab === 'feed' ? styles.tabPanelActive : styles.tabPanelInactive,
            ]}
            collapsable={false}
          >
            <FeedTab
              ref={feedTabRef}
              refreshKey={refreshKey}
              authSessionEpoch={authSessionEpoch}
              feedRefreshEpoch={feedRefreshEpoch}
              authHydrated={authHydrated}
            />
          </View>
        </View>
      </ScrollView>
      {renderStickyOverlay()}
    </View>
  );
}

const styles = StyleSheet.create({
  statusBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // backgroundColor: COLORS.bg,
    zIndex: 10,
  },
  statusBarBgFilled: {
    backgroundColor: COLORS.bg,
  },
  container: {
    backgroundColor: COLORS.bg,
    minHeight: '100%',
    minWidth: '100%',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  topGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: hp(210),
    // zIndex:11
  },
  heroBlock: {
    width: '100%',
    paddingHorizontal: dp(16),
    paddingTop: hp(8),
    paddingBottom: hp(20),
    position: 'relative',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 32, 42, 0.5)',
  },
  heroLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(20),
  },
  heroLogo: {
    width: dp(69),
    height: hp(28),
  },
  homeTipsImage: {
    maxWidth: dp(340),
    height: hp(72),
    marginBottom: hp(4),
    marginLeft: -8
  },
  heroSubtitle: {
    color: '#3a4a65',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  tabBarWrap: {
    paddingHorizontal: dp(16),
    paddingBottom: hp(7),
  },
  stickyOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 8,
  },
  stickyHeader: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: dp(16),
    paddingTop: hp(12),
    paddingBottom: hp(12),
  },
  stickyHeaderTabsOnly: {
    paddingTop: hp(6),
    paddingBottom: hp(8),
  },
  stickyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(12),
  },
  stickyLogo: {
    width: dp(69),
    height: hp(28),
  },
  proBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderStyle: 'solid',
    borderColor: COLORS.accent,
    borderRadius: 9999,
    height: hp(24),
    paddingVertical: hp(4),
    paddingHorizontal: dp(12),
    minWidth: dp(48),
  },
  proText: {
    color: COLORS.accent,
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  proBadgePro: {
    borderColor: '#FFEFD3',
    backgroundColor: 'rgba(255,239,211,0.10)',
  },
  proTextPro: {
    color: '#FFEFD3',
  },
  tabContainerSticky: {
    height: hp(44),
    position: 'relative',
    backgroundColor: '#09111f',
    borderWidth: 0.5,
    borderStyle: 'solid',
    borderColor: '#00ffff33',
    borderRadius: dp(22),
  },
  tabBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderRadius: dp(22),
  },
  tabActiveBackground: {
    position: 'absolute',
    backgroundColor: COLORS.accent,
    borderRadius: dp(22),
    height: hp(36),
    width: '48%',
    top: hp(4),
  },
  tabActivePosLeft: {
    left: dp(4),
  },
  tabActivePosRight: {
    right: dp(4),
  },
  tabEffects: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  tabFeed: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  tabTouchLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '50%',
    height: hp(44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabTouchRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '50%',
    height: hp(44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabEffectsActive: {
    color: COLORS.bg,
  },
  tabFeedActive: {
    color: COLORS.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  tabContentArea: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
  tabPanel: {
    width: '100%',
    left: 0,
    right: 0,
  },
  tabPanelActive: {
    position: 'relative',
    opacity: 1,
    zIndex: 2,
  },
  tabPanelInactive: {
    position: 'absolute',
    top: 0,
    opacity: 0,
    zIndex: 1,
  },
});
