import { useState, useEffect } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../store';

const BG = '#0f1419';
const INPUT_BG = 'rgba(48, 62, 87, 0.4)';
const TEXT_MAIN = '#ffffff';
const TEXT_MUTED = '#8b949e';
const SAVE_BG = '#22c4c4';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useUserStore(state => state.user);
  const setUser = useUserStore(state => state.setUser);

  const [username, setUsername] = useState(user?.name ?? 'SpacePup');

  useEffect(() => {
    setUsername(user?.name ?? 'SpacePup');
  }, [user?.name]);

  const avatarUri = user?.avatar;

  const handleSave = () => {
    const trimmed = username.trim() || 'SpacePup';
    setUser(user ? { ...user, name: trimmed } : { id: '1', name: trimmed });
    navigation.goBack();
  };

  const onCameraPress = () => {
    // TODO: 选择/拍摄头像
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom + 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.content}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarPlaceholder}>👤</Text>
            )}
          </View>
          <Pressable style={styles.cameraBtn} onPress={onCameraPress}>
            <Text style={styles.cameraIcon}>📷</Text>
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

      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>SAVE</Text>
      </Pressable>
    </KeyboardAvoidingView>
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
  avatarPlaceholder: {
    fontSize: 56,
  },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BG,
    borderWidth: 2,
    borderColor: SAVE_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 20,
  },
  label: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
    letterSpacing: 0.5,
  },
});
