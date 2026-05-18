import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../routes/types';
import LinearGradient from 'react-native-linear-gradient';
import {
  getFeedList,
  likeFeed,
  unlikeFeed,
  type FeedItem,
} from '../../../api/services/feed';
import { useAppStore, useDetailPagerStore, useUserStore } from '../../../store';
import { feedItemsToPagerItems } from '../../Details/utils/detailPagerMappers';
import likeDefaultIcon from '../../../assets/like-default-icon.png';
import likeSelectedIcon from '../../../assets/like-selected-icon.png';
import headNan from '../../../assets/head-nan.png';
import preGoodsImg from '../../../assets/details/pre-goods-img.png';
import emptyImg from '../../../assets/details/empty.png';
import { dp, hp } from '../../../utils/scale';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

function FeedCard({
  item,
  onLikePress,
  onPress,
}: {
  item: FeedItem;
  onLikePress: (e?: { stopPropagation?: () => void }) => void;
  onPress: () => void;
}) {
  const { liked } = item;
  const nickname = item.nickname ?? '';
  const userAvatar = item.userAvatar;
  const [imageLoaded, setImageLoaded] = useState(false);
 
  const displayName = nickname;
  const avatarUri = userAvatar?.trim();
  const avatarSource = avatarUri ? { uri: avatarUri } : headNan;

  return (
    <TouchableOpacity
      style={[styles.cardBase]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.cardImageWrap}>
        <Image source={preGoodsImg} style={styles.cardImagePreloadPlaceholder} resizeMode="contain" />
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={[styles.cardImage, imageLoaded ? styles.cardImageLoaded : styles.cardImagePreload]}
          resizeMode="cover"
          onLoadEnd={() => setImageLoaded(true)}
        />
      </View>
      <TouchableOpacity
        style={[styles.cardLikeBadge, styles.cardLikeBadgeRow]}
        onPress={onLikePress}
        activeOpacity={0.8}
      >
        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={5} />
        <View style={styles.cardLikeBadgeOverlay} />
        <Image
          source={liked ? likeSelectedIcon : likeDefaultIcon}
          style={styles.cardLikeIconSize}
          resizeMode="contain"
        />
        <Text style={styles.cardLikeCountInside}>
          {item.likeCount}
        </Text>
      </TouchableOpacity>
      <LinearGradient
        colors={['rgba(5, 10, 20, 0)', 'rgba(5, 10, 20, 0.80)']}
        style={styles.cardGradient}
        pointerEvents="none"
      />
      <View style={styles.cardAvatar}>
        <Image source={avatarSource} style={styles.cardAvatarImage} resizeMode="contain" />
      </View>
      <Text style={styles.cardUsername} numberOfLines={1}>
        {displayName}
      </Text>
    </TouchableOpacity>
  );
}

const PAGE_SIZE = 10;

export interface FeedTabRef {
  loadMore: () => void;
}

interface FeedTabProps {
  refreshKey?: number;
  /** 登录成功等导致会话变化时递增，用于在未下拉刷新时重新拉取 Feed */
  authSessionEpoch?: number;
  /** 详情点赞等导致 Feed 变更时递增 */
  feedRefreshEpoch?: number;
  /** App 启动鉴权恢复完成后再触发首轮请求 */
  authHydrated?: boolean;
}

