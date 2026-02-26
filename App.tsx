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
import { initGoogleSignIn } from './src/services/thirdPartyAuth';
import { loadAuth } from './src/services/authStorage';

function App() {
  const systemDark = useColorScheme() === 'dark';
  const setDarkMode = useAppStore(state => state.setDarkMode);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    setDarkMode(systemDark);
  }, [systemDark, setDarkMode]);

  useEffect(() => {
    initGoogleSignIn();
  }, []);

  useEffect(() => {
    loadAuth()
      .then(data => {
        if (data) {
          setAuthToken(data.token);
          useUserStore.getState().login(data.token, data.user);
        }
      })
      .catch(() => {});
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
