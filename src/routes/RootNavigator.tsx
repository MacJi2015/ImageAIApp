import { useEffect, useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Linking, Pressable, Text } from 'react-native';
import { MainTabs } from './MainTabs';
import { DetailsScreen } from '../screens/Details';
import { SettingsScreen } from '../screens/SettingsScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { WebViewScreen } from '../screens/WebViewScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { LoginModal, ShareModal } from '../components';
import { useAppStore } from '../store';
import {
  loginWithApple,
  loginWithGoogle,
  getInstagramAuthUrl,
  getXAuthUrl,
  exchangeWithIdToken,
} from '../services/thirdPartyAuth';
import {
  shareToFacebook,
  shareToInstagram,
  shareToX,
  shareToTikTok,
} from '../services/shareToSocial';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** OAuth 回调：imageai://auth/instagram?token=xxx 或 imageai://auth/x?token=xxx（Firebase idToken） */
const AUTH_DEEP_LINK_PREFIX = 'imageai://auth/';

function parseAuthCallbackUrl(url: string): { loginFrom: 7 | 8; idToken: string } | null {
  if (!url.startsWith(AUTH_DEEP_LINK_PREFIX)) return null;
  const path = url.slice(AUTH_DEEP_LINK_PREFIX.length);
  const [provider, query] = path.split('?');
  if (!query) return null;
  const params = new URLSearchParams(query);
  const token = params.get('token');
  if (!token) return null;
  if (provider === 'instagram') return { loginFrom: 7, idToken: token }; // Meta
  if (provider === 'x') return { loginFrom: 8, idToken: token };           // Twitter(X)
  return null;
}

type RootNavigatorProps = {
  navigationRef: React.RefObject<{
    navigate: (name: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]) => void;
    goBack: () => void;
    isReady: () => boolean;
  } | null>;
};

export function RootNavigator({ navigationRef }: RootNavigatorProps) {
  const showLoginModal = useAppStore(s => s.showLoginModal);
  const closeLoginModal = useAppStore(s => s.closeLoginModal);
  const showShareModal = useAppStore(s => s.showShareModal);
  const closeShareModal = useAppStore(s => s.closeShareModal);
  const sharePayload = useAppStore(s => s.sharePayload);

  const handleApple = useCallback(async () => {
    const ok = await loginWithApple();
    if (ok) closeLoginModal();
  }, [closeLoginModal]);

  const handleGoogle = useCallback(async () => {
    const ok = await loginWithGoogle();
    if (ok) closeLoginModal();
  }, [closeLoginModal]);

  const handleInstagram = useCallback(async () => {
    const url = await getInstagramAuthUrl();
    if (url) {
      closeLoginModal();
      navigationRef.current?.navigate('WebView', { url, title: 'Instagram' });
    }
  }, [closeLoginModal, navigationRef]);

  const handleX = useCallback(async () => {
    const url = await getXAuthUrl();
    if (url) {
      closeLoginModal();
      navigationRef.current?.navigate('WebView', { url, title: 'X' });
    }
  }, [closeLoginModal, navigationRef]);

  useEffect(() => {
    const onUrl = async (event: { url: string }) => {
      const parsed = parseAuthCallbackUrl(event.url);
      if (!parsed) return;
      const ok = await exchangeWithIdToken(parsed.loginFrom, parsed.idToken);
      if (ok && navigationRef.current?.isReady()) navigationRef.current?.goBack();
    };
    const sub = Linking.addEventListener('url', onUrl);
    Linking.getInitialURL().then(url => {
      if (url) onUrl({ url });
    });
    return () => sub.remove();
  }, [navigationRef]);

  return (
    <>
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
    <LoginModal
      visible={showLoginModal}
      onClose={closeLoginModal}
      onApple={handleApple}
      onGoogle={handleGoogle}
      onInstagram={handleInstagram}
      onX={handleX}
    />
    <ShareModal
      visible={showShareModal}
      onClose={closeShareModal}
      payload={sharePayload}
      onFacebook={shareToFacebook}
      onInstagram={shareToInstagram}
      onX={shareToX}
      onTikTok={shareToTikTok}
    />
    </>
  );
}
