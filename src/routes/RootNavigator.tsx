import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, Text } from 'react-native';
import { MainTabs } from './MainTabs';
import { DetailsScreen } from '../screens/Details';
import { SettingsScreen } from '../screens/SettingsScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { WebViewScreen } from '../screens/WebViewScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: { backgroundColor: '#f5f5f5' },
        headerTintColor: '#333',
        headerTitleStyle: { fontFamily: 'Space Grotesk', fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false, title: '' }}
      />
      <Stack.Screen name="Detail" component={DetailsScreen}  options={{ headerShown: false }} />
    
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={({ navigation }) => ({
          title: 'Settings',
          headerLeft: () => (
            <Pressable onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: 4 }}>
              <Text style={{ fontFamily: 'Space Grotesk', color: '#fff', fontSize: 22 }}>←</Text>
            </Pressable>
          ),
          headerStyle: { backgroundColor: '#0f1419' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        })}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={({ navigation }) => ({
          title: 'Edit',
          headerLeft: () => (
            <Pressable onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: 4 }}>
              <Text style={{ fontFamily: 'Space Grotesk', color: '#fff', fontSize: 22 }}>←</Text>
            </Pressable>
          ),
          headerStyle: { backgroundColor: '#0f1419' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        })}
      />
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={({ route }) => ({
          title: route.params.title,
          headerStyle: { backgroundColor: '#0f1419' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        })}
      />
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={({ navigation }) => ({
          title: 'Feedback',
          headerLeft: () => (
            <Pressable onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: 4 }}>
              <Text style={{ fontFamily: 'Space Grotesk', color: '#fff', fontSize: 22 }}>←</Text>
            </Pressable>
          ),
          headerStyle: { backgroundColor: '#0f1419' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        })}
      />
    </Stack.Navigator>
  );
}
