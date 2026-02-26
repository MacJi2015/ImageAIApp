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
  TouchableOpacity,
  View,
} from 'react-native';
import CloseIcon from '../assets/details/close-icon.svg';
import CameraIcon from '../assets/details/camera.svg';
import PhotoIcon from '../assets/details/photo.svg';
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

const AVATAR_MODAL_COLORS = {
  card: '#09111f',
  accent: '#00ffff',
  muted: '#3a4a65',
};

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
        animationType="slide"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.avatarModalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowAvatarModal(false)}
          />
          <View
            style={[styles.avatarModalPanel, { paddingBottom: insets.bottom + 24 }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.avatarModalHeader}>
              <TouchableOpacity
                style={styles.avatarModalCloseBtn}
                onPress={() => setShowAvatarModal(false)}
                activeOpacity={0.8}
              >
                <CloseIcon width={14} height={14} />
              </TouchableOpacity>
              <View style={styles.avatarModalCloseBtn} />
            </View>

            <TouchableOpacity
              style={styles.avatarModalOptionRow}
              activeOpacity={0.8}
              onPress={openGallery}
            >
              <View style={styles.avatarModalOptionIconWrap}>
                <PhotoIcon width={24} height={24} />
              </View>
              <View style={styles.avatarModalOptionTextWrap}>
                <Text style={styles.avatarModalOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.avatarModalOptionSub}>Browse files</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarModalOptionRow}
              activeOpacity={0.8}
              onPress={openCamera}
            >
              <View style={styles.avatarModalOptionIconWrap}>
                <CameraIcon width={24} height={24} />
              </View>
              <View style={styles.avatarModalOptionTextWrap}>
                <Text style={styles.avatarModalOptionTitle}>Take a Photo</Text>
                <Text style={styles.avatarModalOptionSub}>Use Camera</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
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
  avatarModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  avatarModalPanel: {
    backgroundColor: AVATAR_MODAL_COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(0,255,255,0.2)',
    borderBottomWidth: 0,
  },
  avatarModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  avatarModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarModalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    backgroundColor: AVATAR_MODAL_COLORS.card,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0,255,255,0.2)',
    paddingLeft: 12,
    marginBottom: 8,
  },
  avatarModalOptionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: 'rgba(0,255,255,0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(0,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarModalOptionTextWrap: {
    marginLeft: 16,
  },
  avatarModalOptionTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#ffffff',
    marginBottom: 2,
  },
  avatarModalOptionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: AVATAR_MODAL_COLORS.muted,
  },
});
