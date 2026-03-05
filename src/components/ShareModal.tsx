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

// 强还原：深色底、圆角仅顶部、白字、圆形分享按钮
const COLORS = {
  backdrop: 'rgba(0,0,0,0.6)',
  panel: '#1A202C',
  closeBtnBg: '#2D3748',
  title: '#FFFFFF',
  iconCircle: '#252B33',
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
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path
        d="M2 2l14 14M16 2L2 16"
        stroke={COLORS.icon}
        strokeWidth={2}
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
  const sharePayload: SharePayload = payload ?? { message: 'Check this out!' };

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
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <CloseIcon />
            </TouchableOpacity>
            <Text style={styles.title}>Share to</Text>
            <View style={styles.closeBtnPlaceholder} />
          </View>

          <View style={styles.iconsRow}>
            {SHARE_OPTIONS.map(({ key, source }) => (
              <TouchableOpacity
                key={key}
                style={styles.iconCircle}
                activeOpacity={0.8}
                onPress={() => {
                  // Facebook：先关弹窗，延迟后再调分享，避免 iOS 真机分享面板不出现（用 setTimeout 替代已弃用的 InteractionManager）
                  if (key === 'facebook') {
                    onClose();
                    setTimeout(() => handlers.facebook(sharePayload), 400);
                  } else {
                    handlers[key](sharePayload);
                    onClose();
                  }
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.closeBtnBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPlaceholder: {
    width: 40,
    height: 40,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.title,
    textAlign: 'center',
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.iconCircle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIconImage: {
    width: 28,
    height: 28,
  },
});
