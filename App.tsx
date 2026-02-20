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
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const setDarkMode = useAppStore(state => state.setDarkMode);

  useEffect(() => {
    setDarkMode(systemDark);
  }, [systemDark, setDarkMode]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
