import { StyleSheet, Text, View } from 'react-native';

export function AddScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>发布</Text>
      <Text style={styles.hint}>中间加号入口的页面</Text>
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
    fontFamily: 'Space Grotesk',
    fontSize: 24,
    marginBottom: 12,
  },
  hint: {
    fontFamily: 'Space Grotesk',
    fontSize: 14,
    color: '#666',
  },
});
