import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore, useAppStore } from '../store';
import { getMyVideos, type AppVideoTask } from '../api/services/video';
import { getProfile, profileToUserInfo } from '../api/services/user';

const settingsIcon = require('../assets/my/settings.png');
const editIcon = require('../assets/my/edit.png');
const defaultAvatar = require('../assets/my/topimage.png');
const vipIcon = require('../assets/my/vip.png');

const HEADER_BG = '#0f1419';
const CARD_BG = '#1a2332';
const TEXT_MAIN = '#ffffff';
const TEXT_MUTED = '#8b949e';
const ACCENT = '#58a6ff';
const PREMIUM_BG = '#e6d5b8';
const PREMIUM_TEXT = '#2d2318';

const STATS_LIKES = { value: '23', label: 'LIKES' };

export function MyScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const user = useUserStore(state => state.user);
  const setUser = useUserStore(state => state.setUser);
  const isLoggedIn = useUserStore(state => state.isLoggedIn);
  const openLoginModal = useAppStore(state => state.openLoginModal);
  const openShareModal = useAppStore(state => state.openShareModal);
  const openPremiumModal = useAppStore(state => state.openPremiumModal);
  const gap = 8;
  const colCount = 3;
  const cellSize = (width - 24 - gap * (colCount - 1)) / colCount;

  const displayName = user?.name ?? 'SpacePup';
  const displayEmail = user?.email ?? 'sparky@petsgo.ai';
  const avatarUri = user?.avatar;
  const isPremium = user?.isPremium ?? false;
  const premiumExpireAt = user?.premiumExpireAt;
  const daysRemaining =
    isPremium && premiumExpireAt
      ? Math.max(
          0,
          Math.ceil((new Date(premiumExpireAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        )
      : 0;

  const [videoList, setVideoList] = useState<AppVideoTask[]>([]);
  const [videoTotal, setVideoTotal] = useState(0);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPage, setTotalPage] = useState(0);
  const PAGE_SIZE = 20;

  const loadMyVideos = useCallback(async (page: number = 1, append = false) => {
    if (!isLoggedIn) return;
    setVideoLoading(true);
    setVideoError(null);
    try {
      const res = await getMyVideos({ pageNum: page, pageSize: PAGE_SIZE });
      setTotalPage(res.totalPage);
      setVideoTotal(res.totalRecord);
      setPageNum(page);
      setVideoList(prev => (append ? [...prev, ...(res.list ?? [])] : res.list ?? []));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '加载失败，请重试';
      setVideoError(msg);
      if (!append) setVideoList([]);
    } finally {
      setVideoLoading(false);
    }
  }, [isLoggedIn]);

  /** 进入页面时：已登录则拉取用户基本信息并同步到 store，同时拉取视频列表 */
  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) return;
      (async () => {
        try {
          const profile = await getProfile();
          const base = profileToUserInfo(profile);
          const current = useUserStore.getState().user;
          setUser({
            ...base,
            isPremium: current?.isPremium,
            premiumExpireAt: current?.premiumExpireAt,
          });
        } catch (_) {
          // 静默失败，继续用 store 内已有信息
        }
      })();
      loadMyVideos(1, false);
    }, [isLoggedIn, loadMyVideos, setUser])
  );

  const loadMore = useCallback(() => {
    if (videoLoading || pageNum >= totalPage || !isLoggedIn) return;
    loadMyVideos(pageNum + 1, true);
  }, [videoLoading, pageNum, totalPage, isLoggedIn, loadMyVideos]);

  const statsItems =
    isPremium
      ? [
          { value: String(videoTotal), label: 'VIDEOS' },
          STATS_LIKES,
          { value: `${daysRemaining} Left`, label: 'PRO MEMBER' },
        ]
      : [
          { value: String(videoTotal), label: 'VIDEOS' },
          STATS_LIKES,
          { value: '3 Left', label: 'FREE PLAN' },
        ];

  const [showCompactHeader, setShowCompactHeader] = useState(false);
  const SCROLL_THRESHOLD = 80;

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      setShowCompactHeader(y > SCROLL_THRESHOLD);
    },
    []
  );

  return (
    <View style={styles.container}>
      {/* 顶部栏：未滚动时只显示设置；滚动后显示 头像+名字+PRO+设置 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {showCompactHeader ? (
          <>
            <View style={styles.headerLeft}>
              <View style={styles.headerAvatarSmall}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.headerAvatarSmallImage} />
                ) : (
                  <Image
                    source={defaultAvatar}
                    style={styles.headerAvatarSmallImage}
                    resizeMode="cover"
                  />
                )}
              </View>
              <Text style={styles.headerUserName} numberOfLines={1}>
                {displayName}
              </Text>
              {isPremium && (
                <View style={styles.proBadgeSmall}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Pressable
              style={styles.headerBtn}
              hitSlop={12}
              onPress={() => navigation.navigate('Settings')}
            >
              <Image source={settingsIcon} style={styles.headerSettingsIcon} resizeMode="contain" />
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.headerBtn} />
            <Pressable
              style={styles.headerBtn}
              hitSlop={12}
              onPress={() => navigation.navigate('Settings')}
            >
              <Image source={settingsIcon} style={styles.headerSettingsIcon} resizeMode="contain" />
            </Pressable>
          </>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* 头像：点击弹出登录弹窗 */}
        <Pressable style={styles.avatarWrap} onPress={openLoginModal}>
          <View style={styles.avatarCircle}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Image source={defaultAvatar} style={styles.avatarImage} resizeMode="cover" />
            )}
          </View>
          <Pressable
            style={styles.editAvatarBtn}
            onPress={(e) => { e.stopPropagation(); navigation.navigate('EditProfile'); }}
          >
            <Image source={editIcon} style={styles.editAvatarIconImage} resizeMode="contain" />
          </Pressable>
        </Pressable>

        <View style={styles.userNameRow}>
          <Text style={styles.userName}>{displayName}</Text>
          {isPremium && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={styles.userEmail}>{displayEmail}</Text>

        {/* 统计栏：会员版第三项为 PRO MEMBER；第三项（3 Left / FREE PLAN）点击弹出购买会员弹窗 */}
        <View style={styles.statsBar}>
          {statsItems.map((item, index) => {
            const isPlanItem = index === statsItems.length - 1;
            if (isPlanItem) {
              return (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [styles.statItemPressable, pressed && styles.statItemPressed]}
                  onPress={openPremiumModal}
                >
                  <View style={[styles.statItem, styles.statItemPlan]}>
                    {index > 0 && <View style={[styles.statDivider, styles.statDividerPlan]} />}
                    <Text style={styles.statValue}>{item.value}</Text>
                    <Text
                      style={[
                        styles.statLabel,
                        isPremium && styles.statLabelMember,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                </Pressable>
              );
            }
            return (
              <View key={item.label} style={styles.statItem}>
                {index > 0 && <View style={styles.statDivider} />}
                <Text style={styles.statValue}>{item.value}</Text>
                <Text
                  style={[
                    styles.statLabel,
                    isPremium && index === 2 && styles.statLabelMember,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* 免费版：GET PREMIUM；会员版：RENEW NOW + X days remaining；点击弹出分享 */}
        <Pressable
          style={styles.premiumBtn}
          onPress={() => openShareModal({ title: 'ImageAI', message: 'Turn your pets into superstar!' })}
        >
          <Image source={vipIcon} style={styles.premiumIconImage} resizeMode="contain" />
          <View style={styles.premiumTextWrap}>
            <Text style={styles.premiumText} numberOfLines={1}>
              {isPremium ? 'RENEW NOW' : 'GET PREMIUM'}
            </Text>
            {isPremium && premiumExpireAt ? (
              <Text style={styles.premiumSubtext} numberOfLines={1}>
                {daysRemaining} days remaining
              </Text>
            ) : null}
          </View>
        </Pressable>

        {/* 用户创作的视频列表 */}
        <View style={[styles.grid, { marginTop: 24 }]}>
          {!isLoggedIn ? null : videoError ? (
            <Text style={styles.gridEmptyText}>{videoError}</Text>
          ) : videoLoading && videoList.length === 0 ? (
            <View style={styles.gridLoadingWrap}>
              <ActivityIndicator size="large" color={ACCENT} />
              <Text style={styles.gridEmptyText}>加载中...</Text>
            </View>
          ) : (
            <>
              {videoList.map((item, index) => {
                const dateStr = item.createdTime
                  ? new Date(item.createdTime).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', year: 'numeric' })
                  : '';
                const statusText = item.status === 'PROCESSING' ? '生成中' : item.status === 'PENDING' ? '待处理' : item.status === 'FAILED' ? '失败' : '';
                return (
                  <Pressable
                    key={item.id ?? item.taskId ?? index}
                    style={[
                      styles.gridItem,
                      {
                        width: cellSize,
                        height: cellSize,
                        marginRight: index % colCount === colCount - 1 ? 0 : gap,
                        marginBottom: gap,
                      },
                    ]}
                    onPress={() => item.videoUrl && item.status === 'SUCCESS' && navigation.navigate('Detail', { id: String(item.id), title: item.promptText ?? '视频' })}
                  >
                    {(item.thumbnailUrl || item.videoUrl) ? (
                      <Image
                        source={{ uri: item.thumbnailUrl || item.videoUrl }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.gridImagePlaceholder} />
                    )}
                    {statusText ? (
                      <View style={styles.gridStatusBadge}>
                        <Text style={styles.gridStatusText}>{statusText}</Text>
                      </View>
                    ) : null}
                    {dateStr ? <Text style={styles.gridDate}>{dateStr}</Text> : null}
                  </Pressable>
                );
              })}
              {videoLoading && videoList.length > 0 && (
                <View style={[styles.gridItem, { width: cellSize, height: cellSize, justifyContent: 'center', alignItems: 'center' }]}>
                  <ActivityIndicator size="small" color={ACCENT} />
                </View>
              )}
            </>
          )}
        </View>
        {isLoggedIn && videoList.length > 0 && pageNum < totalPage && !videoLoading && (
          <Pressable style={styles.loadMoreBtn} onPress={loadMore}>
            <Text style={styles.gridLoadMoreText}>加载更多</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HEADER_BG,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: HEADER_BG,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  headerAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: CARD_BG,
  },
  headerAvatarSmallImage: {
    width: '100%',
    height: '100%',
  },
  headerUserName: {
    fontFamily: 'Space Grotesk',
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
    flexShrink: 0,
  },
  proBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEFD3',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerBtn: {
    padding: 8,
  },
  headerSettingsIcon: {
    width: 28,
    height: 28,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 32,
    alignItems: 'center',
  },
  avatarWrap: {
    marginBottom: 12,
    position: 'relative',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  editAvatarBtn: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarIconImage: {
    width: 24,
    height: 24,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  userName: {
    fontFamily: 'Space Grotesk',
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  proBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEFD3',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  proBadgeText: {
    fontFamily: 'Space Grotesk',
    fontSize: 11,
    fontWeight: '700',
    color: '#FFEFD3',
    letterSpacing: 0.5,
  },
  userEmail: {
    fontFamily: 'Space Grotesk',
    fontSize: 14,
    color: '#3A4A65',
    marginBottom: 20,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
  },
  statItemPressable: {
    flex: 1,
  },
  statItemPressed: {
    opacity: 0.85,
  },
  statItemPlan: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.35)',
  },
  statDivider: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 1,
    backgroundColor: 'rgba(139, 148, 158, 0.3)',
  },
  statDividerPlan: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  statValue: {
    fontFamily: 'Space Grotesk',
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Space Grotesk',
    fontSize: 11,
    color: '#40D3E5',
    letterSpacing: 0.5,
  },
  statLabelMember: {
    color: '#FFEFD3',
  },
  premiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    backgroundColor: PREMIUM_BG,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  premiumIconImage: {
    width: 20,
    height: 20,
  },
  premiumTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    gap: 8,
    flexShrink: 0,
  },
  premiumText: {
    fontFamily: 'Space Grotesk',
    fontSize: 16,
    fontWeight: '700',
    color: PREMIUM_TEXT,
    letterSpacing: 0.5,
  },
  premiumSubtext: {
    fontFamily: 'Space Grotesk',
    flexShrink: 0,
    fontSize: 12,
    color: PREMIUM_TEXT,
    opacity: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'stretch',
  },
  gridItem: {
    backgroundColor: CARD_BG,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 8,
  },
  gridImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(88, 166, 255, 0.2)',
  },
  gridPlaceholderText: {
    fontFamily: 'Space Grotesk',
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -30,
    marginTop: -10,
    fontSize: 14,
    color: TEXT_MUTED,
  },
  gridDate: {
    fontFamily: 'Space Grotesk',
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  gridEmptyText: {
    fontFamily: 'Space Grotesk',
    fontSize: 14,
    color: TEXT_MUTED,
    alignSelf: 'center',
    marginTop: 24,
  },
  gridLoadingWrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  gridStatusBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridStatusText: {
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    color: '#fff',
  },
  loadMoreBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 24,
  },
  gridLoadMoreText: {
    fontFamily: 'Space Grotesk',
    fontSize: 12,
    color: TEXT_MUTED,
  },
});
