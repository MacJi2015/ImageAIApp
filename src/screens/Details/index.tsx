import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
import { formatPreviewCount } from '../../utils';
import { dp, hp } from '../../utils/scale';
import headNan from '../../assets/head-nan.png';
import { useAppStore, useUserStore } from '../../store';
import { ChooseVideoModal } from './components/ChooseVideoModal';
import { DetailVideoPlayer } from './components/DetailVideoPlayer';
import {
  getFeedDetail,
  likeFeed,
  parseFeedAttributes,
  unlikeFeed,
  viewFeed,
} from '../../api/services/feed';
import { getTemplateDetail } from '../../api/services/template';

type DetailRoute = RouteProp<RootStackParamList, 'Detail'>;

const COLORS = { bg: '#050a14', accent: '#00ffff' };

type DetailData = {
  title?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  userName?: string;
  userAvatarUrl?: string;
  likeCount: number;
  viewCount: number;
  liked: boolean;
  templateIdForPrompt?: string;
  templateThumbnailUrlForPrompt?: string;
};

const emptyDetail = (): DetailData => ({
  likeCount: 0,
  viewCount: 0,
  liked: false,
});

export function DetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<DetailRoute>();
  const insets = useSafeAreaInsets();
  const openShareModal = useAppStore((s) => s.openShareModal);
  const openLoginModal = useAppStore((s) => s.openLoginModal);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const { id, source, initialData } = route.params;
  const isEffect = source === 'effect';

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chooseVideoVisible, setChooseVideoVisible] = useState(false);

  const [detail, setDetail] = useState<DetailData>(() => ({
    ...emptyDetail(),
    ...(initialData ?? {}),
    likeCount: initialData?.likeCount ?? 0,
    viewCount: initialData?.viewCount ?? 0,
    liked: initialData?.liked ?? false,
  }));

  const displayTitle = (detail.title?.trim() || (isEffect ? 'Effect' : 'Feed')).toUpperCase();
  const canChooseVideo = isEffect || Boolean(detail.templateIdForPrompt);

  // Feed 增加浏览数
  useEffect(() => {
    if (isEffect) return;
    viewFeed(id).catch(() => {});
  }, [id, isEffect]);

  const fetchDetail = useCallback(async () => {
    setLoadingDetail(true);
    setLoadError(null);
    try {
      if (isEffect) {
        const t = await getTemplateDetail(id);
        setDetail({
          title: t.templateName,
          videoUrl: t.previewVideoUrl,
          thumbnailUrl: t.coverImageUrl,
          likeCount: 0,
          viewCount: t.viewCount ?? 0,
          liked: false,
          templateIdForPrompt: t.templateId,
          templateThumbnailUrlForPrompt: t.coverImageUrl,
        });
      } else {
        const f = await getFeedDetail(id);
        const { userAvatar, nickname } = parseFeedAttributes(f.attributes);
        const nick = nickname?.trim();
        const userLabel = nick ? `@${nick.replace(/^@/, '')}` : `@User${f.userId}`;
        setDetail((prev) => ({
          ...prev,
          title: f.promptText ?? 'Feed',
          videoUrl: f.videoUrl,
          thumbnailUrl: f.thumbnailUrl,
          userName: userLabel,
          userAvatarUrl: userAvatar?.trim() || undefined,
          likeCount: f.likeCount ?? 0,
          viewCount: f.viewCount ?? 0,
          // 若接口未返回 liked 字段，保留当前状态；返回时以接口为准
          liked: typeof (f as { liked?: unknown }).liked === 'boolean' ? Boolean((f as { liked?: unknown }).liked) : prev.liked,
          templateIdForPrompt: f.templateId,
          templateThumbnailUrlForPrompt: f.thumbnailUrl,
        }));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载失败';
      setLoadError(msg);
      __DEV__ && console.warn('[DetailsScreen] fetch detail failed', e);
    } finally {
      setLoadingDetail(false);
    }
  }, [id, isEffect]);

  useEffect(() => {
    async function run() {
      await fetchDetail();
    }

    run();
  }, [fetchDetail, initialData]);

  const handleToggleLike = useCallback(async () => {
    if (isEffect) return;
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    try {
      if (detail.liked) {
        await unlikeFeed(id);
      } else {
        await likeFeed(id);
      }
      await fetchDetail();
    } catch (e) {
      __DEV__ && console.warn('[DetailsScreen] like toggle failed', e);
    }
  }, [detail.liked, fetchDetail, id, isEffect, isLoggedIn, openLoginModal]);

  return (
    <View style={styles.container}>
      <View style={[styles.backgroundWrap, { paddingTop: insets.top }]}>
        <DetailVideoPlayer
          videoUri={detail.videoUrl}
          posterUri={detail.thumbnailUrl}
          bottomGradientHeight={hp(100)}
          style={{ ...StyleSheet.absoluteFillObject, height: hp(667) }}
        />
        {loadingDetail && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#00ffff" />
          </View>
        )}
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
                url: detail.videoUrl ?? '',
                title: detail.title,
                message: detail.title ?? '',
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
            {loadError ? (
              <Text style={styles.errorText}>{loadError}</Text>
            ) : null}
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
                    <Text style={styles.pillText}>{formatPreviewCount(detail.viewCount)}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.tryButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (!canChooseVideo) return;
                    setChooseVideoVisible(true);
                  }}
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
                      <Image
                        source={
                          detail.userAvatarUrl
                            ? { uri: detail.userAvatarUrl }
                            : (headNan as ImageSourcePropType)
                        }
                        style={styles.feedAvatar}
                        resizeMode="cover"
                      />
                      <Text style={styles.feedUsername}>
                        {detail.userName ?? '@User'}
                      </Text>
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
                      <Text style={styles.pillText}>
                        {formatPreviewCount(detail.viewCount)}
                      </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.feedLikeBadge}
                    activeOpacity={0.8}
                    onPress={handleToggleLike}
                  >
                    <BlurView
                      style={StyleSheet.absoluteFill}
                      blurType="dark"
                      blurAmount={5}
                    />
                    <View style={styles.feedLikeBadgeOverlay} />
                    <LikeBigIcon
                      width={23}
                      height={22}
                      style={detail.liked ? styles.likeIconLiked : styles.likeIconUnliked}
                    />
                    <Text style={styles.feedLikeCount}>
                      {formatPreviewCount(detail.likeCount)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.tryButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (!canChooseVideo) return;
                    setChooseVideoVisible(true);
                  }}
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
              templateId: detail.templateIdForPrompt,
              templateThumbnailUrl: detail.templateThumbnailUrlForPrompt,
            });
          }
        }}
        onTakePhoto={(asset, uploadedUrl) => {
          setChooseVideoVisible(false);
          if (asset.uri) {
            (navigation as any).navigate('CustomPrompt', {
              imageUri: asset.uri,
              petImageUrl: uploadedUrl,
              templateId: detail.templateIdForPrompt,
              templateThumbnailUrl: detail.templateThumbnailUrlForPrompt,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
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
  errorText: {
    color: '#ff6b6b',
    fontSize: dp(13),
    textAlign: 'center',
    marginBottom: hp(12),
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
  likeIconLiked: {
    opacity: 1,
  },
  likeIconUnliked: {
    opacity: 0.4,
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
