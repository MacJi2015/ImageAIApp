/**
 * @format
 * gesture-handler 必须在最顶部 import（React Navigation 推荐）
 */
import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens(true);

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
