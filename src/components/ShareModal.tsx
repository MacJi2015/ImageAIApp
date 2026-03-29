import React from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import type { SharePayload } from '../store/useAppStore';
import { PromptCloseIcon } from '../utils';
import { dp, hp } from '../utils/scale';

const shareIcons = {
  facebook: require('../assets/share/facebookIcon.png'),
  instagram: require('../assets/share/instagramIcon.png'),
  x: require('../assets/share/xicon.png'),
  tiktok: require('../assets/share/TikTokicon.png'),
} as const;

// 与 Create Video 底栏一致：深底、大圆角、标题独立一行（分享弹窗无顶边描边，避免色偏）
const COLORS = {
  backdrop: 'rgba(0,0,0,0.75)',
  panel: '#020308',
  closeBtnBg: 'rgba(255,255,255,0.05)',
  closeBtnBorder: 'rgba(255,255,255,0.1)',
  title: '#FFFFFF',
  iconCircle: '#0b121c',
  iconCircleBorder: 'rgba(0, 255, 255, 0.18)',
  communityLabel: 'rgba(140, 160, 190, 0.95)',
  checkboxOn: '#00E8DC',
  checkboxOffBorder: 'rgba(0, 255, 255, 0.35)',
};

export type ShareModalProps = {
  visible: boolean;
  onClose: () => void;
  /** 分享内容，不传则用默认 message */
  payload?: SharePayload | null;
  /** 各平台点击回调，不传则提示未配置 */
  onFacebook?: (payload: SharePayload) => void;
  onInstagram?: (payload: SharePayload) => void;
  onX?: (payload: SharePayload) => void;
  onTikTok?: (payload: SharePayload) => void;
};

const SHARE_OPTIONS = [
  { key: 'facebook' as const, source: shareIcons.facebook },
  { key: 'instagram' as const, source: shareIcons.instagram },
  { key: 'x' as const, source: shareIcons.x },
  { key: 'tiktok' as const, source: shareIcons.tiktok },
] as const;

/** 无 payload 时随机使用的默认分享文案 */
const DEFAULT_SHARE_MESSAGES = [
  'Turn your pets into superstar!',
  'Check this out!',
  'Made with ImageAI — try it!',
  'So much fun with my pet video!',
  'Love this effect!',
  'My pet is a star!',
];

function getRandomDefaultMessage(): string {
  return DEFAULT_SHARE_MESSAGES[Math.floor(Math.random() * DEFAULT_SHARE_MESSAGES.length)];
}

function fallbackShare(_payload: SharePayload) {
  Alert.alert('分享未配置', '当前平台分享能力未配置，请联系开发同学。');
}

export function ShareModal({
  visible,
  onClose,
  payload = null,
  onFacebook,
  onInstagram,
  onX,
  onTikTok,
}: ShareModalProps) {
  const insets = useSafeAreaInsets();
  const [alsoShareToCommunity, setAlsoShareToCommunity] = React.useState(true);

  const showCommunityOption = payload?.showCommunityShareOption === true;

  React.useEffect(() => {
    if (visible && showCommunityOption) {
      setAlsoShareToCommunity(true);
    }
  }, [visible, showCommunityOption]);

  const sharePayload: SharePayload = React.useMemo(
    () => payload ?? { message: getRandomDefaultMessage() },
    [payload]
  );

  /** 去掉仅弹窗 UI 使用的字段；勾选状态仅在 showCommunityShareOption 时写入 shareToCommunity */
  const payloadForShare = React.useMemo((): SharePayload => {
    const { showCommunityShareOption: _omit, ...rest } = sharePayload;
    if (showCommunityOption) {
      return { ...rest, shareToCommunity: alsoShareToCommunity };
    }
    return rest;
  }, [sharePayload, alsoShareToCommunity, showCommunityOption]);

  const handlers = {
    facebook: onFacebook ?? fallbackShare,
    instagram: onInstagram ?? fallbackShare,
    x: onX ?? fallbackShare,
    tiktok: onTikTok ?? fallbackShare,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={4} />
        <View style={styles.backdropOverlay} />
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.panel,
            { paddingBottom: insets.bottom + 28 },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View pointerEvents="none" style={styles.panelTopRim} />
          <View style={styles.header}>
            <View style={styles.headerLeading}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <PromptCloseIcon />
              </TouchableOpacity>
            </View>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.title} numberOfLines={1}>
                Share to
              </Text>
            </View>
            <View style={styles.headerTrailing} />
          </View>

          <View style={styles.iconsRow}>
            {SHARE_OPTIONS.map(({ key, source }) => (
              <TouchableOpacity
                key={key}
                style={styles.iconCircle}
                activeOpacity={0.8}
                onPress={() => {
                  // 先关弹窗，延迟后再调分享，避免原生编辑页被遮住；延迟需足够长让 slide 动画完全结束，否则下拉看文字时会被弹回、遮挡
                  onClose();
                  setTimeout(() => handlers[key](payloadForShare), 650);
                }}
              >
                <Image source={source} style={styles.shareIconImage} resizeMode="contain" />
              </TouchableOpacity>
            ))}
          </View>

          {showCommunityOption ? (
            <Pressable
              style={({ pressed }) => [styles.communityRow, pressed && styles.communityRowPressed]}
              onPress={() => setAlsoShareToCommunity(v => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: alsoShareToCommunity }}
              accessibilityLabel="Also share to the PetsGO community"
            >
              <View
                style={[
                  styles.checkboxOuter,
                  alsoShareToCommunity ? styles.checkboxOuterOn : styles.checkboxOuterOff,
                ]}
              >
                {alsoShareToCommunity ? (
                  <Text style={styles.checkboxMark}>✓</Text>
                ) : null}
              </View>
              <Text style={styles.communityLabel}>Also share to the PetsGO community</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  panel: {
    backgroundColor: COLORS.panel,
    borderTopLeftRadius: dp(32),
    borderTopRightRadius: dp(32),
    paddingHorizontal: 22,
    paddingTop: 24,
    overflow: 'hidden',
  },
  panelTopRim: {
    position: 'absolute',
    left: 0.5,
    right: 0.5,
    top: -0.5,
    height: hp(32),
    borderTopLeftRadius: dp(32),
    borderTopRightRadius: dp(32),
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,255,255,0.1)',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    minHeight: 40,
  },
  headerLeading: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 0,
  },
  headerTrailing: {
    width: 32,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.closeBtnBg,
    borderWidth: 0.5,
    borderColor: COLORS.closeBtnBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.title,
    textAlign: 'center',
    fontFamily: 'Space Grotesk',
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignSelf: 'center',
    maxWidth: '100%',
  },
  communityRowPressed: {
    opacity: 0.85,
  },
  checkboxOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxOuterOn: {
    backgroundColor: COLORS.checkboxOn,
  },
  checkboxOuterOff: {
    borderWidth: 2,
    borderColor: COLORS.checkboxOffBorder,
    backgroundColor: 'transparent',
  },
  checkboxMark: {
    fontSize: 13,
    fontWeight: '800',
    color: '#020308',
    marginTop: -1,
  },
  communityLabel: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.communityLabel,
    fontFamily: 'Space Grotesk',
    lineHeight: 20,
    textAlign: 'left',
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.iconCircle,
    borderWidth: 1,
    borderColor: COLORS.iconCircleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIconImage: {
    width: 28,
    height: 28,
  },
});
