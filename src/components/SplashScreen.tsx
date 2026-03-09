/**
 * 启动页：深色背景 + 中间展示 unusualimage.png（Pets Tales 品牌图）
 * 作为 App 首屏展示；带 message/buttonText 时也可用于网络错误、加载失败等异常态
 */
import React from 'react';
import { Image, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const unusualImage = require('../assets/unusualimage.png');

const BG = '#0a0e14';
const TEXT_MUTED = '#8b949e';

export interface SplashScreenProps {
  /** 主图下方的说明文案，不传则不显示 */
  message?: string;
  /** 按钮文案，不传则不显示按钮 */
  buttonText?: string;
  /** 点击按钮回调，如进入首页或返回 */
  onPress?: () => void;
}

export function SplashScreen({ message, buttonText, onPress }: SplashScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.center}>
        <Image source={unusualImage} style={styles.image} resizeMode="contain" />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {buttonText && onPress ? (
          <Pressable style={styles.btn} onPress={onPress}>
            <Text style={styles.btnText}>{buttonText}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '85%',
  },
  image: {
    width: 200,
    height: 120,
  },
  message: {
    fontFamily: 'Space Grotesk',
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 24,
    textAlign: 'center',
  },
  btn: {
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(88, 166, 255, 0.25)',
  },
  btnText: {
    fontFamily: 'Space Grotesk',
    fontSize: 15,
    fontWeight: '600',
    color: '#58a6ff',
  },
});
