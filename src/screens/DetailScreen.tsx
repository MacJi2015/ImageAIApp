import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Button, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../routes/types';

type DetailRoute = RouteProp<RootStackParamList, 'Detail'>;

export function DetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<DetailRoute>();
  const { id, title } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title ?? '详情'}</Text>
      <Text style={styles.id}>ID: {id}</Text>
      <Button title="返回" onPress={() => navigation.goBack()} />
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
  id: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
});
