import { useRoute, RouteProp } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { RootStackParamList } from '../routes/types';

type WebViewRoute = RouteProp<RootStackParamList, 'WebView'>;

/** 与设置内协议 / About 等页、个人页深色背景一致 */
const WEBVIEW_LOADING_BG = '#050A14';
/** 与个人页、登录流程里大号菊花配色一致 */
const WEBVIEW_LOADING_SPINNER = '#58a6ff';

export function WebViewScreen() {
  const route = useRoute<WebViewRoute>();
  const { url } = route.params;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={WEBVIEW_LOADING_SPINNER} />
          </View>
        )}
        scalesPageToFit
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WEBVIEW_LOADING_BG,
  },
  webview: {
    flex: 1,
    backgroundColor: WEBVIEW_LOADING_BG,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: WEBVIEW_LOADING_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
