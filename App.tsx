/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { useAppStore, useUserStore } from './src/store';
import { setAuthToken } from './src/api/request';
import { RootNavigator } from './src/routes';
import { initGoogleSignIn, initFacebookSdk } from './src/services/thirdPartyAuth';
import { loadAuth } from './src/services/authStorage';

/** 无本地 token 时使用的写死 token，登录成功后会替换为后端返回的 token */
const DEFAULT_TOKEN =
  'oL8TR0BBZYtWb19Y2wpTTowL2U5b/Bv0PZCjdWiUIONtPjg4saQaFMxHFPJhQ1mntuVr0i+AsuFTT9b1IgpA+e1WRZNGM/XqAKyRspYwmYFLQ2NCeeQ0q4EEt6yn6QGK';

function App() {
  const systemDark = useColorScheme() === 'dark';
  const setDarkMode = useAppStore(state => state.setDarkMode);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    setDarkMode(systemDark);
  }, [systemDark, setDarkMode]);

  useEffect(() => {
    initGoogleSignIn();
    initFacebookSdk();
  }, []);

  useEffect(() => {
    loadAuth()
      .then(data => {
        if (data?.token) {
          setAuthToken(data.token);
          useUserStore.getState().login(data.token, data.user);
        } else {
          setAuthToken(DEFAULT_TOKEN);
        }
      })
      .catch(() => {
        setAuthToken(DEFAULT_TOKEN);
      });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#050a14" />
      <NavigationContainer ref={navigationRef}>
        <RootNavigator navigationRef={navigationRef} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
