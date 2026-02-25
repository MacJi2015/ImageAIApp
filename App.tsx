/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useAppStore } from './src/store';
import { RootNavigator } from './src/routes';

function App() {
  const systemDark = useColorScheme() === 'dark';
  const setDarkMode = useAppStore(state => state.setDarkMode);

  useEffect(() => {
    setDarkMode(systemDark);
  }, [systemDark, setDarkMode]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#050a14" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