export const FeedTab = forwardRef<FeedTabRef, FeedTabProps>(function FeedTab(
  { refreshKey, authSessionEpoch = 0, feedRefreshEpoch = 0, authHydrated = false },
  ref,
) {
  const navigation = useNavigation<Nav>();
  const openLoginModal = useAppStore((s) => s.openLoginModal);
  const initDetailSession = useDetailPagerStore((s) => s.initSession);
  const hiddenModeratedFeedIds = useAppStore((s) => s.hiddenModeratedFeedIds);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const [list, setList] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef<FeedItem[]>([]);
  listRef.current = list;

  const loadPage = useCallback(
    async (page: number, append: boolean) => {
      const silentRefresh = page === 1 && !append && listRef.current.length > 0;
      if (page === 1 && !append && !silentRefresh) {
        setLoading(true);
      } else if (append) {
        setLoadingMore(true);
      }
      try {
        const { list: data, total } = await getFeedList({ pageNum: page, pageSize: PAGE_SIZE });
        if (append) {
          setList((prev) => [...prev, ...data]);
        } else {
          setList(data);
        }
        setHasMore(data.length >= PAGE_SIZE && (total == null || page * PAGE_SIZE < total));
        setPageNum(page);
      } catch {
        if (append) {
          setHasMore(false);
        } else if (!silentRefresh) {
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const refresh = useCallback(() => {
    loadPage(1, false);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    loadPage(pageNum + 1, true);
  }, [loadPage, loadingMore, hasMore, pageNum]);

  useImperativeHandle(ref, () => ({ loadMore }), [loadMore]);

  useEffect(() => {
    if (!authHydrated) return;
    refresh();
  }, [authHydrated, refresh, refreshKey, authSessionEpoch, feedRefreshEpoch]);

  const handleLikePress = useCallback(
    async (item: FeedItem, e?: { stopPropagation?: () => void }) => {
      e?.stopPropagation?.();
      if (!isLoggedIn) {
        openLoginModal();
        return;
      }
      const fid = item.feedId;
      const nextLiked = !item.liked;
      try {
        if (nextLiked) await likeFeed(fid);
        else await unlikeFeed(fid);
        refresh();
      } catch {}
    },
    [isLoggedIn, openLoginModal, refresh]
  );

  const hiddenIdSet = useMemo(() => new Set(hiddenModeratedFeedIds), [hiddenModeratedFeedIds]);
  const visibleList = useMemo(
    () => list.filter(item => !hiddenIdSet.has(String(item.feedId))),
    [hiddenIdSet, list]
  );

  const handleCardPress = useCallback(
    (item: FeedItem) => {
      const initialIndex = visibleList.findIndex((v) => v.feedId === item.feedId);
      initDetailSession({
        source: 'feed',
        items: feedItemsToPagerItems(visibleList),
        initialIndex: initialIndex >= 0 ? initialIndex : 0,
        pageNum,
        pageSize: PAGE_SIZE,
        hasMore,
        loop: false,
      });
      navigation.navigate('Detail', {
        id: item.feedId,
        source: 'feed',
        initialData: {
          title: item.promptText ?? 'Feed',
          videoUrl: item.videoUrl,
          thumbnailUrl: item.thumbnailUrl,
          userName: item.nickname,
          userAvatarUrl: item.userAvatar,
          likeCount: item.likeCount ?? 0,
          viewCount: item.viewCount ?? 0,
          liked: Boolean(item.liked),
          templateIdForPrompt: item.templateId,
          templateThumbnailUrlForPrompt: item.thumbnailUrl,
        },
      });
    },
    [hasMore, initDetailSession, navigation, pageNum, visibleList]
  );

  if ((!authHydrated || loading) && visibleList.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.cardsContainer}>
      <View style={styles.cardsGrid}>
        {visibleList.map((item) => (
          <FeedCard
            key={item.feedId}
            item={item}
            onLikePress={(e) => handleLikePress(item, e)}
            onPress={() => handleCardPress(item)}
          />
        ))}
      </View>
      {loadingMore && (
        <View style={styles.loadMoreWrap}>
          <Text style={styles.loadMoreText}>Loading...</Text>
        </View>
      )}
      {visibleList.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Image source={emptyImg} style={styles.emptyStateIcon} resizeMode="contain" />
          <Text style={styles.emptyStateText}>Hmm, something's off.</Text>
          <TouchableOpacity style={styles.emptyStateRefreshBtn} activeOpacity={0.8} onPress={refresh}>
            <Text style={styles.emptyStateRefreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  cardsContainer: {
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: dp(16),
    paddingBottom: hp(120),
    paddingTop: hp(7),
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    columnGap: dp(7),
    rowGap: hp(7),
  },
  cardBase: {
    height: hp(226),
    borderRadius: dp(12),
    width: dp(168),
    overflow: 'hidden',
    backgroundColor:'#1A2432'
  },
  cardImageWrap: {
    ...StyleSheet.absoluteFillObject,
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  cardImagePreloadPlaceholder: {
    width: dp(39),
    height: hp(17),
  },
  cardImagePreload: {
    opacity: 0,
  },
  cardImageLoaded: {
    opacity: 1,
  },
  cardGradient:{
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: hp(40),
  },
  cardLikeBadge: {
    position: 'absolute',
    right: dp(8),
    top: hp(8),
    borderRadius: dp(12),
    height: hp(20),
    minWidth: dp(42),
    paddingHorizontal: dp(6),
    overflow: 'hidden',
  },
  cardLikeBadgeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  cardLikeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cardLikeIconSize: {
    width: dp(14),
    height: dp(14),
  },
  cardLikeCountInside: {
    fontFamily: 'Space Grotesk',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '400',
  },
  cardAvatar: {
    position: 'absolute',
    left: dp(8),
    bottom: hp(12),
    width: dp(20),
    height: dp(20),
    borderRadius: dp(10),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarImage: {
    width: '100%',
    height: '100%',
  },
  cardUsername: {
    position: 'absolute',
    left: dp(32),
    bottom: hp(14),
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  placeholder: {
    paddingVertical: hp(60),
    alignItems: 'center',
  },
  placeholderText: {
    color: '#3a4a65',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(80),
  },
  emptyStateIcon: {
    width: dp(85),
    height: hp(85),
    marginBottom: hp(8),
  },
  emptyStateText: {
    color: '#3a4a65',
    fontSize: 14,
    marginBottom: hp(16),
  },
  emptyStateRefreshBtn: {
    backgroundColor: '#09111f',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 255, 255, 0.2)',
    paddingVertical: hp(10),
    paddingHorizontal: dp(28),
    borderRadius: dp(12),
    minHeight: hp(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateRefreshText: {
    color: '#ffffff',
    fontSize: 12,
  },
  loadMoreWrap: {
    paddingVertical: hp(16),
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#3a4a65',
    fontSize: 12,
  },
});
