import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RootStackParamList } from '../routes/types';
import ellipse102 from "./ellipse-10-2.png";
import ellipse10 from "./ellipse-10.png";
import image2 from "./image-2.png";
import image3 from "./image-3.png";
import image4 from "./image-4.png";
import image5 from "./image-5.png";
import image6 from "./image-6.png";
import image1 from "./image.png";
import statusbarLight from "./statusbar-light.png";
type HomeNav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const [activeTab, setActiveTab] = React.useState<'effects' | 'feed'>('feed');

  return (
    <View style={styles.container}>
      {/* 顶部渐变背景 */}
      <View style={styles.backgroundGradient} />

      {/* 状态栏 */}
      <View style={styles.header}>
        <Image source={statusbarLight} style={styles.statusbar} resizeMode="cover" />
      </View>

      {/* Logo */}
      <Text style={styles.logo}>PetTales</Text>

      {/* PRO 徽章 */}
      <View style={styles.proBadge}>
        <Text style={styles.proText}>PRO</Text>
      </View>

      {/* 主标题 */}
      <Text style={styles.title}>Turn Pets{'\n'}into SUPERStar</Text>

      {/* 副标题 */}
      <Text style={styles.subtitle}>Upload your pet—instant AI video magic333.</Text>

      {/* Tab：Effects | Feed */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBackground} />
        <View style={[styles.tabActiveBackground, activeTab === 'effects' && styles.tabActiveBackgroundLeft]} />
        <TouchableOpacity style={styles.tabTouchLeft} onPress={() => setActiveTab('effects')} activeOpacity={0.8}>
          <Text style={[styles.tabEffects, activeTab === 'effects' && styles.tabEffectsActive]}>Effects</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabTouchRight} onPress={() => setActiveTab('feed')} activeOpacity={0.8}>
          <Text style={[styles.tabFeed, activeTab === 'feed' && styles.tabFeedActive]}>Feed</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsContainer}>
          {/* 左列 3 张卡片 */}
          <TouchableOpacity style={styles.card1} activeOpacity={0.9} onPress={() => navigation.navigate('Detail', { id: '1', title: '示例详情' })}>
          <Image source={image1} style={styles.cardImage1} resizeMode="cover" />
          <View style={[styles.cardLikeBadge1, styles.cardLikeBadgeRow]}>
            <Image source={image3} style={styles.cardLikeIconSize} resizeMode="contain" />
            <Text style={styles.cardLikeCountInside}>23</Text>
          </View>
          <View style={styles.cardAvatar1}>
            <Image source={ellipse10} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </View>
          <Text style={styles.cardUsername1}>@SpacePup</Text>
          </TouchableOpacity>
          <View style={styles.card2}>
          <Image source={image1} style={styles.cardImage2} resizeMode="cover" />
          <View style={[styles.cardLikeBadge2, styles.cardLikeBadgeRow]}>
            <Image source={image3} style={styles.cardLikeIconSize} resizeMode="contain" />
            <Text style={styles.cardLikeCountInside}>23</Text>
          </View>
          <View style={styles.cardAvatar2}>
            <Image source={ellipse10} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </View>
          <Text style={styles.cardUsername2}>@SpacePup</Text>
        </View>
        <View style={styles.card3}>
          <Image source={image1} style={styles.cardImage3} resizeMode="cover" />
          <View style={[styles.cardLikeBadge3, styles.cardLikeBadgeRow]}>
            <Image source={image3} style={styles.cardLikeIconSize} resizeMode="contain" />
            <Text style={styles.cardLikeCountInside}>23</Text>
          </View>
          <View style={styles.cardAvatar3}>
            <Image source={ellipse10} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </View>
          <Text style={styles.cardUsername3}>@SpacePup</Text>
        </View>

        {/* 右列 3 张卡片 */}
        <View style={styles.card4}>
          <Image source={image2} style={styles.cardImage4} resizeMode="cover" />
          <View style={[styles.cardLikeBadge4, styles.cardLikeBadgeRow]}>
            <Image source={image4} style={styles.cardLikeIconSize} resizeMode="contain" />
            <Text style={styles.cardLikeCountInside}>234</Text>
          </View>
          <View style={styles.cardAvatar4}>
            <Image source={ellipse102} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </View>
          <Text style={styles.cardUsername4}>@SpacePup</Text>
        </View>
        <View style={styles.card5}>
          <Image source={image2} style={styles.cardImage5} resizeMode="cover" />
          <View style={[styles.cardLikeBadge5, styles.cardLikeBadgeRow]}>
            <Image source={image4} style={styles.cardLikeIconSize} resizeMode="contain" />
            <Text style={styles.cardLikeCountInside}>234</Text>
          </View>
          <View style={styles.cardAvatar5}>
            <Image source={ellipse102} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </View>
          <Text style={styles.cardUsername5}>@SpacePup</Text>
        </View>
        <View style={styles.card6}>
          <Image source={image2} style={styles.cardImage6} resizeMode="cover" />
          <View style={[styles.cardLikeBadge6, styles.cardLikeBadgeRow]}>
            <Image source={image4} style={styles.cardLikeIconSize} resizeMode="contain" />
            <Text style={styles.cardLikeCountInside}>234</Text>
          </View>
          <View style={styles.cardAvatar6}>
            <Image source={ellipse102} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </View>
          <Text style={styles.cardUsername6}>@SpacePup</Text>
        </View>
        </View>
      </ScrollView>

      
    </View>
  );
}

