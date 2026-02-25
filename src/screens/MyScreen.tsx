import { useCallback, useState } from 'react';
import {
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
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../store';

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

const STATS_BASE = [
  { value: '124', label: 'VIDEOS' },
  { value: '23', label: 'LIKES' },
];

// 示例网格数据（可后续接真实数据）
const GRID_ITEMS = [
  { id: '1', type: 'image', title: null, date: '2024-05-18' },
  { id: '2', type: 'image', title: null, date: '2024-05-18' },
  { id: '3', type: 'image', title: null, date: '2024-05-18' },
  { id: '4', type: 'image', title: null, date: '2024-05-18' },
  { id: '5', type: 'placeholder', title: 'PetTales', date: '2024-05-18' },
  { id: '6', type: 'empty', title: null, date: null },
];

export function MyScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const user = useUserStore(state => state.user);
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

  const statsItems =
    isPremium
      ? [
          ...STATS_BASE,
          { value: `${daysRemaining} Left`, label: 'PRO MEMBER' },
        ]
      : [
          ...STATS_BASE,
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
        {/* 头像 */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Image source={defaultAvatar} style={styles.avatarImage} resizeMode="cover" />
            )}
          </View>
          <Pressable
            style={styles.editAvatarBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Image source={editIcon} style={styles.editAvatarIconImage} resizeMode="contain" />
          </Pressable>
        </View>

        <View style={styles.userNameRow}>
          <Text style={styles.userName}>{displayName}</Text>
          {isPremium && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={styles.userEmail}>{displayEmail}</Text>

        {/* 统计栏：会员版第三项为 PRO MEMBER 且标签白色 */}
        <View style={styles.statsBar}>
          {statsItems.map((item, index) => (
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
          ))}
        </View>

        {/* 免费版：GET PREMIUM；会员版：RENEW NOW + X days remaining */}
        <Pressable style={styles.premiumBtn}>
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

        {/* 内容网格 */}
        <View style={[styles.grid, { marginTop: 24 }]}>
          {GRID_ITEMS.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.gridItem,
                {
                  width: cellSize,
                  height: cellSize,
                  marginRight: index % colCount === colCount - 1 ? 0 : gap,
                  marginBottom: gap,
                },
              ]}
            >
              {item.type === 'empty' ? null : item.type === 'placeholder' ? (
                <Text style={styles.gridPlaceholderText}>{item.title}</Text>
              ) : (
                <View style={styles.gridImagePlaceholder} />
              )}
              {item.date ? (
                <Text style={styles.gridDate}>{item.date}</Text>
              ) : null}
            </View>
          ))}
        </View>
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
    color: '#00FFFF',
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
});
