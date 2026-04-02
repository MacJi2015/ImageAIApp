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
import BootSplash from 'react-native-bootsplash';
import { useAppStore, useUserStore } from './src/store';
import { setAuthToken } from './src/api/request';
import { DEV_HARDCODED_AUTH_TOKEN } from './src/api/config';
import { RootNavigator } from './src/routes';
import { initGoogleSignIn, initFacebookSdk } from './src/services/thirdPartyAuth';
import { loadAuth } from './src/services/authStorage';

const MIN_BOOTSPLASH_MS = 2000;

function App() {
  const systemDark = useColorScheme() === 'dark';
  const setDarkMode = useAppStore(state => state.setDarkMode);
  const setAuthHydrated = useAppStore(state => state.setAuthHydrated);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    setDarkMode(systemDark);
  }, [systemDark, setDarkMode]);

  useEffect(() => {
    const startedAt = Date.now();

    async function bootstrap() {
      try {
        initGoogleSignIn();
        initFacebookSdk();

        const data = await loadAuth();
        const useDevToken = __DEV__ && DEV_HARDCODED_AUTH_TOKEN.length > 0;
        const token = useDevToken ? DEV_HARDCODED_AUTH_TOKEN : data?.token ?? null;
        const user =
          token &&
          (useDevToken
            ? data?.user?.id
              ? data.user
              : { id: '0', name: 'User' }
            : data?.user);
        if (token && user) {
          setAuthToken(token);
          useUserStore.getState().login(token, user);
        } else {
          setAuthToken(null);
          useUserStore.getState().logout();
        }
      } catch {
        setAuthToken(null);
        useUserStore.getState().logout();
      } finally {
        setAuthHydrated(true);
        const elapsed = Date.now() - startedAt;
        const remain = Math.max(0, MIN_BOOTSPLASH_MS - elapsed);
        setTimeout(() => {
          BootSplash.hide({ fade: true }).catch(() => {});
        }, remain);
      }
    }

    bootstrap();
  }, [setAuthHydrated]);

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