// 设计变量（原 var(--variable-collection) / var(--variable-collection-1)）
const COLORS = { bg: '#050a14', accent: '#00ffff' };

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg,
    minHeight: 812,
    minWidth: 375,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  backgroundGradient: {
    backgroundColor: 'rgba(5, 32, 42, 1)',
    height: 210,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 375,
  },
  header: {
    flexDirection: 'column',
    gap: 11,
    height: 80,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 375,
    zIndex: 10,
  },
  statusbar: {
    height: 44,
    width: 375,
  },
  headerContent: {
    alignItems: 'center',
    gap: 235,
    height: 24,
    justifyContent: 'space-around',
    marginLeft: 15,
    position: 'relative',
    width: 345,
  },
  headerPlaceholder: {
    height: 24,
    position: 'relative',
    width: 63,
  },
  logo: {
    color: COLORS.accent,
    fontFamily: 'Space Grotesk',
    fontSize: 18,
    fontWeight: '400',
    left: 16,
    letterSpacing: 0,
    lineHeight: 18,
    position: 'absolute',
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    top: 49,
  },
  proBadge: {
    alignItems: 'center',
    aspectRatio: 2,
    borderWidth: 0.5,
    borderStyle: 'solid',
    borderColor: COLORS.accent,
    borderRadius: 9999,
    height: 24,
    justifyContent: 'center',
    left: 311,
    paddingVertical: 4,
    paddingHorizontal: 12,
    position: 'absolute',
    top: 46,
    width: 48,
  },
  proText: {
    alignItems: 'center',
    color: COLORS.accent,
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    fontWeight: '700',
    justifyContent: 'center',
    letterSpacing: 1,
    lineHeight: 15,
    position: 'relative',
    textAlign: 'center',
  },
  tabContainer: {
    height: 44,
    left: 16,
    position: 'absolute',
    top: 196,
    width: 347,
  },
  tabBackground: {
    backgroundColor: '#09111f',
    borderWidth: 0.5,
    borderStyle: 'solid',
    borderColor: '#00ffff33',
    borderRadius: 22,
    height: 44,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 343,
  },
  tabActiveBackground: {
    backgroundColor: COLORS.accent,
    borderRadius: 22,
    height: 36,
    left: 172,
    position: 'absolute',
    top: 4,
    width: 167,
  },
  tabEffects: {
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: 'Space Grotesk',
    fontSize: 14,
    fontWeight: '700',
    height: 14,
    justifyContent: 'center',
    left: 63,
    letterSpacing: 0,
    lineHeight: 14,
    position: 'absolute',
    textAlign: 'center',
    top: 15,
  },
  tabFeed: {
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: 'Space Grotesk',
    fontSize: 14,
    fontWeight: '700',
    height: 14,
    justifyContent: 'center',
    left: 239,
    letterSpacing: 0,
    lineHeight: 14,
    position: 'absolute',
    textAlign: 'center',
    top: 15,
  },
  title: {
    color: COLORS.accent,
    fontFamily: 'Space Grotesk',
    fontSize: 36,
    fontWeight: '700',
    height: 72,
    left: 16,
    letterSpacing: 0,
    lineHeight: 36,
    position: 'absolute',
    top: 86,
  },
  subtitle: {
    alignItems: 'center',
    color: '#3a4a65',
    fontFamily: 'Space Grotesk',
    fontSize: 14,
    fontWeight: '400',
    height: 14,
    justifyContent: 'center',
    left: 16,
    letterSpacing: 0,
    lineHeight: 14,
    position: 'absolute',
    top: 162,
  },
  card1: {
    height: 224,
    left: 16,
    position: 'absolute',
    top: 256,
    width: 172,
  },
  cardImage1: {
    height: 224,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 168,
  },
  cardUsername1: {
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: 'Space Grotesk',
    fontSize: 12,
    fontWeight: '700',
    height: 12,
    justifyContent: 'center',
    left: 28,
    letterSpacing: 0,
    lineHeight: 12,
    position: 'absolute',
    top: 202,
    width: 73,
  },
  cardLikeBadge1: {
    backgroundColor: '#00000099',
    borderRadius: 12,
    height: 20,
    left: 119,
    position: 'absolute',
    top: 8,
    width: 41,
  },
  cardLikeCount1: {
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    fontWeight: '400',
    height: 10,
    justifyContent: 'center',
    left: 141,
    letterSpacing: 0,
    lineHeight: 10,
    position: 'absolute',
    top: 13,
  },
  cardAvatar1: {
    aspectRatio: 1,
    height: 16,
    left: 8,
    position: 'absolute',
    top: 200,
    width: 16,
  },
  cardLikeIcon1: {
    aspectRatio: 1,
    height: 12,
    left: 125,
    position: 'absolute',
    top: 12,
    width: 12,
  },
  cardLikeIconImage1: {
    flex: 1,
    marginLeft: '8.33%',
    marginRight: '8.33%',
    width: 10,
  },
  card2: {
    height: 224,
    left: 16,
    position: 'absolute',
    top: 488,
    width: 172,
  },
  cardImage2: {
    height: 224,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 168,
  },
  cardUsername2: {
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: 'Space Grotesk',
    fontSize: 12,
    fontWeight: '700',
    height: 12,
    justifyContent: 'center',
    left: 28,
    letterSpacing: 0,
    lineHeight: 12,
    position: 'absolute',
    top: 202,
    width: 73,
  },
  cardLikeBadge2: {
    backgroundColor: '#00000099',
    borderRadius: 12,
    height: 20,
    left: 119,
    position: 'absolute',
    top: 8,
    width: 41,
  },
  cardLikeCount2: {
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    fontWeight: '400',
    height: 10,
    justifyContent: 'center',
    left: 141,
    letterSpacing: 0,
    lineHeight: 10,
    position: 'absolute',
    top: 13,
  },
  cardAvatar2: {
    aspectRatio: 1,
    height: 16,
    left: 8,
    position: 'absolute',
    top: 200,
    width: 16,
  },
  cardLikeIcon2: {
    aspectRatio: 1,
    height: 12,
    left: 125,
    position: 'absolute',
    top: 12,
    width: 12,
  },
  cardLikeIconImage2: {
    flex: 1,
    marginLeft: '8.33%',
    marginRight: '8.33%',
    width: 10,
  },
  card3: {
    height: 224,
    left: 16,
    position: 'absolute',
    top: 720,
    width: 172,
  },
  cardImage3: {
    height: 92,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 168,
  },
  cardUsername3: {
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: 'Space Grotesk',
    fontSize: 12,
    fontWeight: '700',
    height: 12,
    justifyContent: 'center',
    left: 28,
    letterSpacing: 0,
    lineHeight: 12,
    position: 'absolute',
    top: 202,
    width: 73,
  },
  cardLikeBadge3: {
    backgroundColor: '#00000099',
    borderRadius: 12,
    height: 20,
    left: 119,
    position: 'absolute',
    top: 8,
    width: 41,
  },
  cardLikeCount3: {
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    fontWeight: '400',
    height: 10,
    justifyContent: 'center',
    left: 141,
    letterSpacing: 0,
    lineHeight: 10,
    position: 'absolute',
    top: 13,
  },
  cardAvatar3: {
    aspectRatio: 1,
    height: 16,
    left: 8,
    position: 'absolute',
    top: 200,
    width: 16,
  },
  cardLikeIcon3: {
    aspectRatio: 1,
    height: 12,
    left: 125,
    position: 'absolute',
    top: 12,
    width: 12,
  },
  cardLikeIconImage3: {
    flex: 1,
    marginLeft: '8.33%',
    marginRight: '8.33%',
    width: 10,
  },
  card4: {
    aspectRatio: 0.75,
    height: 224,
    left: 191,
    position: 'absolute',
    top: 256,
    width: 172,
  },
  cardImage4: {
    height: 224,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 168,
  },
  cardUsername4: {
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: 'Space Grotesk',
    fontSize: 12,
    fontWeight: '700',
    height: 12,
    justifyContent: 'center',
    left: 28,
    letterSpacing: 0,
    lineHeight: 12,
    position: 'absolute',
    top: 202,
  },
  cardLikeBadge4: {
    backgroundColor: '#00000099',
    borderRadius: 12,
    height: 20,
    left: 113,
    position: 'absolute',
    top: 8,
    width: 47,
  },
  cardLikeCount4: {
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    fontWeight: '400',
    height: 10,
    justifyContent: 'center',
    left: 135,
    letterSpacing: 0,
    lineHeight: 10,
    position: 'absolute',
    top: 13,
  },
  cardLikeIcon4: {
    aspectRatio: 1,
    height: 12,
    left: 119,
    position: 'absolute',
    top: 12,
    width: 12,
  },
  cardLikeIconImage4: {
    flex: 1,
    marginLeft: '8.33%',
    marginRight: '8.33%',
    width: 10,
  },
  cardAvatar4: {
    aspectRatio: 1,
    height: 16,
    left: 8,
    position: 'absolute',
    top: 200,
    width: 16,
  },
  card5: {
    aspectRatio: 0.75,
    height: 224,
    left: 191,
    position: 'absolute',
    top: 488,
    width: 172,
  },
  cardImage5: {
    height: 224,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 168,
  },
  cardUsername5: {
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: 'Space Grotesk',
    fontSize: 12,
    fontWeight: '700',
    height: 12,
    justifyContent: 'center',
    left: 28,
    letterSpacing: 0,
    lineHeight: 12,
    position: 'absolute',
    top: 202,
  },
  cardLikeBadge5: {
    backgroundColor: '#00000099',
    borderRadius: 12,
    height: 20,
    left: 113,
    position: 'absolute',
    top: 8,
    width: 47,
  },
  cardLikeCount5: {
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    fontWeight: '400',
    height: 10,
    justifyContent: 'center',
    left: 135,
    letterSpacing: 0,
    lineHeight: 10,
    position: 'absolute',
    top: 13,
  },
  cardLikeIcon5: {
    aspectRatio: 1,
    height: 12,
    left: 119,
    position: 'absolute',
    top: 12,
    width: 12,
  },
  cardLikeIconImage5: {
    flex: 1,
    marginLeft: '8.33%',
    marginRight: '8.33%',
    width: 10,
  },
  cardAvatar5: {
    aspectRatio: 1,
    height: 16,
    left: 8,
    position: 'absolute',
    top: 200,
    width: 16,
  },
  card6: {
    aspectRatio: 0.75,
    height: 224,
    left: 191,
    position: 'absolute',
    top: 720,
    width: 172,
  },
  cardImage6: {
    height: 92,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 168,
  },
  cardUsername6: {
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: 'Space Grotesk',
    fontSize: 12,
    fontWeight: '700',
    height: 12,
    justifyContent: 'center',
    left: 28,
    letterSpacing: 0,
    lineHeight: 12,
    position: 'absolute',
    top: 202,
  },
  cardLikeBadge6: {
    backgroundColor: '#00000099',
    borderRadius: 12,
    height: 20,
    left: 113,
    position: 'absolute',
    top: 8,
    width: 47,
  },
  cardLikeCount6: {
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    fontWeight: '400',
    height: 10,
    justifyContent: 'center',
    left: 135,
    letterSpacing: 0,
    lineHeight: 10,
    position: 'absolute',
    top: 13,
  },
  cardLikeIcon6: {
    aspectRatio: 1,
    height: 12,
    left: 119,
    position: 'absolute',
    top: 12,
    width: 12,
  },
  cardLikeIconImage6: {
    flex: 1,
    marginLeft: '8.33%',
    marginRight: '8.33%',
    width: 10,
  },
  cardAvatar6: {
    aspectRatio: 1,
    height: 16,
    left: 8,
    position: 'absolute',
    top: 200,
    width: 16,
  },
  bottomGroup: {
    height: 81,
    left: 0,
    right: 0,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  // Tab 可点击区域与激活态
  tabActiveBackgroundLeft: {
    left: 4,
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
  // 点赞徽章内 icon+数字 横排
  cardLikeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  cardLikeIconSize: {
    width: 12,
    height: 12,
  },
  cardLikeCountInside: {
    fontFamily: 'Space Grotesk',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    minHeight: 960,
    paddingBottom: 100,
  },
  cardsContainer: {
    height: 960,
    position: 'relative',
    width: 375,
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
    fontFamily: 'Space Grotesk',
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
