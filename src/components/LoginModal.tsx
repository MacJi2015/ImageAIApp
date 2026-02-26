import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 设计稿配色：深色主题、青绿链接色
const COLORS = {
  backdrop: 'rgba(0,0,0,0.75)',
  panel: '#0d1117',
  panelBorder: 'rgba(110, 118, 129, 0.35)',
  closeBtnBg: 'rgba(33, 38, 45, 1)',
  title: '#ffffff',
  subtitle: '#8b949e',
  buttonBg: '#161b22',
  buttonBorder: 'rgba(110, 118, 129, 0.4)',
  buttonText: '#ffffff',
  footerMuted: '#8b949e',
  link: '#58a6ff',
};

export type LoginModalProps = {
  visible: boolean;
  onClose: () => void;
  onApple?: () => void;
  onGoogle?: () => void;
  onInstagram?: () => void;
  onX?: () => void;
  privacyUrl?: string;
  termsUrl?: string;
};

function CloseIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M1.9373 12.7368L0.737305 11.5368L5.5373 6.73682L0.737305 1.93682L1.9373 0.736816L6.7373 5.53682L11.5373 0.736816L12.7373 1.93682L7.9373 6.73682L12.7373 11.5368L11.5373 12.7368L6.7373 7.93682L1.9373 12.7368Z"
        fill="white"
        fillOpacity={0.9}
      />
    </Svg>
  );
}

function AppleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
        fill="#ffffff"
      />
    </Svg>
  );
}

function GoogleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
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

function InstagramIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.8}>
      <Rect x={2} y={2} width={20} height={20} rx={5} ry={5} />
      <Circle cx={12} cy={12} r={4} stroke="#ffffff" fill="none" strokeWidth={1.8} />
      <Circle cx={18} cy={6} r={1.5} fill="#ffffff" />
    </Svg>
  );
}

function XIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="#ffffff">
      <Path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </Svg>
  );
}

export function LoginModal({
  visible,
  onClose,
  onApple,
  onGoogle,
  onInstagram,
  onX,
  privacyUrl = 'https://example.com/privacy',
  termsUrl = 'https://example.com/terms',
}: LoginModalProps) {
  const insets = useSafeAreaInsets();

  const handlePrivacy = () => Linking.openURL(privacyUrl).catch(() => {});
  const handleTerms = () => Linking.openURL(termsUrl).catch(() => {});

  const buttons = [
    { key: 'apple', label: 'Apple', Icon: AppleIcon, onPress: onApple },
    { key: 'google', label: 'Google', Icon: GoogleIcon, onPress: onGoogle },
    { key: 'instagram', label: 'Instagram', Icon: InstagramIcon, onPress: onInstagram },
    { key: 'x', label: 'X', Icon: XIcon, onPress: onX },
  ];

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
            { paddingBottom: insets.bottom + 24 },
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderWidth: 0.5,
    borderColor: COLORS.panelBorder,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.closeBtnBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPlaceholder: {
    width: 36,
    height: 36,
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
    borderColor: COLORS.buttonBorder,
    paddingHorizontal: 16,
  },
  buttonIcon: {
    position: 'absolute',
    left: 16,
    width: 24,
    height: 24,
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
  },
});
