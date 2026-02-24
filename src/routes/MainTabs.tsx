import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { AddScreen } from '../screens/AddScreen';
import { MyScreen } from '../screens/MyScreen';
import type { MainTabParamList } from './types';

import homeDefaultIcon from '../assets/home-default-icon.png';
import homeSelectedIcon from '../assets/home-selected-icon.png';
import myDefaultIcon from '../assets/my-default-icon.png';
import mySelectedIcon from '../assets/my-selected-icon.png';
import publishIcon from '../assets/publish-icon.png';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_BAR_BG = 'rgba(5, 10, 20, 0.92)';
const ACCENT = '#00ffff';

function HomeTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.tabIconWrap}>
      <Image
        source={focused ? homeSelectedIcon : homeDefaultIcon}
        style={styles.tabIconImage}
        resizeMode="contain"
      />
      {focused && <View style={styles.tabIconDot} />}
    </View>
  );
}

function PublishTabIcon() {
  return (
    <View style={styles.publishWrap}>
      <Image source={publishIcon} style={styles.publishIcon} resizeMode="contain" />
    </View>
  );
}

function MyTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.tabIconWrap}>
    <Image
      source={focused ? mySelectedIcon : myDefaultIcon}
      style={styles.tabIconImage}
      resizeMode="contain"
    />
    {focused && <View style={styles.tabIconDot} />}
    </View>
  );
}

function renderHomeIcon({ focused }: { focused: boolean }) {
  return <HomeTabIcon focused={focused} />;
}
function renderPublishIcon() {
  return <PublishTabIcon />;
}
function renderMyIcon({ focused }: { focused: boolean }) {
  return <MyTabIcon focused={focused} />;
}

export function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: '#4F5D75',
        tabBarStyle: {
          position: 'absolute',
          height: tabBarHeight,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: TAB_BAR_BG,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: renderHomeIcon,
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddScreen}
        options={{
          title: 'Add',
          tabBarIcon: renderPublishIcon,
        }}
      />
      <Tab.Screen
        name="My"
        component={MyScreen}
        options={{
          title: 'My',
          tabBarIcon: renderMyIcon,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconImage: {
    width: 28,
    height: 28,
  },
  tabIconDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACCENT,
    marginTop: 4,
  },
  publishWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  publishIcon: {
    width: 48,
    height: 48,
  },
});
