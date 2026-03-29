import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

type LoginSubmittingOverlayProps = {
  visible: boolean;
  /** 可选提示，默认「登录中…」 */
  message?: string;
};

export function LoginSubmittingOverlay({ visible, message = '登录中…' }: LoginSubmittingOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#58a6ff" />
          <Text style={styles.text}>{message}</Text>
        </View>
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
    backgroundColor: '#1a2332',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    color: '#e6edf3',
    fontSize: 15,
  },
});
