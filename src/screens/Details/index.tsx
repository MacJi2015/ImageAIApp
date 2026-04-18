import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// LinearGradient moved into DetailVideoPlayer
import { BlurView } from '@react-native-community/blur';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../routes/types';
import generateIcon from '../../assets/details/generate-icon.png';
import resolutionIcon from '../../assets/details/resolution-icon.png';
import seeIcon from '../../assets/details/see-icon.png';
import shareIcon from '../../assets/details/share-icon.png';
import timeIcon from '../../assets/details/time-icon.png';
import LikeBigIcon from '../../assets/details/like-big-icon.svg';
import LikedIcon from '../../assets/details/liked-icon.svg';
import { formatPreviewCount } from '../../utils';
import { dp, hp } from '../../utils/scale';
import headNan from '../../assets/head-nan.png';
import { useAppStore, useUserStore } from '../../store';
import { ChooseVideoModal } from './components/ChooseVideoModal';
import { DetailVideoPlayer } from './components/DetailVideoPlayer';
import {
  getFeedDetail,
  likeFeed,
  unlikeFeed,
  viewFeed,
} from '../../api/services/feed';
import { getTemplateDetail } from '../../api/services/template';
import { DetailNavGlassIconButton } from './components/DetailNavGlassIconButton';
import { DETAIL_NAV_LIQUID_GLASS } from './detailNavChrome';

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

function DetailHeaderShareButton({
  onPress,
  liquidGlass,
}: {
  onPress: () => void;
  liquidGlass: boolean;
}) {
  if (liquidGlass) {
    return (
      <Pressable onPress={onPress} style={detailHeaderShareStyles.liquidGlassHit}>
        <Image source={shareIcon} style={detailHeaderShareStyles.icon} resizeMode="contain" />
      </Pressable>
    );
  }
  return (
    <DetailNavGlassIconButton onPress={onPress}>
      <Image source={shareIcon} style={detailHeaderShareStyles.icon} resizeMode="contain" />
    </DetailNavGlassIconButton>
  );
}

