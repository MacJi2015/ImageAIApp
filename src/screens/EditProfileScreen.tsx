import { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../store';

const defaultAvatar = require('../assets/my/topimage.png');
const imgselectedIcon = require('../assets/my/imgselected.png');

const BG = '#0f1419';
const INPUT_BG = 'rgba(48, 62, 87, 0.4)';
const TEXT_MAIN = '#ffffff';
const TEXT_MUTED = '#8b949e';
const SAVE_BG = '#22c4c4';
const ACCENT_CYAN = '#00d4ff';
const MODAL_BG = '#0f1419';
const CARD_BG = 'rgba(26, 35, 50, 0.95)';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useUserStore(state => state.user);
  const setUser = useUserStore(state => state.setUser);

  const [username, setUsername] = useState(user?.name ?? 'SpacePup');
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  useEffect(() => {
    setUsername(user?.name ?? 'SpacePup');
  }, [user?.name]);

  const avatarUri = user?.avatar;

  const handleSave = () => {
    const trimmed = username.trim() || 'SpacePup';
    setUser(user ? { ...user, name: trimmed } : { id: '1', name: trimmed });
    navigation.goBack();
  };

  const setAvatarUri = (uri: string) => {
    setUser(user ? { ...user, avatar: uri } : { id: '1', name: 'SpacePup', avatar: uri });
  };

  const openGallery = () => {
    setShowAvatarModal(false);
    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 1 },
      res => {
        if (res.didCancel) return;
        if (res.errorCode) {
          Alert.alert('提示', res.errorMessage ?? '无法打开相册');
          return;
        }
        const uri = res.assets?.[0]?.uri;
        if (uri) setAvatarUri(uri);
      }
    );
  };

  const openCamera = () => {
    setShowAvatarModal(false);
    launchCamera(
      { mediaType: 'photo', saveToPhotos: false },
      res => {
        if (res.didCancel) return;
        if (res.errorCode) {
          Alert.alert('提示', res.errorMessage ?? '无法打开相机');
          return;
        }
        const uri = res.assets?.[0]?.uri;
        if (uri) setAvatarUri(uri);
      }
    );
  };

  const onCameraPress = () => setShowAvatarModal(true);

  return (
    <>
      <Modal
        visible={showAvatarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAvatarModal(false)}
        >
          <Pressable style={styles.modalDialog} onPress={e => e.stopPropagation()}>
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setShowAvatarModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </Pressable>
            <Pressable style={styles.modalOptionCard} onPress={openGallery}>
              <Text style={styles.modalOptionIcon}>🖼</Text>
              <View style={styles.modalOptionTextWrap}>
                <Text style={styles.modalOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.modalOptionSubtitle}>Browse files</Text>
              </View>
            </Pressable>
            <Pressable style={styles.modalOptionCard} onPress={openCamera}>
              <Text style={styles.modalOptionIcon}>📷</Text>
              <View style={styles.modalOptionTextWrap}>
                <Text style={styles.modalOptionTitle}>Take a Photo</Text>
                <Text style={styles.modalOptionSubtitle}>Use Camera</Text>
              </View>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <KeyboardAvoidingView
        style={[styles.container, { paddingBottom: insets.bottom }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.content}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Image source={defaultAvatar} style={styles.avatarImage} resizeMode="cover" />
            )}
          </View>
          <Pressable style={styles.cameraBtn} onPress={onCameraPress}>
            <Image source={imgselectedIcon} style={styles.cameraIconImage} resizeMode="contain" />
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
        />
      </View>

      <Pressable
        style={[styles.saveBtn, { marginBottom: insets.bottom + 40 }]}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnText}>SAVE</Text>
      </Pressable>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    paddingTop: 24,
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
    backgroundColor: SAVE_BG,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'Space Grotesk',
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: MODAL_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ACCENT_CYAN,
    padding: 20,
    paddingTop: 44,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(48, 62, 87, 0.6)',
    borderWidth: 1,
    borderColor: ACCENT_CYAN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: TEXT_MAIN,
    fontSize: 18,
    fontWeight: '600',
  },
  modalOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ACCENT_CYAN,
    padding: 16,
    marginBottom: 12,
  },
  modalOptionIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  modalOptionTextWrap: {
    flex: 1,
  },
  modalOptionTitle: {
    fontFamily: 'Space Grotesk',
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  modalOptionSubtitle: {
    fontFamily: 'Space Grotesk',
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 2,
  },
});
