import React from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SharePayload } from '../store/useAppStore';

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
  closeBtnBg: 'rgba(255, 255, 255, 0.06)',
  closeBtnBorder: 'rgba(0, 255, 255, 0.22)',
  title: '#FFFFFF',
  iconCircle: '#0b121c',
  iconCircleBorder: 'rgba(0, 255, 255, 0.18)',
  icon: '#FFFFFF',
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

function CloseIcon() {
  return (
    <Svg width={11} height={11} viewBox="0 0 14 14" fill="none">
      <Path
        d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
        stroke={COLORS.icon}
        strokeOpacity={0.88}
        strokeWidth={1.15}
        strokeLinecap="round"
      />
    </Svg>
  );
}

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
  const sharePayload: SharePayload = React.useMemo(
    () => payload ?? { message: getRandomDefaultMessage() },
    [payload, visible]
  );

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
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.panel,
            { paddingBottom: insets.bottom + 28 },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <View style={styles.headerLeading}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <CloseIcon />
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
                  setTimeout(() => handlers[key](sharePayload), 650);
                }}
              >
                <Image source={source} style={styles.shareIconImage} resizeMode="contain" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: COLORS.panel,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    minHeight: 40,
  },
  headerLeading: {
    width: 34,
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
    width: 34,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.closeBtnBg,
    borderWidth: 1,
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
    paddingBottom: 8,
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
