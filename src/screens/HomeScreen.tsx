import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image, ImageSourcePropType, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../routes/types';
import image1 from './image.png';
import image2 from './image-2.png';
import logoIcon from '../assets/logo-icon.png';
import likeDefaultIcon from '../assets/like-default-icon.png';
import likeSelectedIcon from '../assets/like-selected-icon.png';
import headNan from '../assets/head-nan.png';
import headNv from '../assets/head-nv.png';
import homeTips from '../assets/home-tips.png';
import ascIcon from '../assets/asc-icon.png';
import dogIcon from '../assets/dog-icon.png';
import cartIcon from '../assets/cart-icon.png';
import goodsImage from '../assets/goods.png';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const FEED_CARD_LIKES = [23, 23, 23, 234, 234, 234];
const FEED_CARD_SOURCES = [image1, image1, image1, image2, image2, image2];
const FEED_CARD_AVATARS = [headNan, headNv, headNan, headNv, headNan, headNv];

const EFFECT_CARD_SOURCES = [goodsImage, goodsImage, goodsImage];
const EFFECT_VIEW_COUNT = '1.2M';

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<'effects' | 'feed'>('feed');
  const [liked, setLiked] = React.useState<boolean[]>(Array(6).fill(false));
  /** 吸顶阈值：当滚动超过该高度时显示吸顶栏（Logo + Tab） */
  const [stickyThreshold, setStickyThreshold] = React.useState(0);
  const [showStickyHeader, setShowStickyHeader] = React.useState(false);

  const toggleLike = (index: number) => {
    setLiked(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    setShowStickyHeader(stickyThreshold > 0 && y >= stickyThreshold);
  };

  const onHeroLayout = (e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    setStickyThreshold(height);
  };

  /** 首屏整块：Logo 在 homeTips 上方，按 Figma 顺序（Logo → 主标题 → 副标题），随滚动滑走 */
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
      <Text style={styles.heroSubtitle}>Upload your pet—instant AI video magic.</Text>
    </View>
  );

  /** Tab 栏：在滚动内容中紧跟 hero，与 Figma 一致 */
  const renderTabBar = () => (
    <View style={styles.tabBarWrap}>
      <View style={styles.tabContainerSticky}>
        <View style={styles.tabBackground} />
        <View style={[styles.tabActiveBackground, activeTab === 'effects' && styles.tabActiveBackgroundLeft]} />
        <TouchableOpacity style={styles.tabTouchLeft} onPress={() => setActiveTab('effects')} activeOpacity={0.8}>
          <Text style={[styles.tabEffects, activeTab === 'effects' && styles.tabEffectsActive]}>Effects</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabTouchRight} onPress={() => setActiveTab('feed')} activeOpacity={0.8}>
          <Text style={[styles.tabFeed, activeTab === 'feed' && styles.tabFeedActive]}>Feed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /** 吸顶栏：仅滚动超过 hero 后显示，覆盖在顶部（Logo + Tab） */
  const renderStickyOverlay = () =>
    showStickyHeader ? (
      <View style={[styles.stickyOverlay, { top: insets.top }]} pointerEvents="box-none">
        <View style={styles.stickyHeader}>
          <View style={styles.stickyHeaderRow}>
            <Image source={logoIcon} style={styles.stickyLogo} resizeMode="contain" />
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          </View>
          <View style={styles.tabContainerSticky}>
            <View style={styles.tabBackground} />
            <View style={[styles.tabActiveBackground, activeTab === 'effects' && styles.tabActiveBackgroundLeft]} />
            <TouchableOpacity style={styles.tabTouchLeft} onPress={() => setActiveTab('effects')} activeOpacity={0.8}>
              <Text style={[styles.tabEffects, activeTab === 'effects' && styles.tabEffectsActive]}>Effects</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabTouchRight} onPress={() => setActiveTab('feed')} activeOpacity={0.8}>
              <Text style={[styles.tabFeed, activeTab === 'feed' && styles.tabFeedActive]}>Feed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ) : null;

  const renderFeedContent = () => (
    <View style={styles.cardsContainer}>
      {[0, 1, 2].map(i => (
        <TouchableOpacity
          key={`l-${i}`}
          style={[styles.cardBase, styles.cardLeft, { top: i * 232 }]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Detail', { id: String(i + 1), title: '示例详情' })}
        >
          <Image source={FEED_CARD_SOURCES[i]} style={styles.cardImage} resizeMode="cover" />
          <TouchableOpacity
            style={[styles.cardLikeBadge, styles.cardLikeBadgeRow]}
            onPress={e => { e.stopPropagation(); toggleLike(i); }}
            activeOpacity={0.8}
          >
            <Image source={liked[i] ? likeSelectedIcon : likeDefaultIcon} style={styles.cardLikeIconSize} resizeMode="contain" />
            <Text style={styles.cardLikeCountInside}>{FEED_CARD_LIKES[i] + (liked[i] ? 1 : 0)}</Text>
          </TouchableOpacity>
          <View style={styles.cardAvatar}>
            <Image source={FEED_CARD_AVATARS[i]} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </View>
          <Text style={styles.cardUsername}>@SpacePup</Text>
        </TouchableOpacity>
      ))}
      {[3, 4, 5].map(i => (
        <TouchableOpacity
          key={`r-${i}`}
          style={[styles.cardBase, styles.cardRight, { top: (i - 3) * 232 }]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Detail', { id: String(i + 1), title: '示例详情' })}
        >
          <Image source={FEED_CARD_SOURCES[i]} style={styles.cardImage} resizeMode="cover" />
          <TouchableOpacity
            style={[styles.cardLikeBadgeRight, styles.cardLikeBadgeRow]}
            onPress={e => { e.stopPropagation(); toggleLike(i); }}
            activeOpacity={0.8}
          >
            <Image source={liked[i] ? likeSelectedIcon : likeDefaultIcon} style={styles.cardLikeIconSize} resizeMode="contain" />
            <Text style={styles.cardLikeCountInside}>{FEED_CARD_LIKES[i] + (liked[i] ? 1 : 0)}</Text>
          </TouchableOpacity>
          <View style={styles.cardAvatar}>
            <Image source={FEED_CARD_AVATARS[i]} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </View>
          <Text style={styles.cardUsername}>@SpacePup</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEffectCard = (
    source: ImageSourcePropType,
    cornerIcon: ImageSourcePropType,
    title: string,
    index: number,
    isLeft: boolean,
  ) => (
    <TouchableOpacity
      key={isLeft ? `effect-l-${index}` : `effect-r-${index}`}
      style={[styles.effectCard, isLeft ? styles.effectCardLeft : styles.effectCardRight]}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Detail', { id: `effect-${index}`, title })}
    >
      <Image source={source} style={styles.effectCardImage} resizeMode="cover" />
      <View style={styles.effectCardGradient} />
      <View style={styles.effectCardCornerIconWrap}>
        <Image source={cornerIcon} style={styles.effectCardCornerIcon} resizeMode="contain" />
      </View>
      <View style={styles.effectCardBottom}>
        <View style={styles.effectCardBottomLeft}>
          <Text style={styles.effectCardTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.effectCardMeta}>
            <Image source={ascIcon} style={styles.effectCardTrendIcon} resizeMode="contain" />
            <Text style={styles.effectCardCount}>{EFFECT_VIEW_COUNT}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.effectCardTryBtn}
          activeOpacity={0.8}
          onPress={e => { e.stopPropagation(); }}
        >
          <Text style={styles.effectCardTryText}>TRY</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEffectsContent = () => (
    <View style={styles.effectsContainer}>
      <View style={styles.effectsGrid}>
        <View style={styles.effectsColumn}>
          {EFFECT_CARD_SOURCES.map((img, i) =>
            renderEffectCard(img, dogIcon, 'Rock Star', i, true),
          )}
        </View>
        <View style={styles.effectsColumn}>
          {EFFECT_CARD_SOURCES.map((img, i) =>
            renderEffectCard(img, cartIcon, 'Rock Star', i, false),
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.statusBarBg, { height: insets.top }]} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {renderHeroBlock()}
        {renderTabBar()}
        {activeTab === 'feed' ? renderFeedContent() : renderEffectsContent()}
      </ScrollView>
      {renderStickyOverlay()}
    </View>
  );
}

// 设计变量（原 var(--variable-collection) / var(--variable-collection-1)）
const COLORS = { bg: '#050a14', accent: '#00ffff' };


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
  cardBase: {
    position: 'absolute',
    height: 224,
    width: 172,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardLeft: {
    left: 16,
  },
  cardRight: {
    right: 16,
    left: undefined,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  cardLikeBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: '#00000099',
    borderRadius: 12,
    height: 28,
    minWidth: 44,
    paddingHorizontal: 8,
  },
  cardLikeBadgeRight: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: '#00000099',
    borderRadius: 12,
    height: 28,
    minWidth: 50,
    paddingHorizontal: 8,
  },
  cardLikeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cardLikeIconSize: {
    width: 14,
    height: 14,
  },
  cardLikeCountInside: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '400',
  },
  cardAvatar: {
    position: 'absolute',
    left: 8,
    bottom: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardUsername: {
    position: 'absolute',
    left: 32,
    bottom: 14,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  cardsContainer: {
    position: 'relative',
    height: 696,
    width: '100%',
    paddingBottom: 100,
  },
  effectsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  effectsGrid: {
    flexDirection: 'row',
    gap: 7,
  },
  effectsColumn: {
    flex: 1,
    maxWidth: 168,
    gap: 8,
  },
  effectCard: {
    width: '100%',
    height: 268,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  effectCardLeft: {
    marginRight: 0,
  },
  effectCardRight: {
    marginLeft: 0,
  },
  effectCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  effectCardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
    backgroundColor: 'rgba(5,10,20,0.8)',
  },
  effectCardCornerIconWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#48312E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectCardCornerIcon: {
    width: 16,
    height: 16,
  },
  effectCardBottom: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  effectCardBottomLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
  },
  effectCardTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  effectCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  effectCardTrendIcon: {
    width: 10,
    height: 10,
    marginRight: 4,
  },
  effectCardCount: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '400',
  },
  effectCardTryBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 22,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectCardTryText: {
    color: COLORS.bg,
    fontSize: 10,
    fontWeight: '700',
  },
  bottomGroup: {
    height: 81,
    left: 0,
    right: 0,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  bottomBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 10, 20, 0.8)',
  },
  bottomNavLeft: {
    position: 'absolute',
    left: 75,
    top: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavCenter: {
    position: 'absolute',
    left: '50%',
    marginLeft: -22,
    top: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavRight: {
    position: 'absolute',
    right: 75,
    top: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavPlusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavPlusText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 28,
  },
  bottomNavIcon: {
    width: 32,
    height: 32,
  },
  bottomNavDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
});
