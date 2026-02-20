import { StyleSheet, Text, View } from 'react-native';

export function MyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>我的</Text>
      <Text style={styles.hint}>个人中心、设置等</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 12,
  },
  hint: {
    fontSize: 14,
    color: '#666',
  },
});
