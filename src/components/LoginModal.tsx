import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import { PromptCloseIcon } from '../utils';
import { dp, hp } from '../utils/scale';
import { useAppStore } from '../store';
import type { RootStackParamList } from '../routes/types';

const LOGIN_ICON_APPLE = require('../assets/login/apply-icon.png');
const LOGIN_ICON_GOOGLE = require('../assets/login/google-icon.png');
const LOGIN_ICON_X = require('../assets/login/x-icon.png');

const LOGIN_ICON_SIZE = 24;

// 设计稿配色：深色主题、青绿链接色
const COLORS = {
  backdrop: 'rgba(0,0,0,0.35)',
  panel: '#050A14',
  panelBorder: 'transparent',
  // 关闭按钮需要“两色”：中间更深，外圈有一圈描边
  closeBtnBg: '#0d1117',
  closeBtnBorder: 'rgba(110, 118, 129, 0.35)',
  title: '#ffffff',
  // 副标题与条款引导文案（与设计稿一致）
  subtitle: '#3A4A65',
  buttonBg: '#09111F',
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
  onAccountPassword?: () => void;
  onFacebook?: () => void;
  onInstagram?: () => void;
  onX?: () => void;
  onTikTok?: () => void;
  privacyUrl?: string;
  termsUrl?: string;
};

export function LoginModal({
  visible,
  onClose,
  onApple,
  onGoogle,
  onAccountPassword,
  onX,
  privacyUrl = 'https://www.petsgo.ai/privacyPolicy.html',
  termsUrl = 'https://www.petsgo.ai/termsService.html',
}: LoginModalProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const socialLoginSubmitting = useAppStore(s => s.socialLoginSubmitting);
  const panelTranslateY = useRef(new Animated.Value(48)).current;
  const closingRef = useRef(false);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.timing(panelTranslateY, {
      toValue: 48,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      closingRef.current = false;
      onClose();
    });
  }, [onClose, panelTranslateY]);

  useEffect(() => {
    if (!visible) return;
    closingRef.current = false;
    panelTranslateY.setValue(48);
    Animated.timing(panelTranslateY, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [panelTranslateY, visible]);

  const openInnerWebView = useCallback(
    (url: string, title: RootStackParamList['WebView']['title']) => {
      requestClose();
      setTimeout(() => {
        navigation.navigate('WebView', { url, title });
      }, 200);
    },
    [navigation, requestClose]
  );

  const handlePrivacy = useCallback(() => {
    openInnerWebView(privacyUrl, 'Privacy Policy');
  }, [openInnerWebView, privacyUrl]);

  const handleTerms = useCallback(() => {
    openInnerWebView(termsUrl, 'Terms of Service');
  }, [openInnerWebView, termsUrl]);

  const handleOpenAccountPassword = useCallback(() => {
    requestClose();
    setTimeout(() => {
      onAccountPassword?.();
    }, 200);
  }, [onAccountPassword, requestClose]);

  const buttons = [
    {
      key: 'apple',
      cta: 'Continue with Apple',
      iconSource: LOGIN_ICON_APPLE,
      onPress: onApple,
    },
    {
      key: 'google',
      cta: 'Continue with Google',
      iconSource: LOGIN_ICON_GOOGLE,
      onPress: onGoogle,
    },
    // { key: 'facebook', label: 'Facebook', Icon: FacebookIcon, onPress: onFacebook },
    // { key: 'instagram', label: 'Instagram', Icon: InstagramIcon, onPress: onInstagram },
    { key: 'x', cta: 'Continue with X', iconSource: LOGIN_ICON_X, onPress: onX },
    {
      key: 'account',
      cta: 'Use account & password',
      textIcon: '@',
      onPress: handleOpenAccountPassword,
    },
    // { key: 'tiktok', label: 'TikTok', Icon: TikTokIcon, onPress: onTikTok },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={requestClose}
    >
      <View style={styles.backdrop}>
        {/* 背景模糊层（解决“背景模糊效果有瑕疵”） */}
        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={4} />
        <View style={styles.backdropOverlay} />
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={requestClose} />
        <Animated.View
          style={[
            styles.panel,
            {
              paddingBottom: insets.bottom + 24,
              transform: [{ translateY: panelTranslateY }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View pointerEvents="none" style={styles.panelTopRim} />
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={requestClose}
              activeOpacity={0.8}
            >
              <PromptCloseIcon />
            </TouchableOpacity>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>Log In</Text>
              <Text style={styles.subtitle}>Turn Your Pets Into Superstar</Text>
            </View>
          </View>

          <View style={styles.buttons}>
            {buttons.map(({ key, cta, iconSource, onPress, textIcon }) => (
              <TouchableOpacity
                key={key}
                style={styles.button}
                activeOpacity={0.8}
                onPress={onPress}
              >
                <View style={styles.buttonIcon}>
                  {iconSource ? (
                    <Image
                      source={iconSource}
                      style={styles.loginProviderIcon}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.buttonIconText}>{textIcon}</Text>
                  )}
                </View>
                <Text style={styles.buttonText}>{cta}</Text>
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
        </Animated.View>
        {socialLoginSubmitting ? (
          <View
            style={[StyleSheet.absoluteFillObject, styles.submittingLayer]}
            pointerEvents="auto"
            accessibilityLabel="Logging in..."
          >
            <View style={styles.submittingCard}>
              <ActivityIndicator size="large" color="#58a6ff" />
              <Text style={styles.submittingText}>Logging in...</Text>
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
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(24),
    // minHeight: hp(56),
  },
  closeBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.closeBtnBg,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: dp(24),
    fontWeight: 700,
    color: COLORS.title,
    marginBottom: hp(8),
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: dp(14),
    fontWeight: 400,
    color: COLORS.subtitle,
    textAlign: 'center',
    width: '100%',
  },
  buttons: {
    gap: dp(8),
    marginBottom: hp(40),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: hp(48),
    backgroundColor: COLORS.buttonBg,
    borderRadius: dp(12),
    borderWidth: 0.5,
    borderColor: 'rgba(0, 255, 255, 0.20)',
    paddingHorizontal: dp(12),
    overflow: 'hidden',
  },
  buttonIcon: {
    position: 'absolute',
    left: dp(12),
    width: LOGIN_ICON_SIZE,
    height: LOGIN_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginProviderIcon: {
    width: LOGIN_ICON_SIZE,
    height: LOGIN_ICON_SIZE,
  },
  buttonIconText: {
    fontSize: dp(16),
    fontWeight: '600',
    color: COLORS.buttonText,
  },
  buttonText: {
    fontSize: dp(16),
    fontWeight: 400,
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
