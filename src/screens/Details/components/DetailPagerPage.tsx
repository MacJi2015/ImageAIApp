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
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../../routes/types';
import generateIcon from '../../../assets/details/generate-icon.png';
import resolutionIcon from '../../../assets/details/resolution-icon.png';
import seeIcon from '../../../assets/details/see-icon.png';
import timeIcon from '../../../assets/details/time-icon.png';
import LikeBigIcon from '../../../assets/details/like-big-icon.svg';
import LikedIcon from '../../../assets/details/liked-icon.svg';
import headNan from '../../../assets/head-nan.png';
import { formatPreviewCount } from '../../../utils';
import { dp, hp } from '../../../utils/scale';
import { useAppStore, useUserStore } from '../../../store';
import type { DetailPagerItem } from '../../../store/useDetailPagerStore';
import { useDetailPagerStore } from '../../../store/useDetailPagerStore';
import {
  getFeedDetail,
  likeFeed,
  unlikeFeed,
  viewFeed,
} from '../../../api/services/feed';
import { getTemplateDetail } from '../../../api/services/template';
import { getUgcConsentAccepted } from '../../../services/ugcConsentStorage';
import { ChooseVideoModal } from './ChooseVideoModal';
import { DetailVideoPlayer } from './DetailVideoPlayer';

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

function pagerItemToDetail(item: DetailPagerItem): DetailData {
  return {
    title: item.title,
    videoUrl: item.videoUrl,
    thumbnailUrl: item.thumbnailUrl,
    userName: item.userName,
    userAvatarUrl: item.userAvatarUrl,
    likeCount: item.likeCount ?? 0,
    viewCount: item.viewCount ?? 0,
    liked: item.liked ?? false,
    templateIdForPrompt: item.templateIdForPrompt,
    templateThumbnailUrlForPrompt: item.templateThumbnailUrlForPrompt,
  };
}

export type DetailPagerPageProps = {
  item: DetailPagerItem;
  isActive: boolean;
  isScreenFocused: boolean;
  pageHeight: number;
};

