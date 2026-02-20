import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../routes/types';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>首页</Text>
      <Button
        title="去详情页"
        onPress={() => navigation.navigate('Detail', { id: '1', title: '示例详情' })}
      />
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
    marginBottom: 20,
  },
});
