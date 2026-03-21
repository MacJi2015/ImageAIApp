import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/Home';
import { MyScreen } from '../screens/MyScreen';
import { ChooseVideoModal } from '../screens/Details/components/ChooseVideoModal';
import type { MainTabParamList } from './types';

import homeDefaultIcon from '../assets/home-default-icon.png';
import homeSelectedIcon from '../assets/home-selected-icon.png';
import myDefaultIcon from '../assets/my-default-icon.png';
import mySelectedIcon from '../assets/my-selected-icon.png';
import publishIcon from '../assets/publish-icon.png';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ACCENT = '#00ffff';
const TAB_BAR_BLUR = 10;
const TAB_BAR_OVERLAY = 'rgba(5, 10, 20, 0.80)';

function TabBarBackground() {
  return (
    <>
      <BlurView style={tabBarBackgroundStyles.blur} blurType="dark" blurAmount={TAB_BAR_BLUR} />
      <View style={tabBarBackgroundStyles.overlay} />
    </>
  );
}
const tabBarBackgroundStyles = StyleSheet.create({
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TAB_BAR_OVERLAY,
  },
});

function HomeTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.tabIconWrap}>
      <View style={styles.tabIconSpacer} />
      <Image
        source={focused ? homeSelectedIcon : homeDefaultIcon}
        style={styles.tabIconImage}
        resizeMode="contain"
      />
      <View style={[styles.tabIconDotPlaceholder, focused && styles.tabIconDot]} />
    </View>
  );
}

function PublishTabIcon() {
  return (
    <View style={styles.publishOuter}>
      <View style={styles.publishWrap}>
        <Image source={publishIcon} style={styles.publishIcon} resizeMode="contain" />
      </View>
    </View>
  );
}

function MyTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.tabIconWrap}>
      <View style={styles.tabIconSpacer} />
      <Image
        source={focused ? mySelectedIcon : myDefaultIcon}
        style={styles.tabIconImage}
        resizeMode="contain"
      />
      <View style={[styles.tabIconDotPlaceholder, focused && styles.tabIconDot]} />
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
  const navigation = useNavigation();
  const [addModalVisible, setAddModalVisible] = React.useState(false);
  const tabBarHeight = 56 + Math.max(insets.bottom, 8);

  const handleAddTabPress = () => {
    setAddModalVisible(true);
  };

  const handleImageSelected = (asset: { uri?: string }, uploadedUrl?: string) => {
    setAddModalVisible(false);
    if (asset?.uri) {
      (navigation as any).navigate('CustomPrompt', {
        imageUri: asset.uri,
        petImageUrl: uploadedUrl,
      });
    }
  };

  return (
    <>
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
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: TabBarBackground,
        tabBarItemStyle: {
          paddingVertical: 8,
          alignItems: 'center',
          justifyContent: 'flex-start',
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
        component={()=><View/>}
        options={{
          title: 'Add',
          tabBarIcon: renderPublishIcon,
          tabBarButton: (props) => (
            <Pressable
              {...(props as object)}
              onPress={handleAddTabPress}
            />
          ),
        }}
      />
      <Tab.Screen
        name="My"
        component={MyScreen}
        options={{
          title: 'My',
          headerShown: false,
          tabBarIcon: renderMyIcon,
        }}
      />
    </Tab.Navigator>
    <ChooseVideoModal
      visible={addModalVisible}
      onClose={() => setAddModalVisible(false)}
      onChooseGallery={handleImageSelected}
      onTakePhoto={handleImageSelected}
    />
  </>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tabIconSpacer: {
    height: 4,
  },
  tabIconImage: {
    width: 32,
    height: 32,
  },
  tabIconDotPlaceholder: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tabIconDot: {
    backgroundColor: ACCENT,
  },
  publishOuter: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishIcon: {
    width: 48,
    height: 48,
  },
});
