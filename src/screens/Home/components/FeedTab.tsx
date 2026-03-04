import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState, forwardRef } from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../routes/types';
import LinearGradient from 'react-native-linear-gradient';
import {
  getFeedList,
  likeFeed,
  unlikeFeed,
  viewFeed,
  type FeedItem,
} from '../../../api/services/feed';
import { useAppStore, useUserStore } from '../../../store';
import likeDefaultIcon from '../../../assets/like-default-icon.png';
import likeSelectedIcon from '../../../assets/like-selected-icon.png';
import headNan from '../../../assets/head-nan.png';
import headNv from '../../../assets/head-nv.png';
import preGoodsImg from '../../../assets/details/pre-goods-img.png';
import emptyImg from '../../../assets/details/empty.png';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const AVATARS: ImageSourcePropType[] = [headNan, headNv, headNan, headNv, headNan, headNv];
const CONTAINER_PADDING_H = 16;
const CARD_GAP = 7;

function FeedCard({
  item,
  index,
  cardWidth,
  liked,
  onLikePress,
  onPress,
}: {
  item: FeedItem;
  index: number;
  cardWidth: number;
  liked: boolean;
  onLikePress: (e?: { stopPropagation?: () => void }) => void;
  onPress: () => void;
}) {
  const avatar = AVATARS[index % AVATARS.length];
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.cardBase, { width: cardWidth }]}
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
        <Image
          source={liked ? likeSelectedIcon : likeDefaultIcon}
          style={styles.cardLikeIconSize}
          resizeMode="contain"
        />
        <Text style={styles.cardLikeCountInside}>
          {item.likeCount + (liked ? 1 : 0)}
        </Text>
      </TouchableOpacity>
      <LinearGradient
        colors={['rgba(5, 10, 20, 0)', 'rgba(5, 10, 20, 0.80)']}
        style={styles.cardGradient}
        pointerEvents="none"
      />
      <View style={styles.cardAvatar}>
        <Image source={avatar} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
      <Text style={styles.cardUsername}>@User{item.userId}</Text>
    </TouchableOpacity>
  );
}

const PAGE_SIZE = 10;

export interface FeedTabRef {
  loadMore: () => void;
}

interface FeedTabProps {
  refreshKey?: number;
}

export const FeedTab = forwardRef<FeedTabRef, FeedTabProps>(function FeedTab({ refreshKey }, ref) {
  const { width: screenWidth } = useWindowDimensions();
  const navigation = useNavigation<Nav>();
  const openLoginModal = useAppStore((s) => s.openLoginModal);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const [list, setList] = useState<FeedItem[]>([]);
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const cardWidth = useMemo(() => {
    const contentWidth = screenWidth - CONTAINER_PADDING_H * 2;
    return Math.floor((contentWidth - CARD_GAP) / 2);
  }, [screenWidth]);

  const loadPage = useCallback(
    async (page: number, append: boolean) => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
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
        setHasMore(false);
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
    refresh();
  }, [refresh, refreshKey]);

  const handleLikePress = useCallback(
    (item: FeedItem, e?: { stopPropagation?: () => void }) => {
      e?.stopPropagation?.();
      if (!isLoggedIn) {
        openLoginModal();
        return;
      }
      const fid = item.feedId;
      const nextLiked = !likedSet.has(fid);
      setLikedSet((prev) => {
        const next = new Set(prev);
        if (nextLiked) next.add(fid);
        else next.delete(fid);
        return next;
      });
      if (nextLiked) likeFeed(fid).catch(() => setLikedSet((p) => new Set(p)));
      else unlikeFeed(fid).catch(() => setLikedSet((p) => new Set(p)));
    },
    [isLoggedIn, likedSet, openLoginModal]
  );

  const handleCardPress = useCallback(
    (item: FeedItem) => {
      viewFeed(item.feedId).catch(() => {});
      navigation.navigate('Detail', {
        id: item.feedId,
        title: item.promptText ?? 'Feed',
        source: 'feed',
        videoUrl: item.videoUrl,
        thumbnailUrl: item.thumbnailUrl,
        userName: `@User${item.userId}`,
        likeCount: item.likeCount,
      });
    },
    [navigation]
  );

  if (loading && list.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.cardsContainer}>
      <View style={styles.cardsGrid}>
        {list.map((item, i) => (
          <FeedCard
            key={item.feedId}
            item={item}
            index={i}
            cardWidth={cardWidth}
            liked={likedSet.has(item.feedId)}
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
      {list.length === 0 && !loading && (
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
    width: '100%',
    paddingHorizontal: CONTAINER_PADDING_H,
    paddingBottom: 120,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: CARD_GAP,
    rowGap: CARD_GAP,
  },
  cardBase: {
    height: 226,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  cardImagePreloadPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
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
    height: 40,
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
    fontFamily: 'Space Grotesk',
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
  placeholder: {
    paddingVertical: 60,
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
    paddingVertical: 80,
  },
  emptyStateIcon: {
    width: 85,
    height: 85,
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#3a4a65',
    fontSize: 14,
    marginBottom: 16,
  },
  emptyStateRefreshBtn: {
    backgroundColor: '#09111f',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 12,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateRefreshText: {
    color: '#ffffff',
    fontSize: 12,
  },
  loadMoreWrap: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#3a4a65',
    fontSize: 12,
  },
});
