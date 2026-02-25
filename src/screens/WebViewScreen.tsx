import { useRoute, RouteProp } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { RootStackParamList } from '../routes/types';

type WebViewRoute = RouteProp<RootStackParamList, 'WebView'>;

export function WebViewScreen() {
  const route = useRoute<WebViewRoute>();
  const { url } = route.params;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        startInLoadingState
        scalesPageToFit
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
