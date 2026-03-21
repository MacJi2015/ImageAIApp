import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// LinearGradient moved into DetailVideoPlayer
import { BlurView } from '@react-native-community/blur';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../routes/types';
import arrowLeft from '../../assets/details/arrow-left.png';
import generateIcon from '../../assets/details/generate-icon.png';
import resolutionIcon from '../../assets/details/resolution-icon.png';
import seeIcon from '../../assets/details/see-icon.png';
import shareIcon from '../../assets/details/share-icon.png';
import timeIcon from '../../assets/details/time-icon.png';
import LikeBigIcon from '../../assets/details/like-big-icon.svg';
import { dp, hp } from '../../utils/scale';
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
          bottomGradientHeight={hp(100)}
          style={{ ...StyleSheet.absoluteFillObject, height: hp(667) }}
        />
        {/* Header */}
        <View style={[styles.header]}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
          <BlurView
            style={styles.headerBtnBg}
            blurType="dark"
            blurAmount={5}
          />
          <View style={styles.headerBtnOverlay} />
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
              <BlurView
            style={styles.headerBtnBg}
            blurType="dark"
            blurAmount={5}
          />
          <View style={styles.headerBtnOverlay} />
            <Image source={shareIcon} style={styles.headerBtnIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>
        

        {/* 底部：深色内容区（渐变在 DetailVideoPlayer 内） */}
        <View style={[styles.bottomOverlayWrap, { paddingBottom: insets.bottom }]}>
        
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
                <View style={styles.feedTopRow}>
                  <View style={styles.feedLeftCol}>
                    <View style={styles.feedUserRow}>
                      <Image source={headNan as ImageSourcePropType} style={styles.feedAvatar} resizeMode="cover" />
                      <Text style={styles.feedUsername}>{userName ?? '@User'}</Text>
                    </View>
                    <View style={[styles.pillsRow, styles.pillsRowStart]}>
                      <View style={styles.pill}>
                        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={5} />
                        <View style={styles.pillOverlay} />
                        <Image source={timeIcon} style={styles.pillIcon} resizeMode="contain" />
                        <Text style={styles.pillText}>5s</Text>
                      </View>
                      <View style={styles.pill}>
                        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={5} />
                        <View style={styles.pillOverlay} />
                        <Image source={resolutionIcon} style={styles.pillIcon} resizeMode="contain" />
                        <Text style={styles.pillText}>720p</Text>
                      </View>
                      <View style={styles.pill}>
                        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={5} />
                        <View style={styles.pillOverlay} />
                        <Image source={seeIcon} style={styles.pillIcon} resizeMode="contain" />
                        <Text style={styles.pillText}>{formatCount(likeCount) || '2.4K'}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.feedLikeBadge}>
                    <BlurView
                      style={StyleSheet.absoluteFill}
                      blurType="dark"
                      blurAmount={5}
                    />
                    <View style={styles.feedLikeBadgeOverlay} />
                    <LikeBigIcon width={23} height={22} />
                    <Text style={styles.feedLikeCount}>{formatCount(likeCount) || '2.4K'}</Text>
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // backgroundColor: COLORS.bg,
  },
  safeAreaFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: dp(16),
    paddingTop: hp(8),
    paddingBottom: hp(8),
  },
  headerBtn: {
    width: dp(38),
    height: dp(38),
    borderRadius: dp(19),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: dp(19),
  },
  headerBtnOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: dp(19),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerBtnIcon: {
    width: dp(20),
    height: hp(20),
  },
  bottomOverlay: {
    paddingHorizontal: dp(16),
    paddingTop: hp(24),
    // backgroundColor: COLORS.bg,
  },
  effectTitle: {
    fontSize: dp(24),
    fontWeight: '700',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: hp(16),
    letterSpacing: 1,
  },
  feedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  feedTopRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    marginBottom: hp(16),
    gap: dp(12),
  },
  feedLeftCol: {
    flex: 1,
    minWidth: 0,
  },
  feedAvatar: {
    width: dp(32),
    height: dp(32),
    borderRadius: dp(16),
    marginRight: dp(8),
    borderWidth: dp(1),
    borderColor: 'rgba(255, 255, 255, 0.8)',
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
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: dp(12),
    width: dp(60),
    height: hp(68),
    overflow: 'hidden',
    gap: hp(12),
  },
  feedLikeBadgeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,10,20,0.2)',
  },
  feedLikeCount: {
    fontSize: dp(12),
    fontWeight: '700',
    color: '#ffffff',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: dp(12),
    marginBottom: hp(20),
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
    height: hp(28),
    paddingHorizontal: dp(12),
    borderRadius: dp(9999),
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0,255,255,0.4)',
    gap: dp(4),
  },
  pillOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,255,255,0.05)',
  },
  pillIcon: {
    width: dp(12),
    height: hp(12),
  },
  pillText: {
    fontSize: dp(12),
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  tryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: hp(48),
    borderRadius: dp(12),
    backgroundColor: COLORS.accent,
    // gap: 4,
    marginBottom: hp(12),
  },
  tryButtonIcon: {
    width: dp(24),
    height: hp(24),
  },
  tryButtonText: {
    fontSize: dp(16),
    fontWeight: '700',
    color: '#020410',
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: dp(4),
  },
  footerDot: {
    width: dp(4),
    height: dp(4),
    borderRadius: dp(2),
    backgroundColor: COLORS.accent,
  },
  footerText: {
    fontSize: dp(10),
    fontWeight: '400',
    color: COLORS.accent,
  },
});
