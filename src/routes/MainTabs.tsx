import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { AddScreen } from '../screens/AddScreen';
import { MyScreen } from '../screens/MyScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabBarPlusIcon() {
  return (
    <View style={styles.plusWrap}>
      <Text style={styles.plusText}>+</Text>
    </View>
  );
}

export function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#f5f5f5' },
        headerTintColor: '#333',
        headerTitleStyle: { fontWeight: '600' },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: { paddingBottom: Math.max(insets.bottom, 4) },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '首页',
          tabBarLabel: '首页',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>首页</Text>,
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddScreen}
        options={{
          title: '发布',
          tabBarLabel: '',
          tabBarIcon: () => <TabBarPlusIcon />,
        }}
      />
      <Tab.Screen
        name="My"
        component={MyScreen}
        options={{
          title: '我的',
          tabBarLabel: '我的',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>我的</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 20,
  },
  plusWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  plusText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 32,
  },
});
