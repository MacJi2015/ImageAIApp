import React, { useCallback, useEffect, useImperativeHandle, useState, forwardRef } from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../routes/types';
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

type Nav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const AVATARS: ImageSourcePropType[] = [headNan, headNv, headNan, headNv, headNan, headNv];

function FeedCard({
  item,
  index,
  isLeft,
  liked,
  onLikePress,
  onPress,
}: {
  item: FeedItem;
  index: number;
  isLeft: boolean;
  liked: boolean;
  onLikePress: (e?: { stopPropagation?: () => void }) => void;
  onPress: () => void;
}) {
  const avatar = AVATARS[index % AVATARS.length];

  return (
    <TouchableOpacity
      style={[styles.cardBase, isLeft ? styles.cardLeft : styles.cardRight, { top: Math.floor(index / 2) * 232 }]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <TouchableOpacity
        style={[styles.cardLikeBadge, isLeft ? {} : styles.cardLikeBadgeRight, styles.cardLikeBadgeRow]}
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
  const navigation = useNavigation<Nav>();
  const openLoginModal = useAppStore((s) => s.openLoginModal);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const [list, setList] = useState<FeedItem[]>([]);
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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
      });
    },
    [navigation]
  );

  const leftItems = list.filter((_, i) => i % 2 === 0);
  const rightItems = list.filter((_, i) => i % 2 === 1);
  const rowCount = Math.ceil(list.length / 2);
  const containerHeight = Math.max(696, rowCount * 232 + 100);

  if (loading && list.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.cardsContainer, { minHeight: containerHeight }]}>
      {leftItems.map((item, i) => (
        <FeedCard
          key={item.feedId}
          item={item}
          index={i * 2}
          isLeft
          liked={likedSet.has(item.feedId)}
          onLikePress={(e) => handleLikePress(item, e)}
          onPress={() => handleCardPress(item)}
        />
      ))}
      {rightItems.map((item, i) => (
        <FeedCard
          key={item.feedId}
          item={item}
          index={i * 2 + 1}
          isLeft={false}
          liked={likedSet.has(item.feedId)}
          onLikePress={(e) => handleLikePress(item, e)}
          onPress={() => handleCardPress(item)}
        />
      ))}
      {loadingMore && (
        <View style={styles.loadMoreWrap}>
          <Text style={styles.loadMoreText}>Loading...</Text>
        </View>
      )}
      {list.length === 0 && !loading && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No feeds yet</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  cardsContainer: {
    position: 'relative',
    minHeight: 696,
    width: '100%',
    paddingBottom: 120,
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
  loadMoreWrap: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#3a4a65',
    fontSize: 12,
  },
});
