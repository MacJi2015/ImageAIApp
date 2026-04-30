import { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { Asset } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../store';
import { updateProfile } from '../api/services/user';
import { ChooseVideoModal } from './Details/components/ChooseVideoModal';

const defaultAvatar = require('../assets/my/topimage.png');
const imgselectedIcon = require('../assets/my/imgselected.png');

const BG = '#050A14';
const INPUT_BG = 'rgba(48, 62, 87, 0.4)';
const TEXT_MAIN = '#ffffff';
const TEXT_MUTED = '#8b949e';
const SAVE_BG = '#00FFFF';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useUserStore(state => state.user);
  const setUser = useUserStore(state => state.setUser);
  const scrollRef = useRef<ScrollView>(null);

  const [username, setUsername] = useState(user?.name ?? 'SpacePup');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyboardPad] = useState(0);

  useEffect(() => {
    setUsername(user?.name ?? 'SpacePup');
  }, [user?.name]);

 

  const avatarUri = user?.avatar;

  const handleSave = async () => {
    Keyboard.dismiss();
    const trimmed = username.trim() || 'SpacePup';
    setSaving(true);
    try {
      await updateProfile({
        name: trimmed,
        userAvatar: user?.avatar ?? undefined,
      });
      const savedAvatar = user?.avatar;
      setUser(
        user
          ? { ...user, name: trimmed, avatar: savedAvatar }
          : { id: '1', name: trimmed, avatar: savedAvatar },
      );
      navigation.goBack();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '保存失败，请重试';
      Alert.alert('保存失败', msg, [{ text: '知道了' }]);
    } finally {
      setSaving(false);
    }
  };

  const setAvatarUri = (uri: string) => {
    setUser(user ? { ...user, avatar: uri } : { id: '1', name: 'SpacePup', avatar: uri });
  };

  const onAvatarChosen = (_asset: Asset, uploadedUrl?: string) => {
    if (uploadedUrl) setAvatarUri(uploadedUrl);
  };

  const onCameraPress = () => setShowAvatarModal(true);

  return (
    <>
      <ChooseVideoModal
        visible={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        headerTitle="Change Photo"
        onChooseGallery={onAvatarChosen}
        onTakePhoto={onAvatarChosen}
      />

      <View style={styles.container}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 + keyboardPad },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={styles.tapDismissArea} onPress={Keyboard.dismiss}>
            <View>
              <View style={styles.avatarWrap}>
                <View style={styles.avatarCircle}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <Image source={defaultAvatar} style={styles.avatarImage} resizeMode="cover" />
                  )}
                </View>
                <Pressable style={styles.cameraBtn} onPress={onCameraPress}>
                  <Image
                    source={imgselectedIcon}
                    style={styles.cameraIconImage}
                    resizeMode="contain"
                  />
                </Pressable>
              </View>

              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={TEXT_MUTED}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
                // onFocus={() => {
                //   setTimeout(scrollSaveIntoView, 100);
                // }}
              />

              <Pressable
                style={styles.saveBtn}
                onPress={() => {
                  handleSave().catch(() => {});
                }}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={TEXT_MAIN} />
                ) : (
                  <Text style={styles.saveBtnText}>SAVE</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  tapDismissArea: {
    width: '100%',
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: INPUT_BG,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconImage: {
    width: 28,
    height: 28,
  },
  label: {
    fontFamily: 'Space Grotesk',
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Space Grotesk',
    fontSize: 16,
    color: TEXT_MAIN,
  },
  saveBtn: {
    marginTop: 12,
    backgroundColor: SAVE_BG,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'Space Grotesk',
    fontSize: 16,
    fontWeight: '700',
    color: '#020410',
    letterSpacing: 0.5,
  },
});
