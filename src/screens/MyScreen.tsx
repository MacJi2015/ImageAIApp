import {
  Image,
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

const HEADER_BG = '#0f1419';
const CARD_BG = '#1a2332';
const TEXT_MAIN = '#ffffff';
const TEXT_MUTED = '#8b949e';
const ACCENT = '#58a6ff';
const PREMIUM_BG = '#e6d5b8';
const PREMIUM_TEXT = '#2d2318';

const STATS = [
  { value: '124', label: 'VIDEOS' },
  { value: '23', label: 'LIKES' },
  { value: '3 Left', label: 'FREE PLAN' },
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

  return (
    <View style={styles.container}>
      {/* 顶部导航栏：仅保留设置按钮 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerBtn} />
        <Pressable
          style={styles.headerBtn}
          hitSlop={12}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.headerIcon}>⚙</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 头像 */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarPlaceholder}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Pressable
            style={styles.editAvatarBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editAvatarIcon}>✏️</Text>
          </Pressable>
        </View>

        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userEmail}>{displayEmail}</Text>

        {/* 统计栏 */}
        <View style={styles.statsBar}>
          {STATS.map((item, index) => (
            <View key={item.label} style={styles.statItem}>
              {index > 0 && <View style={styles.statDivider} />}
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* GET PREMIUM 按钮 */}
        <Pressable style={styles.premiumBtn}>
          <Text style={styles.premiumIcon}>◆</Text>
          <Text style={styles.premiumText}>GET PREMIUM</Text>
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
  headerBtn: {
    padding: 8,
  },
  headerIcon: {
    fontSize: 22,
    color: TEXT_MAIN,
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
  avatarPlaceholder: {
    fontSize: 40,
    color: TEXT_MAIN,
    fontWeight: '600',
  },
  editAvatarBtn: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarIcon: {
    fontSize: 14,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: TEXT_MUTED,
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
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 0.5,
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
  premiumIcon: {
    fontSize: 16,
    color: PREMIUM_TEXT,
  },
  premiumText: {
    fontSize: 16,
    fontWeight: '700',
    color: PREMIUM_TEXT,
    letterSpacing: 0.5,
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
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -30,
    marginTop: -10,
    fontSize: 14,
    color: TEXT_MUTED,
  },
  gridDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
});