const detailHeaderShareStyles = StyleSheet.create({
  /** 液体玻璃路径：固定点击区域（与常见导航控件约 36pt 一致，随 dp 缩放） */
  liquidGlassHit: {
    width: dp(36),
    height: dp(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { width: 16, height: 16, tintColor: '#fff' },
});

export function DetailsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Detail'>>();
  const route = useRoute<DetailRoute>();
  const insets = useSafeAreaInsets();
  const openShareModal = useAppStore((s) => s.openShareModal);
  const openLoginModal = useAppStore((s) => s.openLoginModal);
  const openPremiumModal = useAppStore((s) => s.openPremiumModal);
  const notifyFeedRefresh = useAppStore((s) => s.notifyFeedRefresh);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const user = useUserStore((s) => s.user);
  const { id, source, initialData } = route.params;
  const isEffect = source === 'effect';

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [chooseVideoVisible, setChooseVideoVisible] = useState(false);

  const [detail, setDetail] = useState<DetailData>(() => ({
    ...emptyDetail(),
    ...(initialData ?? {}),
    likeCount: initialData?.likeCount ?? 0,
    viewCount: initialData?.viewCount ?? 0,
    liked: initialData?.liked ?? false,
  }));

  const displayTitle = (detail.title?.trim() || (isEffect ? 'Effect' : 'Feed')).toUpperCase();
  const remainingQuota = Math.max(0, Number(user?.remainingQuota ?? 0));

  // Feed 增加浏览数
  useEffect(() => {
    if (isEffect || !isLoggedIn) return;
    viewFeed(id).catch(() => {});
  }, [id, isEffect,isLoggedIn]);

  const fetchDetail = useCallback(async () => {
    setLoadingDetail(true);
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
       
        setDetail((prev) => ({
          ...prev,
          title: f.promptText ?? 'Feed',
          videoUrl: f.videoUrl,
          thumbnailUrl: f.thumbnailUrl,
          userName: f.nickname,
          userAvatarUrl: f.userAvatar,
          likeCount: f.likeCount ?? 0,
          viewCount: f.viewCount ?? 0,
          // 若接口未返回 liked 字段，保留当前状态；返回时以接口为准
          liked: typeof (f as { liked?: unknown }).liked === 'boolean' ? Boolean((f as { liked?: unknown }).liked) : prev.liked,
          templateIdForPrompt: f.templateId,
          templateThumbnailUrlForPrompt: f.thumbnailUrl,
        }));
      }
    } catch (e) {
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
  }, [fetchDetail, isLoggedIn]);

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
      notifyFeedRefresh();
    } catch (e) {
      __DEV__ && console.warn('[DetailsScreen] like toggle failed', e);
    }
  }, [detail.liked, fetchDetail, id, isEffect, isLoggedIn, notifyFeedRefresh, openLoginModal]);

  const handleChooseVideo = useCallback(() => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (remainingQuota <= 0) {
      openPremiumModal();
      return;
    }
    setChooseVideoVisible(true);
  }, [isLoggedIn, openLoginModal, openPremiumModal, remainingQuota]);

  const handleShareFromHeader = useCallback(() => {
    openShareModal({
      url: detail.videoUrl ?? '',
      title: detail.title,
      message: detail.title ?? '',
    });
  }, [openShareModal, detail.videoUrl, detail.title]);

  const renderHeaderShare = useCallback(
    () => (
      <DetailHeaderShareButton
        onPress={handleShareFromHeader}
        liquidGlass={DETAIL_NAV_LIQUID_GLASS}
      />
    ),
    [handleShareFromHeader],
  );

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: renderHeaderShare });
  }, [navigation, renderHeaderShare]);

  return (
    <View style={styles.container}>
      <View style={styles.backgroundWrap}>
        <DetailVideoPlayer
          videoUri={detail.videoUrl}
          posterUri={detail.thumbnailUrl}
          bottomGradientHeight={hp(100)}
          style={{...StyleSheet.absoluteFillObject,height:hp(667)}}
        />
        {loadingDetail && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#00ffff" />
          </View>
        )}

        {/* 底部：深色内容区（渐变在 DetailVideoPlayer 内） */}
        <View style={[styles.bottomOverlayWrap, { paddingBottom: insets.bottom }]}>
        
          <View style={styles.bottomOverlay}>
            {isEffect ? (
              <>
                <Text style={styles.effectTitle}>{displayTitle}</Text>
                <View style={[styles.pillsRow, styles.pillsRowCenter]}>
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
                    <Text style={styles.pillText}>{formatPreviewCount(detail.viewCount)}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.tryButton}
                  activeOpacity={0.8}
                  onPress={handleChooseVideo}
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
                        {detail.userName}
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
                    {detail.liked ? (
                      <LikedIcon width={23} height={22} style={styles.likeIconLiked} />
                    ) : (
                      <LikeBigIcon width={23} height={22} style={styles.likeIconUnliked} />
                    )}
                    <Text style={styles.feedLikeCount}>
                      {formatPreviewCount(detail.likeCount)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.tryButton}
                  activeOpacity={0.8}
                  onPress={handleChooseVideo}
                >
                  <Image source={generateIcon} style={styles.tryButtonIcon} resizeMode="contain" />
                  <Text style={styles.tryButtonText}>CREATE NOW</Text>
                </TouchableOpacity>
              </>
            )}
            <View style={styles.footerRow}>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>{remainingQuota} Free Chances Remaining</Text>
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
    marginBottom: hp(8),
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
    opacity: 1,
  },
  feedLikeCount: {
    fontSize: dp(12),
    fontWeight: '700',
    color: '#ffffff',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: dp(12),
    // marginBottom: hp(20),
  },
  pillsRowCenter: {
    justifyContent: 'center',
    marginBottom: hp(16),
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
