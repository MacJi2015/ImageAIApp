import React from 'react';
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../routes/types';
import arrowLeft from '../../assets/details/arrow-left.png';
import generateIcon from '../../assets/details/generate-icon.png';
import resolutionIcon from '../../assets/details/resolution-icon.png';
import seeIcon from '../../assets/details/see-icon.png';
import shareIcon from '../../assets/details/share-icon.png';
import timeIcon from '../../assets/details/time-icon.png';
import yuanBg from '../../assets/details/yuan-bg.png';
import goodsImage from '../../assets/goods.png';
import { ChooseVideoModal } from './components/ChooseVideoModal';

type DetailRoute = RouteProp<RootStackParamList, 'Detail'>;

const COLORS = { bg: '#050a14', accent: '#00ffff' };

export function DetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<DetailRoute>();
  const insets = useSafeAreaInsets();
  const { title } = route.params;
  const displayTitle = (title ?? 'Rock Star').toUpperCase();
  const [chooseVideoVisible, setChooseVideoVisible] = React.useState(false);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={goodsImage}
        style={[styles.backgroundImage, { paddingTop: insets.top }]}
        resizeMode="cover"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Image source={yuanBg} style={styles.headerBtnBg} resizeMode="cover" />
            <Image source={arrowLeft} style={styles.headerBtnIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8}>
            <Image source={yuanBg} style={styles.headerBtnBg} resizeMode="cover" />
            <Image source={shareIcon} style={styles.headerBtnIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* Center play area */}
        <View style={styles.playArea}>
          <TouchableOpacity style={styles.playButton} activeOpacity={0.9}>
            <Image source={yuanBg} style={styles.playButtonBg} resizeMode="cover" />
            <View style={styles.playTriangle} />
          </TouchableOpacity>
        </View>

        {/* 底部：100px 渐变虚化 + 深色内容区；渐变在图片上，下方安全区单独填色 */}
        <View style={[styles.bottomOverlayWrap, { paddingBottom: insets.bottom }]}>
          <LinearGradient
            colors={['rgba(5, 10, 20, 0)', COLORS.bg]}
            style={styles.bottomGradientWrap}
            pointerEvents="none"
          />
          <View style={styles.bottomOverlay}>
            <Text style={styles.effectTitle}>{displayTitle}</Text>
            <View style={styles.pillsRow}>
              <View style={styles.pill}>
                <Image source={timeIcon} style={styles.pillIcon} resizeMode="contain" />
                <Text style={styles.pillText}>5s</Text>
              </View>
              <View style={styles.pill}>
                <Image source={resolutionIcon} style={styles.pillIcon} resizeMode="contain" />
                <Text style={styles.pillText}>720p</Text>
              </View>
              <View style={styles.pill}>
                <Image source={seeIcon} style={styles.pillIcon} resizeMode="contain" />
                <Text style={styles.pillText}>2.4K</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.tryButton}
              activeOpacity={0.8}
              onPress={() => setChooseVideoVisible(true)}
            >
              <Image source={generateIcon} style={styles.tryButtonIcon} resizeMode="contain" />
              <Text style={styles.tryButtonText}>TRY IT</Text>
            </TouchableOpacity>
            <View style={styles.footerRow}>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>3 Free Chances Remaining</Text>
            </View>
          </View>
        </View>
        {/* 仅填充底部安全区深色，不盖住渐变，避免下面多出一块 */}
        <View style={[styles.safeAreaFill, { height: insets.bottom }]} pointerEvents="none" />
      </ImageBackground>
      <ChooseVideoModal
        visible={chooseVideoVisible}
        onClose={() => setChooseVideoVisible(false)}
        onChooseGallery={() => {
          setChooseVideoVisible(false);
          // TODO: 打开相册选择
        }}
        onTakePhoto={() => {
          setChooseVideoVisible(false);
          // TODO: 打开相机
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
  },
  bottomOverlayWrap: {
    width: '100%',
  },
  safeAreaFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.bg,
  },
  bottomGradientWrap: {
    height: 100,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnBg: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  headerBtnIcon: {
    width: 20,
    height: 20,
  },
  playArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -94,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonBg: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 4,
  },
  bottomOverlay: {
    paddingHorizontal: 16,
    paddingTop: 24,
    backgroundColor: COLORS.bg,
  },
  effectTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,255,255,0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(0,255,255,0.4)',
    gap: 6,
  },
  pillIcon: {
    width: 12,
    height: 12,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  tryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    gap: 4,
    marginBottom: 12,
  },
  tryButtonIcon: {
    width: 24,
    height: 24,
  },
  tryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#020410',
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '400',
    color: COLORS.accent,
  },
});