export function DetailPagerPage({
  item,
  isActive,
  isScreenFocused,
  pageHeight,
}: DetailPagerPageProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Detail'>>();
  const insets = useSafeAreaInsets();
  const isEffect = item.source === 'effect';
  const openLoginModal = useAppStore((s) => s.openLoginModal);
  const openPremiumModal = useAppStore((s) => s.openPremiumModal);
  const openUgcConsentModal = useAppStore((s) => s.openUgcConsentModal);
  const notifyFeedRefresh = useAppStore((s) => s.notifyFeedRefresh);
  const patchPagerItem = useDetailPagerStore((s) => s.patchItem);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const user = useUserStore((s) => s.user);
  const remainingQuota = Math.max(0, Number(user?.remainingQuota ?? 0));

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [chooseVideoVisible, setChooseVideoVisible] = useState(false);
  const [detail, setDetail] = useState<DetailData>(() => pagerItemToDetail(item));

  const displayTitle = (detail.title?.trim() || (isEffect ? 'Effect' : 'Feed')).toUpperCase();

  useEffect(() => {
    setDetail(pagerItemToDetail(item));
  }, [item]);

  useEffect(() => {
    if (!isActive || !isScreenFocused) return;
    if (isEffect || !isLoggedIn) return;
    viewFeed(item.id).catch(() => {});
  }, [isActive, isEffect, isLoggedIn, isScreenFocused, item.id]);

  const fetchDetail = useCallback(async () => {
    try {
      if (isEffect) {
        const t = await getTemplateDetail(item.id);
        const next: DetailData = {
          title: t.templateName,
          videoUrl: t.previewVideoUrl,
          thumbnailUrl: t.coverImageUrl,
          likeCount: 0,
          viewCount: t.viewCount ?? 0,
          liked: false,
          templateIdForPrompt: t.templateId,
          templateThumbnailUrlForPrompt: t.coverImageUrl,
        };
        setDetail(next);
        patchPagerItem(item.id, next);
      } else {
        const f = await getFeedDetail(item.id);
        setDetail((prev) => {
          const next: DetailData = {
            ...prev,
            title: f.promptText ?? 'Feed',
            videoUrl: f.videoUrl,
            thumbnailUrl: f.thumbnailUrl,
            userName: f.nickname,
            userAvatarUrl: f.userAvatar,
            likeCount: f.likeCount ?? 0,
            viewCount: f.viewCount ?? 0,
            liked:
              typeof (f as { liked?: unknown }).liked === 'boolean'
                ? Boolean((f as { liked?: unknown }).liked)
                : prev.liked,
            templateIdForPrompt: f.templateId,
            templateThumbnailUrlForPrompt: f.thumbnailUrl,
          };
          patchPagerItem(item.id, next);
          return next;
        });
      }
    } catch (e) {
      __DEV__ && console.warn('[DetailPagerPage] fetch detail failed', e);
    } finally {
      setLoadingDetail(false);
    }
  }, [isEffect, item.id, patchPagerItem]);

  useEffect(() => {
    if (!isActive) return;
    fetchDetail().catch(() => {});
  }, [fetchDetail, isActive, isLoggedIn]);

  const handleToggleLike = useCallback(async () => {
    if (isEffect) return;
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    try {
      if (detail.liked) {
        await unlikeFeed(item.id);
      } else {
        await likeFeed(item.id);
      }
      await fetchDetail();
      notifyFeedRefresh();
    } catch (e) {
      __DEV__ && console.warn('[DetailPagerPage] like toggle failed', e);
    }
  }, [detail.liked, fetchDetail, isEffect, isLoggedIn, item.id, notifyFeedRefresh, openLoginModal]);

  const continueChooseVideo = useCallback(() => {
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

  const handleChooseVideo = useCallback(() => {
    const run = async () => {
      const accepted = await getUgcConsentAccepted();
      if (!accepted) {
        openUgcConsentModal({ onAgreed: continueChooseVideo });
        return;
      }
      continueChooseVideo();
    };
    run().catch((error) => {
      __DEV__ && console.warn('[DetailPagerPage] UGC consent check failed', error);
    });
  }, [continueChooseVideo, openUgcConsentModal]);

  const navigateToCustomPrompt = useCallback(
    (imageUri: string, uploadedUrl?: string) => {
      (navigation as NativeStackNavigationProp<RootStackParamList>).navigate('CustomPrompt', {
        imageUri,
        petImageUrl: uploadedUrl,
        templateId: detail.templateIdForPrompt,
        templateThumbnailUrl: detail.templateThumbnailUrlForPrompt,
      });
    },
    [detail.templateIdForPrompt, detail.templateThumbnailUrlForPrompt, navigation],
  );

  return (
    <View style={[styles.page, { height: pageHeight }]}>
      <View style={styles.backgroundWrap}>
        <DetailVideoPlayer
          videoUri={detail.videoUrl}
          posterUri={detail.thumbnailUrl}
          isActive={isActive && isScreenFocused}
          bottomGradientHeight={hp(100)}
          style={{ ...StyleSheet.absoluteFillObject, height: hp(667) }}
        />
        {loadingDetail && isActive ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#00ffff" />
          </View>
        ) : null}

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
                      <Text style={styles.feedUsername}>{detail.userName}</Text>
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
                    <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={5} />
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
          if (asset.uri) navigateToCustomPrompt(asset.uri, uploadedUrl);
        }}
        onTakePhoto={(asset, uploadedUrl) => {
          setChooseVideoVisible(false);
          if (asset.uri) navigateToCustomPrompt(asset.uri, uploadedUrl);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
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
  },
  safeAreaFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomOverlay: {
    paddingHorizontal: dp(16),
    paddingTop: hp(24),
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
  likeIconLiked: { opacity: 1 },
  likeIconUnliked: { opacity: 1 },
  feedLikeCount: {
    fontSize: dp(12),
    fontWeight: '700',
    color: '#ffffff',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: dp(12),
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
    height: hp(44),
    borderRadius: dp(12),
    backgroundColor: COLORS.accent,
    marginBottom: hp(12),
  },
  tryButtonIcon: {
    width: dp(24),
    height: hp(24),
  },
  tryButtonText: {
    fontSize: dp(16),
    fontWeight: 700,
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
