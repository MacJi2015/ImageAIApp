import React, { type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { dp } from '../../../utils/scale';

/** 详情顶栏：自定义圆底与「仅图标」占位同一外径，便于与系统圆底视觉对齐 */
export const DETAIL_NAV_ROUND_BTN_SIZE = dp(40);

const SIZE = DETAIL_NAV_ROUND_BTN_SIZE;

type Props = {
  onPress: () => void;
  children: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * 详情透明导航：圆形毛玻璃底 + 居中图标（仅非「液体玻璃」路径使用）。
 */
export function DetailNavGlassIconButton({ onPress, children, containerStyle }: Props) {
  return (
    <View style={containerStyle}>
      <View style={styles.outer}>
        {Platform.OS === 'ios' ? (
          <BlurView
            style={styles.blur}
            blurType="dark"
            blurAmount={5}
            reducedTransparencyFallbackColor="rgba(28, 28, 32, 0.2)"
            pointerEvents="none"
          />
        ) : (
          <View style={[styles.blur, styles.androidFill]} pointerEvents="none" />
        )}
        <View style={styles.tint} pointerEvents="none" />
        <Pressable
          onPress={onPress}
          style={styles.hitOverlay}
        >
          <View style={styles.iconSlot} pointerEvents="none">
            {children}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  androidFill: {
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  hitOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSlot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
