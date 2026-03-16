import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import BackBg from '../../assets/details/back-bg.svg';
import LikeBigIcon from '../../assets/details/like-big-icon.svg';
import yuanBg from '../../assets/details/yuan-bg.png';
import headNan from '../../assets/head-nan.png';
import { useAppStore } from '../../store';
import { ChooseVideoModal } from './components/ChooseVideoModal';
import { DetailVideoPlayer } from './components/DetailVideoPlayer';

type DetailRoute = RouteProp<RootStackParamList, 'Detail'>;

const COLORS = { bg: '#050a14', accent: '#00ffff' };

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function DetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<DetailRoute>();
  const insets = useSafeAreaInsets();
  const openShareModal = useAppStore(s => s.openShareModal);
  const {
    title,
    source = 'effect',
    videoUrl,
    thumbnailUrl,
    userName,
    likeCount = 0,
  } = route.params;
  const displayTitle = (title ?? 'Rock Star').toUpperCase();
  const [chooseVideoVisible, setChooseVideoVisible] = React.useState(false);
  const isEffect = source === 'effect';

  return (
    <View style={styles.container}>
      <View style={[styles.backgroundWrap, { paddingTop: insets.top }]}>
        <DetailVideoPlayer
          videoUri={videoUrl}
          posterUri={thumbnailUrl}
          autoPlay={!isEffect}
          showPlayOverlay={isEffect}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <BackBg width={38} height={38} style={styles.headerBtnBg} />
            <Image source={arrowLeft} style={styles.headerBtnIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            activeOpacity={0.8}
            onPress={() =>
              openShareModal({
                url: videoUrl,
                title,
                message: title,
              })
            }
          >
            <Image source={yuanBg} style={styles.headerBtnBg} resizeMode="cover" />
            <Image source={shareIcon} style={styles.headerBtnIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* 底部：100px 渐变 + 深色内容区 */}
        <View style={[styles.bottomOverlayWrap, { paddingBottom: insets.bottom }]}>
          <LinearGradient
            colors={['rgba(5, 10, 20, 0)', COLORS.bg]}
            style={styles.bottomGradientWrap}
            pointerEvents="none"
          />
          <View style={styles.bottomOverlay}>
            {isEffect ? (
              <>
                <Text style={styles.effectTitle}>{displayTitle}</Text>
                <View style={[styles.pillsRow, styles.pillsRowCenter]}>
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
                    <Text style={styles.pillText}>{formatCount(likeCount) || '2.4K'}</Text>
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
              </>
            ) : (
              <>
                <View style={styles.feedUserRow}>
                  <Image source={headNan as ImageSourcePropType} style={styles.feedAvatar} resizeMode="cover" />
                  <Text style={styles.feedUsername}>{userName ?? '@User'}</Text>
                  <View style={styles.feedLikeBadge}>
                    <LikeBigIcon width={23} height={22} />
                    <Text style={styles.feedLikeCount}>{formatCount(likeCount) || '2.4K'}</Text>
                  </View>
                </View>
                <View style={[styles.pillsRow, styles.pillsRowStart]}>
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
                    <Text style={styles.pillText}>{formatCount(likeCount) || '2.4K'}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.tryButton}
                  activeOpacity={0.8}
                  onPress={() => setChooseVideoVisible(true)}
                >
                  <Image source={generateIcon} style={styles.tryButtonIcon} resizeMode="contain" />
                  <Text style={styles.tryButtonText}>CREATE NOW</Text>
                </TouchableOpacity>
              </>
            )}
            <View style={styles.footerRow}>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>3 Free Chances Remaining</Text>
            </View>
          </View>
        </View>
        <View style={[styles.safeAreaFill, { height: insets.bottom }]} pointerEvents="none" />
      </View>
      <ChooseVideoModal
        visible={chooseVideoVisible}
        onClose={() => setChooseVideoVisible(false)}
        onChooseGallery={(asset, uploadedUrl) => {
          setChooseVideoVisible(false);
          if (asset.uri) {
            (navigation as any).navigate('CustomPrompt', {
              imageUri: asset.uri,
              petImageUrl: uploadedUrl,
              templateId: route.params.id,
              templateThumbnailUrl: route.params.thumbnailUrl,
            });
          }
        }}
        onTakePhoto={(asset, uploadedUrl) => {
          setChooseVideoVisible(false);
          if (asset.uri) {
            (navigation as any).navigate('CustomPrompt', {
              imageUri: asset.uri,
              petImageUrl: uploadedUrl,
              templateId: route.params.id,
              templateThumbnailUrl: route.params.thumbnailUrl,
            });
          }
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
  backgroundWrap: {
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
  feedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  feedUsername: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  feedLikeBadge: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,10,20,0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    width: 60,
    height: 68,
    gap: 4,
  },
  feedLikeCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pillsRowCenter: {
    justifyContent: 'center',
  },
  pillsRowStart: {
    justifyContent: 'flex-start',
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
