import { useCallback, useRef, useState } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Asset } from 'react-native-image-picker';
import { useUserStore, useAppStore } from '../store';
import { isLoginSessionError } from '../api/request';
import { getMyVideos, type AppVideoTask } from '../api/services/video';
import { getProfile, profileToUserInfo } from '../api/services/user';
import { ChooseVideoModal } from './Details/components/ChooseVideoModal';
import { dp, hp } from '../utils/scale';

const settingsIcon = require('../assets/my/settings.png');
const editIcon = require('../assets/my/edit.png');
const defaultAvatar = require('../assets/my/topimage.png');
const vipIcon = require('../assets/my/vip.png');
const emptyIllustration = require('../assets/details/empty.png');
const preGoodsImg = require('../assets/details/pre-goods-img.png');

const HEADER_BG = '#050A14';
const CARD_BG = '#1a2332';
const TEXT_MAIN = '#ffffff';
const TEXT_MUTED = '#8b949e';
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

/** 开发预览多状态列表 UI；联调真实 myVideos 时改为 false */
// const USE_DEV_MOCK_MY_VIDEOS = __DEV__;

// const MOCK_PET = (n: number) => `https://picsum.photos/seed/petsgo-mock-${n}/300/300`;
// const MOCK_THUMB = (n: number) => `https://picsum.photos/seed/petsgo-thumb-${n}/200/200`;
// /** 短测试片，供 SUCCESS 态点击进入 WorkDetail */
// const MOCK_VIDEO_MP4 =
//   'https://storage.googleapis.com/exoplayer-test-media-1/mp4/android-screens-10s.mp4';

// function mockTask(
//   i: number,
//   status: VideoTaskStatus,
//   extra: Partial<AppVideoTask> = {}
// ): AppVideoTask {
//   const base: AppVideoTask = {
//     id: 100000 + i,
//     taskId: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`,
//     userId: 10001,
//     status,
//     actionType: i % 2 === 0 ? 'DANCE' : 'WAVE',
//     createdTime: `2026-04-${String((i % 28) + 1).padStart(2, '0')}T${10 + (i % 5)}:00:00.000Z`,
//     modifiedTime: `2026-04-${String((i % 28) + 1).padStart(2, '0')}T11:00:00.000Z`,
//     duration: status === 'SUCCESS' ? 12 + i : 0,
//     errorMessage: status === 'FAILED' ? 'Mock: generation failed' : '',
//     petImageUrl: MOCK_PET(i),
//     promptText: `Mock prompt #${i} (${status})`,
//     removeWatermark: i % 2 === 0,
//     shareToCommunity: i % 3 !== 0,
//     templateId: `tpl-${(i % 4) + 1}`,
//     thumbnailUrl: MOCK_THUMB(i),
//     videoUrl: status === 'SUCCESS' ? MOCK_VIDEO_MP4 : '',
//     ...extra,
//   };
//   return base;
// }

// /** 10 条本地数据，字段与 `my.md` / AppVideoTask 一致；覆盖四种 status */
// const DEV_MOCK_MY_VIDEOS: AppVideoTask[] = [
//   mockTask(1, 'PENDING'),
//   mockTask(2, 'PROCESSING'),
//   mockTask(3, 'SUCCESS'),
//   mockTask(4, 'FAILED'),
//   mockTask(5, 'PENDING'),
//   mockTask(6, 'PROCESSING'),
//   mockTask(7, 'SUCCESS'),
//   mockTask(8, 'FAILED'),
//   mockTask(9, 'SUCCESS'),
//   mockTask(10, 'PROCESSING'),
// ];

