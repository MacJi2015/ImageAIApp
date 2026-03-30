import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';

type LoginSubmittingOverlayProps = {
  visible: boolean;
  /** 可选提示，默认「登录中…」 */
  message?: string;
};

export function LoginSubmittingOverlay({ visible, message = '登录中…' }: LoginSubmittingOverlayProps) {
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    cardScale.setValue(0.95);
    cardOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, cardScale, visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
          <ActivityIndicator size="large" color="#58a6ff" />
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    minWidth: 200,
    paddingVertical: 28,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: '#050A14',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    color: '#e6edf3',
    fontSize: 15,
  },
});
