import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  type ViewToken,
} from 'react-native';
import { useIsFocused, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../routes/types';
import shareIcon from '../../assets/details/share-icon.png';
import { dp } from '../../utils/scale';
import { useAppStore, useDetailPagerStore } from '../../store';
import type { DetailPagerItem } from '../../store/useDetailPagerStore';
import { getFeedList } from '../../api/services/feed';
import { feedItemsToPagerItems, initialDataToPagerItem } from './utils/detailPagerMappers';
import { DetailPagerPage } from './components/DetailPagerPage';
import { DetailNavGlassIconButton } from './components/DetailNavGlassIconButton';
import { DETAIL_NAV_LIQUID_GLASS } from './detailNavChrome';
import { getUgcConsentAccepted } from '../../services/ugcConsentStorage';

type DetailRoute = RouteProp<RootStackParamList, 'Detail'>;

const PAGE_HEIGHT = Dimensions.get('window').height;

function buildLoopDisplayItems(items: DetailPagerItem[]): DetailPagerItem[] {
  if (items.length <= 1) return items;
  return [items[items.length - 1], ...items, items[0]];
}

function displayIndexToRealIndex(displayIndex: number, itemCount: number): number {
  if (itemCount <= 1) return 0;
  if (displayIndex <= 0) return itemCount - 1;
  if (displayIndex >= itemCount + 1) return 0;
  return displayIndex - 1;
}

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
  const isFocused = useIsFocused();
  const route = useRoute<DetailRoute>();
  const pageHeight = PAGE_HEIGHT;

  const openShareModal = useAppStore((s) => s.openShareModal);
  const openUgcConsentModal = useAppStore((s) => s.openUgcConsentModal);
  const notifyFeedRefresh = useAppStore((s) => s.notifyFeedRefresh);
  const hideModeratedFeedId = useAppStore((s) => s.hideModeratedFeedId);
  const hiddenModeratedFeedIds = useAppStore((s) => s.hiddenModeratedFeedIds);

  const session = useDetailPagerStore((s) => s.session);
  const appendItems = useDetailPagerStore((s) => s.appendItems);
  const removePagerItem = useDetailPagerStore((s) => s.removeItem);
  const setHasMore = useDetailPagerStore((s) => s.setHasMore);
  const setPageNum = useDetailPagerStore((s) => s.setPageNum);
  const clearSession = useDetailPagerStore((s) => s.clearSession);

  const { id, source, initialData } = route.params;
  const isEffect = source === 'effect';

  const fallbackItems = useMemo(
    () => [initialDataToPagerItem(id, source, initialData)],
    [id, initialData, source],
  );

  const baseItems = session?.items?.length ? session.items : fallbackItems;
  const loop = session?.loop ?? false;
  const displayItems = useMemo(
    () => (loop ? buildLoopDisplayItems(baseItems) : baseItems),
    [baseItems, loop],
  );

  const initialDisplayIndex = useMemo(() => {
    if (!session) return 0;
    if (loop && baseItems.length > 1) return session.initialIndex + 1;
    const idx = baseItems.findIndex((i) => i.id === id);
    return idx >= 0 ? idx : session.initialIndex;
  }, [baseItems, id, loop, session]);

  const listRef = useRef<FlatList<DetailPagerItem>>(null);
  const [activeRealIndex, setActiveRealIndex] = useState(() => {
    if (session) {
      const idx = session.items.findIndex((i) => i.id === id);
      return idx >= 0 ? idx : session.initialIndex;
    }
    return 0;
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const activeRealIndexRef = useRef(activeRealIndex);
  activeRealIndexRef.current = activeRealIndex;

  const activeItem = baseItems[activeRealIndex] ?? baseItems[0];

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      clearSession();
    });
    return unsubscribe;
  }, [clearSession, navigation]);

  useEffect(() => {
    if (isEffect) return;
    let mounted = true;
    getUgcConsentAccepted().then((accepted) => {
      if (!mounted || accepted) return;
      openUgcConsentModal({
        onDisagreed: () => navigation.goBack(),
      });
    });
    return () => {
      mounted = false;
    };
  }, [isEffect, navigation, openUgcConsentModal]);

  const loadNextFeedPage = useCallback(async () => {
    const currentSession = useDetailPagerStore.getState().session;
    if (
      !currentSession ||
      currentSession.source !== 'feed' ||
      !currentSession.hasMore ||
      loadingMoreRef.current
    ) {
      return;
    }
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = currentSession.pageNum + 1;
      const { list: data, total } = await getFeedList({
        pageNum: nextPage,
        pageSize: currentSession.pageSize,
      });
      const hidden = new Set(hiddenModeratedFeedIds);
      const filtered = data.filter((item) => !hidden.has(String(item.feedId)));
      appendItems(feedItemsToPagerItems(filtered));
      setPageNum(nextPage);
      const hasMore =
        data.length >= currentSession.pageSize &&
        (total == null || nextPage * currentSession.pageSize < total);
      setHasMore(hasMore);
    } catch {
      setHasMore(false);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [appendItems, hiddenModeratedFeedIds, setHasMore, setPageNum]);

  useEffect(() => {
    const currentSession = useDetailPagerStore.getState().session;
    if (!currentSession || currentSession.source !== 'feed' || !currentSession.hasMore) return;
    if (activeRealIndex >= baseItems.length - 3) {
      loadNextFeedPage().catch(() => {});
    }
  }, [activeRealIndex, baseItems.length, loadNextFeedPage]);

  const handleLoopJump = useCallback(
    (displayIndex: number) => {
      if (!loop || baseItems.length <= 1) return;
      if (displayIndex <= 0) {
        listRef.current?.scrollToOffset({
          offset: pageHeight * baseItems.length,
          animated: false,
        });
        setActiveRealIndex(baseItems.length - 1);
        return;
      }
      if (displayIndex >= baseItems.length + 1) {
        listRef.current?.scrollToOffset({
          offset: pageHeight,
          animated: false,
        });
        setActiveRealIndex(0);
      }
    },
    [baseItems.length, loop, pageHeight],
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const primary = viewableItems.find((v) => v.isViewable) ?? viewableItems[0];
      if (primary?.index == null) return;
      const displayIndex = primary.index;
      const itemCount = useDetailPagerStore.getState().session?.items.length ?? baseItems.length;
      if (loop && itemCount > 1) {
        if (displayIndex <= 0 || displayIndex >= itemCount + 1) {
          handleLoopJump(displayIndex);
          return;
        }
        setActiveRealIndex(displayIndex - 1);
        return;
      }
      setActiveRealIndex(displayIndex);
    },
    [baseItems.length, handleLoopJump, loop],
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const handleShareFromHeader = useCallback(() => {
    if (!activeItem) return;
    const reportTargetType: 'feed' | 'template' = activeItem.source === 'effect' ? 'template' : 'feed';
    openShareModal({
      url: activeItem.videoUrl ?? '',
      title: activeItem.title,
      message: activeItem.title ?? '',
      feedbackTargetId: activeItem.id,
      reportTargetType,
      onModerationDone: () => {
        if (reportTargetType !== 'feed') return;
        hideModeratedFeedId(String(activeItem.id));
        removePagerItem(activeItem.id);
        notifyFeedRefresh();
        const remaining = useDetailPagerStore.getState().session?.items ?? [];
        if (remaining.length <= 0) {
          if (navigation.canGoBack()) navigation.goBack();
          return;
        }
        const removedIndex = activeRealIndexRef.current;
        const nextIndex = Math.min(removedIndex, remaining.length - 1);
        setActiveRealIndex(nextIndex);
        const scrollIndex =
          loop && remaining.length > 1 ? nextIndex + 1 : nextIndex;
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({ index: scrollIndex, animated: false });
        });
      },
    });
  }, [
    activeItem,
    baseItems.length,
    hideModeratedFeedId,
    loop,
    navigation,
    notifyFeedRefresh,
    openShareModal,
    removePagerItem,
  ]);

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

  const getItemLayout = useCallback(
    (_: ArrayLike<DetailPagerItem> | null | undefined, index: number) => ({
      length: pageHeight,
      offset: pageHeight * index,
      index,
    }),
    [pageHeight],
  );

  const keyExtractor = useCallback(
    (item: DetailPagerItem, index: number) => `${item.source}-${item.id}-${index}`,
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: DetailPagerItem; index: number }) => {
      const realIndex = loop
        ? displayIndexToRealIndex(index, baseItems.length)
        : index;
      const isActive = realIndex === activeRealIndex;
      return (
        <DetailPagerPage
          item={item}
          isActive={isActive}
          isScreenFocused={isFocused}
          pageHeight={pageHeight}
        />
      );
    },
    [activeRealIndex, baseItems.length, isFocused, loop, pageHeight],
  );

  const initialScrollIndex =
    displayItems.length > 0
      ? Math.min(initialDisplayIndex, displayItems.length - 1)
      : 0;

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={displayItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        initialScrollIndex={displayItems.length > 1 ? initialScrollIndex : undefined}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        windowSize={3}
        maxToRenderPerBatch={2}
        removeClippedSubviews
        extraData={activeRealIndex}
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({
            offset: pageHeight * info.index,
            animated: false,
          });
        }}
        ListFooterComponent={
          loadingMore ? (
            <View style={[styles.footerLoading, { height: pageHeight * 0.08 }]}>
              <ActivityIndicator size="small" color="#00ffff" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050a14',
  },
  footerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
