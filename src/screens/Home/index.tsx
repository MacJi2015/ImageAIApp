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
import { EffectsTab } from './components/EffectsTab';
import { FeedTab, type FeedTabRef } from './components/FeedTab';
import logoIcon from '../../assets/logo-icon.png';
import homeTips from '../../assets/home-tips.png';

const COLORS = { bg: '#050a14', accent: '#00ffff' };

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'effects' | 'feed'>('feed');
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [stickyThreshold, setStickyThreshold] = useState(0);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const feedTabRef = useRef<FeedTabRef>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const y = contentOffset.y;
      setShowStickyHeader(stickyThreshold > 0 && y >= stickyThreshold);

      if (activeTab === 'feed') {
        const threshold = 150;
        const nearBottom =
          layoutMeasurement.height + y >= contentSize.height - threshold;
        if (nearBottom) {
          feedTabRef.current?.loadMore();
        }
      }
    },
    [activeTab, stickyThreshold]
  );

  const onHeroLayout = useCallback((e: LayoutChangeEvent) => {
    setStickyThreshold(e.nativeEvent.layout.height);
  }, []);

  const renderHeroBlock = () => (
    <View style={styles.heroBlock} onLayout={onHeroLayout}>
      <View style={styles.heroGradient} />
      <View style={styles.heroLogoRow}>
        <Image source={logoIcon} style={styles.heroLogo} resizeMode="contain" />
        <View style={styles.proBadge}>
          <Text style={styles.proText}>PRO</Text>
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
            activeTab === 'effects' && styles.tabActiveBackgroundLeft,
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
    showStickyHeader ? (
      <View
        style={[styles.stickyOverlay, { top: insets.top }]}
        pointerEvents="box-none"
      >
        <View style={styles.stickyHeader}>
          <View style={styles.stickyHeaderRow}>
            <Image source={logoIcon} style={styles.stickyLogo} resizeMode="contain" />
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          </View>
          <View style={styles.tabContainerSticky}>
            <View style={styles.tabBackground} />
            <View
              style={[
                styles.tabActiveBackground,
                activeTab === 'effects' && styles.tabActiveBackgroundLeft,
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
        </View>
      </View>
    ) : null;

  return (
    <View style={styles.container}>
      <View style={[styles.statusBarBg, { height: insets.top }]} />
      <ScrollView
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
    backgroundColor: '#051E28',
    zIndex: 10,
  },
  container: {
    backgroundColor: COLORS.bg,
    minHeight: 812,
    minWidth: 375,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  heroBlock: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
    marginBottom: 16,
  },
  heroLogo: {
    width: 100,
    height: 26,
  },
  homeTipsImage: {
    width: '100%',
    maxWidth: 340,
    height: 72,
    marginBottom: 12,
  },
  heroSubtitle: {
    color: '#3a4a65',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  tabBarWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  stickyOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 8,
  },
  stickyHeader: {
    backgroundColor: '#051E28',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  stickyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stickyLogo: {
    width: 100,
    height: 26,
  },
  proBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderStyle: 'solid',
    borderColor: COLORS.accent,
    borderRadius: 9999,
    height: 24,
    paddingVertical: 4,
    paddingHorizontal: 12,
    minWidth: 48,
  },
  proText: {
    color: COLORS.accent,
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabContainerSticky: {
    height: 44,
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
    borderRadius: 22,
    height: 36,
    width: '48%',
    right: 4,
    top: 4,
  },
  tabActiveBackgroundLeft: {
    left: 4,
    right: undefined,
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
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabTouchRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '50%',
    height: 44,
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
    paddingBottom: 100,
  },
});
