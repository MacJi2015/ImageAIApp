import { useCallback, useState } from 'react';
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
import { isLoginSessionError } from '../api/request';
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
const STAT_LABEL_CYAN = '#40D3E5';

/** 会员 CTA：浅米色底 + 深棕字（对齐设计稿胶囊按钮） */
const PREMIUM_BG = '#efe4d4';
const PREMIUM_TEXT = '#2c241c';

/** 统计数字展示，避免接口返回 undefined / 非数字 / 异常字符串时出现 "undefined" */
function formatStatInt(n: unknown): string {
  if (n === '' || n === 'undefined' || n === 'null') return '0';
  const x = Number(n);
  return Number.isFinite(x) ? String(Math.max(0, Math.trunc(x))) : '0';
}

export function MyScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const user = useUserStore(state => state.user);
  const setUser = useUserStore(state => state.setUser);
  /** 通过是否有 token 判断是否登录 */
  const isLoggedIn = useUserStore(state => !!state.token);
  const authSessionEpoch = useAppStore(state => state.authSessionEpoch);
  const authHydrated = useAppStore(state => state.authHydrated);
  const openLoginModal = useAppStore(state => state.openLoginModal);
  const openPremiumModal = useAppStore(state => state.openPremiumModal);
  const gap = 8;
  const colCount = 3;
  const cellSize = (width - 24 - gap * (colCount - 1)) / colCount;

  /** 未登录时不使用假名假邮箱，避免看起来像已登录 */
  const displayName = isLoggedIn
    ? (user?.name?.trim() || 'User')
    : '';
  const displayEmail = isLoggedIn ? (user?.email?.trim() || '') : '';
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
  /** 避免首帧在「未请求 / 请求中」时误显示「暂无数据」 */
  const [myVideosFetched, setMyVideosFetched] = useState(false);
  const PAGE_SIZE = 20;

  const loadMyVideos = useCallback(async (page: number = 1, append = false) => {
    if (!useUserStore.getState().token) return;
    if (page === 1 && !append) setMyVideosFetched(false);
    setVideoLoading(true);
    setVideoError(null);
    try {
      const res = await getMyVideos({ pageNum: page, pageSize: PAGE_SIZE });
      setTotalPage(res.totalPage ?? 0);
      setVideoTotal(res.totalRecord ?? 0);
      setPageNum(page);
      setVideoList(prev => (append ? [...prev, ...(res.list ?? [])] : res.list ?? []));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '加载失败，请重试';
      // 登录态类错误由 request 层统一 openLoginModal；此处只清错误文案避免与弹窗叠字
      if (isLoginSessionError(e)) {
        setVideoError(null);
      } else {
        setVideoError(msg);
      }
      if (!append) setVideoList([]);
    } finally {
      setVideoLoading(false);
      setMyVideosFetched(true);
    }
  }, []);

  /** 进入页面时：无 token 则弹出登录（去掉默认 token 后不会发接口，需主动引导）；已登录则拉 profile + 我的视频 */
  useFocusEffect(
    useCallback(() => {
      if (!authHydrated) return;
      const hasToken = !!useUserStore.getState().token;
      if (!hasToken) {
        __DEV__ && console.log('[MyScreen] useFocusEffect: 无 token，打开登录弹窗');
        const frame = requestAnimationFrame(() => {
          if (useUserStore.getState().token) return;
          if (useAppStore.getState().showLoginModal) return;
          openLoginModal();
        });
        return () => cancelAnimationFrame(frame);
      }
      __DEV__ && console.log('[MyScreen] useFocusEffect: 有 token，拉取 getProfile');
      (async () => {
        try {
          const profile = await getProfile();
          const base = profileToUserInfo(profile);
          const current = useUserStore.getState().user;
          setUser({
            ...base,
            isPremium: base.isPremium ?? false,
            premiumExpireAt: base.premiumExpireAt ?? current?.premiumExpireAt,
          });
        } catch (_) {
          // 静默失败，继续用 store 内已有信息
        }
      })();
      loadMyVideos(1, false);
    }, [loadMyVideos, setUser, authSessionEpoch, openLoginModal, authHydrated])
  );

  const loadMore = useCallback(() => {
    if (videoLoading || pageNum >= totalPage || !isLoggedIn) return;
    loadMyVideos(pageNum + 1, true);
  }, [videoLoading, pageNum, totalPage, isLoggedIn, loadMyVideos]);

  /** 视频数：优先 profile；未返回时用「我的视频」列表 total，避免界面出现 undefined */
  const likesStat = formatStatInt(user?.likesAmount);
  const videosStat = formatStatInt(
    user?.videosAmount !== undefined && user?.videosAmount !== null
      ? user.videosAmount
      : videoTotal
  );
  const freeQuotaStat = formatStatInt(user?.remainingQuota);
  const hasSubEnd = Boolean(premiumExpireAt && !Number.isNaN(new Date(premiumExpireAt).getTime()));
  const proPlanValue = hasSubEnd ? `${daysRemaining} Left` : '—';
  const statsItems =
    isPremium
      ? [
          { value: videosStat, label: 'VIDEOS' },
          { value: likesStat, label: 'LIKES' },
          { value: proPlanValue, label: 'PRO MEMBER' },
        ]
      : [
          { value: videosStat, label: 'VIDEOS' },
          { value: likesStat, label: 'LIKES' },
          { value: `${freeQuotaStat} Left`, label: 'FREE PLAN' },
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

  /** GET PREMIUM / RENEW NOW：未登录先弹登录，已登录再打开会员购买弹窗 */
  const handlePremiumCtaPress = useCallback(() => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    openPremiumModal();
  }, [isLoggedIn, openLoginModal, openPremiumModal]);

  /** 编辑资料：无 token 时先引导登录 */
  const handleEditProfilePress = useCallback(() => {
    if (!useUserStore.getState().token) {
      openLoginModal();
      return;
    }
    navigation.navigate('EditProfile');
  }, [navigation, openLoginModal]);

  /** 与 MainTabs 绝对定位 Tab 同高：56 + safe bottom，避免最后一行视频被底栏挡住 */
  const scrollBottomPadding = 56 + Math.max(insets.bottom, 8) + 16;

  return (
    <View style={styles.container}>
      {/* 顶部栏：滚动后中间为 头像+名字+PRO；右侧设置 */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        {showCompactHeader ? (
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
        ) : (
          <View style={styles.headerCenterSpacer} />
        )}
        <Pressable
          style={styles.headerBtn}
          hitSlop={12}
          onPress={() => navigation.navigate('Settings')}
        >
          <Image source={settingsIcon} style={styles.headerSettingsIcon} resizeMode="contain" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* 头像 + 编辑入口 */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Image source={defaultAvatar} style={styles.avatarImage} resizeMode="cover" />
            )}
          </View>
          <Pressable style={styles.editAvatarBtn} onPress={handleEditProfilePress}>
            <Image source={editIcon} style={styles.editAvatarIconImage} resizeMode="contain" />
          </Pressable>
        </View>

        {isLoggedIn ? (
          <View style={styles.profileTextBlock}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{displayName}</Text>
              {isPremium && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            {displayEmail ? <Text style={styles.userEmail}>{displayEmail}</Text> : null}
          </View>
        ) : null}

        {/* 统计栏：仅会员第三项 PRO MEMBER 可点（续费）；FREE PLAN 仅展示 */}
        <View style={styles.statsBar}>
          {statsItems.map((item, index) => {
            const isPlanItem = index === statsItems.length - 1;
            if (isPlanItem && isPremium) {
              return (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [styles.statItemPressable, pressed && styles.statItemPressed]}
                  onPress={handlePremiumCtaPress}
                >
                  <View style={styles.statItem}>
                    {index > 0 && <View style={styles.statDivider} />}
                    <Text style={styles.statValue}>{item.value ?? '0'}</Text>
                    <Text
                      style={[
                        styles.statLabel,
                        item.label === 'PRO MEMBER' && styles.statLabelProMember,
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
                <Text style={styles.statValue}>{item.value ?? '0'}</Text>
                <Text
                  style={[
                    styles.statLabel,
                    item.label === 'PRO MEMBER' && styles.statLabelProMember,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* 免费版：图标+GET PREMIUM 居中；会员版：图标+RENEW NOW+剩余天数 同一行整体居中（设计稿） */}
        <Pressable
          style={[styles.premiumBtn, isPremium ? styles.premiumBtnMember : styles.premiumBtnFree]}
          onPress={handlePremiumCtaPress}
        >
          {isPremium ? (
            <View style={styles.premiumMemberRow}>
              <Image source={vipIcon} style={styles.premiumIconImage} resizeMode="contain" />
              <View style={styles.premiumMemberTitles}>
                <Text style={styles.premiumTextMember} numberOfLines={1}>
                  RENEW NOW
                </Text>
                <Text style={styles.premiumSubtextMember} numberOfLines={1}>
                  {hasSubEnd
                    ? `${daysRemaining} days remaining`
                    : 'No expiry date'}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Image source={vipIcon} style={styles.premiumIconImage} resizeMode="contain" />
              <Text style={styles.premiumTextFree} numberOfLines={1}>
                GET PREMIUM
              </Text>
            </>
          )}
        </Pressable>

        {/* 用户创作的视频列表：仅展示接口数据；未登录不展示提示文案（由登录弹窗引导） */}
        <View style={[styles.grid, { marginTop: 24 }]}>
          {isLoggedIn &&
          !videoError &&
          videoList.length === 0 &&
          (!myVideosFetched || videoLoading) ? (
            <View style={styles.gridLoadingWrap}>
              <ActivityIndicator size="large" color={ACCENT} />
              <Text style={styles.gridEmptyText}>加载中...</Text>
            </View>
          ) : isLoggedIn && videoError ? (
            <View style={styles.gridEmptyWrap}>
              <Text style={styles.gridEmptyText}>{videoError}</Text>
            </View>
          ) : !isLoggedIn ? null : videoList.length > 0 ? (
            <>
              {videoList.map((item, index) => {
                const dateStr = item.createdTime
                  ? new Date(item.createdTime).toLocaleDateString('en-CA')
                  : '';
                const statusText =
                  item.status === 'PROCESSING'
                    ? '生成中'
                    : item.status === 'PENDING'
                      ? '待处理'
                      : item.status === 'FAILED'
                        ? '失败'
                        : '';
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
                    onPress={() =>
                      item.videoUrl &&
                      item.status === 'SUCCESS' &&
                      navigation.navigate('WorkDetail', {
                        item,
                      })
                    }
                  >
                    {item.petImageUrl || item.videoUrl ? (
                      <Image
                        source={{ uri: item.petImageUrl ?? item.videoUrl }}
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
                <View
                  style={[
                    styles.gridItem,
                    {
                      width: cellSize,
                      height: cellSize,
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <ActivityIndicator size="small" color={ACCENT} />
                </View>
              )}
            </>
          ) : isLoggedIn && myVideosFetched && !videoLoading ? (
            <View style={styles.gridEmptyWrap}>
              {/* <Text style={styles.gridEmptyText}>暂无数据</Text> */}
            </View>
          ) : null}
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
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: HEADER_BG,
  },
  headerCenterSpacer: {
    flex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    minWidth: 0,
    paddingHorizontal: 4,
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
    paddingVertical: 6,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  headerSettingsIcon: {
    width: 34,
    height: 34,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  avatarWrap: {
    marginBottom: 10,
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
  profileTextBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 16,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  userName: {
    fontFamily: 'Space Grotesk',
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_MAIN,
    textAlign: 'center',
    letterSpacing: -0.3,
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
    fontWeight: '500',
    color: TEXT_MUTED,
    textAlign: 'center',
    letterSpacing: 0.15,
    lineHeight: 20,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 18,
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
  statDivider: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 1,
    backgroundColor: 'rgba(139, 148, 158, 0.3)',
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
    color: STAT_LABEL_CYAN,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  statLabelProMember: {
    color: '#FFEFD3',
  },
  premiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: PREMIUM_BG,
    paddingVertical: 15,
    minHeight: 50,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  /** 设计稿：钻石标 + 文案作为一组水平居中 */
  premiumBtnFree: {
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  /** 会员续费：钻石标 + 主副文案成组水平居中 */
  premiumBtnMember: {
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  premiumIconImage: {
    width: 22,
    height: 22,
  },
  premiumMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    gap: 10,
  },
  premiumMemberTitles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
    flexShrink: 1,
  },
  premiumTextFree: {
    fontFamily: 'Space Grotesk',
    fontSize: 15,
    fontWeight: '700',
    color: PREMIUM_TEXT,
    letterSpacing: 1.25,
    textTransform: 'uppercase',
  },
  premiumTextMember: {
    fontFamily: 'Space Grotesk',
    fontSize: 15,
    fontWeight: '700',
    color: PREMIUM_TEXT,
    letterSpacing: 0.6,
    flexShrink: 1,
  },
  /** 副文案：较轻字重、略浅色，与主标题间距由 premiumMemberTitles.gap 控制 */
  premiumSubtextMember: {
    fontFamily: 'Space Grotesk',
    fontSize: 12,
    fontWeight: '400',
    color: '#5F5B57',
    letterSpacing: 0.2,
    flexShrink: 1,
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
    position: 'relative',
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
    position: 'absolute',
    left: 8,
    bottom: 8,
    fontFamily: 'Space Grotesk',
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.92)',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  gridEmptyWrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  gridEmptyText: {
    fontFamily: 'Space Grotesk',
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 22,
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
