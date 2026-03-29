import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import { PromptCloseIcon } from '../utils';
import { dp, hp } from '../utils/scale';
import { useAppStore } from '../store';

// 设计稿配色：深色主题、青绿链接色
const COLORS = {
  backdrop: 'rgba(0,0,0,0.35)',
  panel: '#0f1419',
  panelBorder: 'transparent',
  // 关闭按钮需要“两色”：中间更深，外圈有一圈描边
  closeBtnBg: '#0d1117',
  closeBtnBorder: 'rgba(110, 118, 129, 0.35)',
  title: '#ffffff',
  // 副标题与条款引导文案（与设计稿一致）
  subtitle: '#3A4A65',
  buttonBg: '#161b22',
  buttonBorder: 'transparent',
  buttonText: '#ffffff',
  footerMuted: '#3A4A65',
  // 底部隐私/条款链接文字：比主按钮蓝色更偏青灰
  link: '#40D3E5',
};

export type LoginModalProps = {
  visible: boolean;
  onClose: () => void;
  onApple?: () => void;
  onGoogle?: () => void;
  onFacebook?: () => void;
  onInstagram?: () => void;
  onX?: () => void;
  onTikTok?: () => void;
  privacyUrl?: string;
  termsUrl?: string;
};

function AppleIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
        fill="#ffffff"
      />
    </Svg>
  );
}

function GoogleIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function FacebookIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 12a10 10 0 1 0-11.56 9.88V14.9H7.9V12h2.54V9.79c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.24.19 2.24.19v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.9h-2.34v6.98A10 10 0 0 0 22 12z"
        fill="#1877F2"
      />
      <Path d="M15.9 14.9l.44-2.9h-2.78v-1.88c0-.79.39-1.56 1.63-1.56h1.26V6.1s-1.15-.19-2.24-.19c-2.28 0-3.77 1.38-3.77 3.88V12H7.9v2.9h2.54v6.98a10.07 10.07 0 0 0 3.12 0V14.9h2.34z" fill="#fff" />
    </Svg>
  );
}

function InstagramIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.8}>
      <Rect x={2} y={2} width={20} height={20} rx={5} ry={5} />
      <Circle cx={12} cy={12} r={4} stroke="#ffffff" fill="none" strokeWidth={1.8} />
      <Circle cx={18} cy={6} r={1.5} fill="#ffffff" />
    </Svg>
  );
}

function XIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="#ffffff">
      <Path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </Svg>
  );
}

function TikTokIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.5 4.2c.36 1.03 1.05 1.89 1.96 2.45.87.54 1.88.8 2.9.76v2.8c-1.28.04-2.54-.25-3.67-.85-.43-.23-.84-.5-1.2-.81v5.45c0 3.08-2.5 5.58-5.58 5.58a5.58 5.58 0 0 1-5.58-5.58 5.58 5.58 0 0 1 5.58-5.58c.3 0 .6.03.89.08v2.93a2.74 2.74 0 0 0-.89-.15 2.72 2.72 0 0 0-2.72 2.72 2.72 2.72 0 0 0 2.72 2.72 2.72 2.72 0 0 0 2.72-2.72V4.2h2.87z"
        fill="#ffffff"
      />
    </Svg>
  );
}

export function LoginModal({
  visible,
  onClose,
  onApple,
  onGoogle,
  onFacebook,
  onInstagram,
  onX,
  onTikTok,
  privacyUrl = 'https://example.com/privacy',
  termsUrl = 'https://example.com/terms',
}: LoginModalProps) {
  const insets = useSafeAreaInsets();
  const socialLoginSubmitting = useAppStore(s => s.socialLoginSubmitting);

  const handlePrivacy = () => Linking.openURL(privacyUrl).catch(() => {});
  const handleTerms = () => Linking.openURL(termsUrl).catch(() => {});

  const buttons = [
    { key: 'apple', label: 'Apple', Icon: AppleIcon, onPress: onApple },
    { key: 'google', label: 'Google', Icon: GoogleIcon, onPress: onGoogle },
    { key: 'facebook', label: 'Facebook', Icon: FacebookIcon, onPress: onFacebook },
    { key: 'instagram', label: 'Instagram', Icon: InstagramIcon, onPress: onInstagram },
    { key: 'x', label: 'X', Icon: XIcon, onPress: onX },
    { key: 'tiktok', label: 'TikTok', Icon: TikTokIcon, onPress: onTikTok },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* 背景模糊层（解决“背景模糊效果有瑕疵”） */}
        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={4} />
        <View style={styles.backdropOverlay} />
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.panel,
            { paddingBottom: insets.bottom + 24 },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View pointerEvents="none" style={styles.panelTopRim} />
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <PromptCloseIcon />
            </TouchableOpacity>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>Log In</Text>
              <Text style={styles.subtitle}>Turn Your Pets Into Superstar</Text>
            </View>
            <View style={styles.closeBtnPlaceholder} />
          </View>

          <View style={styles.buttons}>
            {buttons.map(({ key, label, Icon, onPress }) => (
              <TouchableOpacity
                key={key}
                style={styles.button}
                activeOpacity={0.8}
                onPress={onPress}
              >
                <View style={styles.buttonIcon}>
                  <Icon />
                </View>
                <Text style={styles.buttonText}>Continue with {label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerMuted}>By Continuing, you agree to the</Text>
            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={handlePrivacy} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.footerMuted}> and </Text>
              <TouchableOpacity onPress={handleTerms} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Terms of Service</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {socialLoginSubmitting ? (
          <View
            style={[StyleSheet.absoluteFillObject, styles.submittingLayer]}
            pointerEvents="auto"
            accessibilityLabel="登录中"
          >
            <View style={styles.submittingCard}>
              <ActivityIndicator size="large" color="#58a6ff" />
              <Text style={styles.submittingText}>登录中…</Text>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    // 面板需要与屏幕宽度一致，不额外留左右空隙
    paddingHorizontal: 0,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  panel: {
    backgroundColor: COLORS.panel,
    borderTopLeftRadius: dp(32),
    borderTopRightRadius: dp(32),
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
    overflow: 'hidden',
    borderWidth: 0,
    // iOS shadow (让外层看起来更“干净”，不再像描边)
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 6,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.closeBtnBg,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPlaceholder: {
    width: 32,
    height: 32,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.title,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.subtitle,
  },
  buttons: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: COLORS.buttonBg,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(110, 118, 129, 0.35)',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  buttonIcon: {
    position: 'absolute',
    left: 16,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.buttonText,
  },
  footer: {
    alignItems: 'center',
  },
  footerMuted: {
    fontSize: 12,
    color: COLORS.footerMuted,
    marginBottom: 2,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLink: {
    fontSize: 12,
    color: COLORS.link,
    fontWeight: '500',
    opacity: 0.95,
  },
  submittingLayer: {
    zIndex: 100,
    backgroundColor: 'rgba(5, 10, 20, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submittingCard: {
    minWidth: 200,
    paddingVertical: 28,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: '#1a2332',
    alignItems: 'center',
    gap: 16,
  },
  submittingText: {
    color: '#e6edf3',
    fontSize: 15,
  },
});