export function MyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const user = useUserStore(state => state.user);
  const setUser = useUserStore(state => state.setUser);
  /** 通过是否有 token 判断是否登录 */
  const isLoggedIn = useUserStore(state => !!state.token);
  const authHydrated = useAppStore(state => state.authHydrated);
  const openLoginModal = useAppStore(state => state.openLoginModal);
  const openPremiumModal = useAppStore(state => state.openPremiumModal);
  const setTabBarTranslucent = useAppStore(state => state.setTabBarTranslucent);
  const tabBarHeight = 56 + Math.max(insets.bottom, 8);

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
  const [chooseImageModalVisible, setChooseImageModalVisible] = useState(false);
  const [loadedImageKeys, setLoadedImageKeys] = useState<Record<string, boolean>>({});
  const PAGE_SIZE = 20;
  const videoListRef = useRef<AppVideoTask[]>([]);
  videoListRef.current = videoList;

  const loadMyVideos = useCallback(async (page: number = 1, append = false) => {
    if (!useUserStore.getState().token) return;
    const silent =
      page === 1 && !append && videoListRef.current.length > 0;
    if (page === 1 && !append && !silent) {
      setMyVideosFetched(false);
    }
    if (append || (page === 1 && !silent)) {
      setVideoLoading(true);
    }
    setVideoError(null);
    try {
      // if (USE_DEV_MOCK_MY_VIDEOS) {
      //   setTotalPage(1);
      //   setVideoTotal(DEV_MOCK_MY_VIDEOS.length);
      //   setPageNum(page);
      //   setLoadedImageKeys({});
      //   if (append && page > 1) {
      //     setVideoList(prev => [...prev]);
      //   } else {
      //     setVideoList([...DEV_MOCK_MY_VIDEOS]);
      //   }
      // } else {
        const res = await getMyVideos({ pageNum: page, pageSize: PAGE_SIZE });
        const nextList = res.list ?? [];
        setTotalPage(res.totalPage ?? 0);
        setVideoTotal(res.totalRecord ?? 0);
        setPageNum(page);
        if (page === 1 && !append) {
          setLoadedImageKeys(prev => {
            const ids = new Set(
              nextList.map((item, i) => String(item.id ?? item.taskId ?? i)),
            );
            const next: Record<string, boolean> = {};
            for (const k of Object.keys(prev)) {
              if (ids.has(k)) next[k] = prev[k];
            }
            return next;
          });
        }
        setVideoList(prev => (append ? [...prev, ...nextList] : nextList));
      // }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '加载失败，请重试';
      // 登录态类错误由 request 层统一 openLoginModal；此处只清错误文案避免与弹窗叠字
      if (isLoginSessionError(e)) {
        setVideoError(null);
      } else {
        setVideoError(msg);
      }
      if (!append && !silent) {
        setVideoList([]);
      }
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
        } catch {
          // 静默失败，继续用 store 内已有信息
        }
      })();
      loadMyVideos(1, false);
    }, [loadMyVideos, setUser, openLoginModal, authHydrated])
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
  const freeQuotaStat = user?.remainingQuota ?? 0;
  const hasSubEnd = Boolean(premiumExpireAt && !Number.isNaN(new Date(premiumExpireAt).getTime()));
  const statsItems =
    isPremium
      ? [
          { value: videosStat, label: 'VIDEOS' },
          { value: likesStat, label: 'LIKES' },
          { value: freeQuotaStat, label: 'PRO MEMBER' },
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
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const y = contentOffset.y;
      const maxOffsetY = Math.max(0, contentSize.height - layoutMeasurement.height);
      const clampedY = Math.min(Math.max(y, 0), maxOffsetY);
      const bottomRegionTop = clampedY + layoutMeasurement.height - tabBarHeight;
      const effectiveContentHeight = Math.max(0, contentSize.height - tabBarHeight);
      const intersectsTabArea = bottomRegionTop < effectiveContentHeight;
      setTabBarTranslucent(intersectsTabArea);
      setShowCompactHeader(y > SCROLL_THRESHOLD);
    },
    [setTabBarTranslucent, tabBarHeight]
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

  /** 空状态 / 与底部 Add 一致：选图后进入自定义提示页 */
  const handleEmptyStateImageChosen = useCallback(
    (asset: Asset, uploadedUrl?: string) => {
      setChooseImageModalVisible(false);
      if (asset?.uri) {
        navigation.navigate('CustomPrompt', {
          imageUri: asset.uri,
          petImageUrl: uploadedUrl,
        });
      }
    },
    [navigation]
  );

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

        <View style={styles.statsSectionWrap}>
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
        </View>
        {/* 用户创作的视频列表：仅展示接口数据；未登录不展示提示文案（由登录弹窗引导） */}
        <View style={[styles.grid, styles.gridTopSpacing]}>
          {videoList.length > 0 ? (
            <>
              {videoList.map((item, index) => {
                const itemKey = String(item.id ?? item.taskId ?? index);
                const dateStr = item.createdTime
                  ? new Date(item.createdTime).toLocaleDateString('en-CA')
                  : '';
               
                return (
                  <Pressable
                    key={itemKey}
                    style={[
                      styles.gridItem,
                      styles.gridItemSized,
                    ]}
                    onPress={() =>
                      item.videoUrl &&
                      item.status === 'SUCCESS' &&
                      navigation.navigate('WorkDetail', {
                        item,
                      })
                    }
                  >
                    {item.status === 'SUCCESS' && (item.petImageUrl || item.videoUrl) ? (
                      <>
                        {!loadedImageKeys[itemKey] ? (
                          <View style={styles.gridImagePlaceholder}>
                            <Image
                              source={preGoodsImg}
                              style={styles.gridPendingImage}
                              resizeMode="contain"
                            />
                          </View>
                        ) : null}
                        <Image
                          source={{ uri: item.petImageUrl ?? item.videoUrl }}
                          style={StyleSheet.absoluteFill}
                          resizeMode="cover"
                          onLoad={() =>
                            setLoadedImageKeys(prev =>
                              prev[itemKey] ? prev : { ...prev, [itemKey]: true }
                            )
                          }
                          onError={() =>
                            setLoadedImageKeys(prev => {
                              if (!prev[itemKey]) return prev;
                              const next = { ...prev };
                              delete next[itemKey];
                              return next;
                            })
                          }
                        />
                      </>
                    ) : (
                      <View style={styles.gridImagePlaceholder}>
                        <Image source={preGoodsImg} style={styles.gridPendingImage} resizeMode="contain" />
                      </View>
                    )}
              
                    {dateStr ? (
                      <LinearGradient
                        colors={['rgba(5, 10, 20, 0)', 'rgba(5, 10, 20, 0.8)']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.gridDateOverlay}
                      >
                        <Text style={styles.gridDate}>{dateStr}</Text>
                      </LinearGradient>
                    ) : null}
                  </Pressable>
                );
              })}
             
            </>
          ) : (
            <View style={styles.gridEmptyState}>
              <Image source={emptyIllustration} style={styles.gridEmptyImage} resizeMode="contain" />
              <Text style={styles.gridEmptyTitle}>Your gallery is empty.</Text>
              <Text style={styles.gridEmptyHint}>Tap to create your first video.</Text>
              <Pressable
                style={({ pressed }) => [styles.gridEmptyPetsGoBtn, pressed && styles.gridEmptyPetsGoBtnPressed]}
                onPress={() => setChooseImageModalVisible(true)}
              >
                <Text style={styles.gridEmptyPetsGoBtnText}>PetsGO</Text>
              </Pressable>
            </View>
          )}
        </View>
        {isLoggedIn && videoList.length > 0 && pageNum < totalPage && !videoLoading && (
          <Pressable style={styles.loadMoreBtn} onPress={loadMore}>
            <Text style={styles.gridLoadMoreText}>Load more</Text>
          </Pressable>
        )}
      </ScrollView>
      <ChooseVideoModal
        visible={chooseImageModalVisible}
        onClose={() => setChooseImageModalVisible(false)}
        onChooseGallery={handleEmptyStateImageChosen}
        onTakePhoto={handleEmptyStateImageChosen}
      />
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
    paddingHorizontal: dp(16),
    paddingTop: hp(8),
    paddingBottom: hp(10),
    backgroundColor: HEADER_BG,
  },
  headerCenterSpacer: {
    flex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: dp(4),
    minWidth: 0,
    // paddingHorizontal: 4,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSettingsIcon: {
    width: dp(38),
    height: dp(38),
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: dp(4),
    alignItems: 'center',
  },
  avatarWrap: {
    marginBottom: hp(12),
    position: 'relative',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    marginBottom: hp(12),
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: dp(4),
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
    color: '#3A4A65',
    textAlign: 'center',
    letterSpacing: 0.15,
    lineHeight: 20,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    paddingVertical: hp(8),
    paddingHorizontal: 4,
    marginBottom: hp(12),
  },
  statsSectionWrap: {
    width: '100%',
    paddingHorizontal: dp(8),
    marginBottom: hp(20),
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
    // paddingVertical: 15,
    height: hp(44),
    borderRadius: dp(12),
    overflow: 'hidden',
  },
  /** 设计稿：钻石标 + 文案作为一组水平居中 */
  premiumBtnFree: {
    justifyContent: 'center',
    gap: 10,
  },
  /** 会员续费：钻石标 + 主副文案成组水平居中 */
  premiumBtnMember: {
    justifyContent: 'center',
  },
  premiumIconImage: {
    width: dp(24),
    height: dp(24),
  },
  premiumMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    gap: dp(4),
  },
  premiumMemberTitles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dp(4),
    minWidth: 0,
    flexShrink: 1,
  },
  premiumTextFree: {
    fontFamily: 'Space Grotesk',
    fontSize: dp(16),
    fontWeight: 700,
    color: PREMIUM_TEXT,
    letterSpacing: 1.25,
    textTransform: 'uppercase',
  },
  premiumTextMember: {
    fontFamily: 'Space Grotesk',
    fontSize: dp(16),
    fontWeight: 700,
    color: PREMIUM_TEXT,
    letterSpacing: 0.6,
    flexShrink: 1,
  },
  /** 副文案：较轻字重、略浅色，与主标题间距由 premiumMemberTitles.gap 控制 */
  premiumSubtextMember: {
    fontFamily: 'Space Grotesk',
    fontSize: dp(12),
    fontWeight: 400,
    color: '#5F5B57',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'stretch',
    columnGap: dp(3),
    rowGap: hp(4),
  },
  gridTopSpacing: {
    marginTop: hp(4),
  },
  gridItem: {
    backgroundColor: CARD_BG,
    // borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  gridItemSized: {
    width: dp(120),
    height: hp(160),
  },
  gridImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A2432',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridPendingImage: {
    width: dp(84),
    height: hp(27),
  },
  gridDate: {
    fontFamily: 'Space Grotesk',
    fontSize: dp(10),
    lineHeight: hp(12),
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 1)',
    paddingLeft: dp(8),
  },
  gridDateOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: hp(18),
    // paddingLeft: dp(8),
    justifyContent: 'center',
  },
  gridEmptyWrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  gridEmptyState: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(35),

    // paddingVertical: hp(24),
    // paddingHorizontal: dp(24),
    // minHeight: hp(220),
  },
  gridEmptyImage: {
    width: dp(85),
    height: hp(85),
    marginBottom: hp(8),
  },
  gridEmptyTitle: {
    fontFamily: 'Space Grotesk',
    fontSize: dp(14),
    fontWeight: 400,
    color: '#3A4A65',
    textAlign: 'center',
    // marginBottom: hp(4),
    lineHeight: hp(22),
  },
  gridEmptyHint: {
    fontFamily: 'Space Grotesk',
    fontSize: dp(14),
    fontWeight: 400,
    color: '#3A4A65',
    textAlign: 'center',
    lineHeight: hp(22),
    marginBottom: hp(18),
  },
  gridEmptyPetsGoBtn: {
   paddingVertical: dp(10),
    borderRadius: dp(12),
    borderWidth: 0.5,
    borderColor: 'rgba(0, 255, 255, 0.2)',
    backgroundColor: 'transparent',
    minWidth: dp(84),
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridEmptyPetsGoBtnPressed: {
    opacity: 0.85,
    backgroundColor: 'rgba(0, 255, 255, 0.06)',
  },
  gridEmptyPetsGoBtnText: {
    fontFamily: 'Space Grotesk',
    fontSize: dp(16),
    fontWeight: '700',
    color: TEXT_MAIN,
    letterSpacing: 0.3,
  },
  gridEmptyText: {
    fontFamily: 'Space Grotesk',
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 22,
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
