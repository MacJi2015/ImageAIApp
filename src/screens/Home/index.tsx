import React, { useCallback, useRef, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { EffectsTab } from './components/EffectsTab';
import { FeedTab, type FeedTabRef } from './components/FeedTab';
import logoIcon from '../../assets/logoIcon.png';
import homeTips from '../../assets/home-tips.png';
import { dp, hp } from '../../utils/scale';
import { useUserStore } from '../../store/useUserStore';

const COLORS = { bg: '#050a14', accent: '#00ffff' };

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useUserStore((s) => s.user);
  const isPro = user?.userType === 'Pro' || user?.isPremium === true;
  const [activeTab, setActiveTab] = useState<'effects' | 'feed'>('effects');
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [logoStickyThreshold, setLogoStickyThreshold] = useState(0);
  const [tabStickyThreshold, setTabStickyThreshold] = useState(0);
  const [showStickyLogo, setShowStickyLogo] = useState(false);
  const [showStickyTabs, setShowStickyTabs] = useState(false);
  const feedTabRef = useRef<FeedTabRef>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const hasFocusedRef = useRef(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const y = contentOffset.y;
      scrollYRef.current = y;
      const TAB_OFFSET = 20; // 提前少量吸顶，视觉上刚接触就固定

      setShowStickyLogo(logoStickyThreshold > 0 && y >= logoStickyThreshold);
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
    [activeTab, logoStickyThreshold, tabStickyThreshold]
  );

  const onHeroLayout = useCallback((e: LayoutChangeEvent) => {
    setTabStickyThreshold(e.nativeEvent.layout.height);
  }, []);

  const onHeroLogoLayout = useCallback((e: LayoutChangeEvent) => {
    setLogoStickyThreshold(e.nativeEvent.layout.y);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedRef.current) {
        hasFocusedRef.current = true;
        return undefined;
      }
      // 切回 Home 时刷新数据，同时保持用户当前浏览位置。
      const prevY = scrollYRef.current;
      setRefreshKey((k) => k + 1);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: prevY, animated: false });
      });
      return undefined;
    }, [])
  );

  const renderHeroBlock = () => (
    <View style={styles.heroBlock} onLayout={onHeroLayout}>
      {/* <View style={styles.heroGradient} /> */}
      <View style={styles.heroLogoRow} onLayout={onHeroLogoLayout}>
        <Image source={logoIcon} style={styles.heroLogo} resizeMode="contain" />
        <View style={[styles.proBadge, isPro && styles.proBadgePro]}>
          <Text style={[styles.proText, isPro && styles.proTextPro]}>
            {isPro ? 'PRO' : 'FREE'}
          </Text>
        </View>
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
          onPress={() => setActiveTab('feed')}
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
        <View style={styles.stickyHeader}>
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
                onPress={() => setActiveTab('feed')}
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
      <View style={[styles.statusBarBg, { height: insets.top }]} />
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
          />
        }
      >
        {renderHeroBlock()}
        {renderTabBar()}
        {activeTab === 'feed' ? (
          <FeedTab ref={feedTabRef} refreshKey={refreshKey} />
        ) : (
          <EffectsTab refreshKey={refreshKey} />
        )}
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
    backgroundColor: COLORS.bg,
    zIndex: 10,
  },
  container: {
    backgroundColor: COLORS.bg,
    minHeight: '100%',
    minWidth: '100%',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
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
    borderRadius: 22,
  },
  tabBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderRadius: 22,
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
});
