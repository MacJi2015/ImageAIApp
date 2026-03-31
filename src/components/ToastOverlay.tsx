import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store';

export type ToastOverlayProps = {
  /** 默认 1600ms */
  durationMs?: number;
};

export function ToastOverlay({ durationMs = 1600 }: ToastOverlayProps) {
  const insets = useSafeAreaInsets();
  const toastMessage = useAppStore(s => s.toastMessage);
  const toastEpoch = useAppStore(s => s.toastEpoch);
  const clearToast = useAppStore(s => s.clearToast);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visibleText, setVisibleText] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setVisibleText(toastMessage);
    opacity.setValue(0);
    translateY.setValue(6);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 6, duration: 140, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) {
          setVisibleText(null);
          clearToast();
        }
      });
      timerRef.current = null;
    }, durationMs);
  }, [toastEpoch, toastMessage, clearToast, durationMs, opacity, translateY]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visibleText) return null;

  return (
    <View pointerEvents="none" style={[styles.layer, { paddingBottom: insets.bottom }]}>
      <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>
        <Text style={styles.text}>{visibleText}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingVertical: 18,
    minWidth: 260,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Space Grotesk',
    textAlign: 'center',
  },
});

