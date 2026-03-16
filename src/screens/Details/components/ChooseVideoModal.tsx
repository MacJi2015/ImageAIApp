import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  type Asset,
  launchCamera,
  launchImageLibrary,
  type CameraOptions,
  type ImageLibraryOptions,
} from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { uploadImage } from '../../../api/services/upload';
import CameraIcon from '../../../assets/details/camera.svg';
import PhotoIcon from '../../../assets/details/photo.svg';
import CloseIcon from '../../../assets/details/close-icon.svg';

const COLORS = { bg: '#050a14', card: '#09111f', accent: '#00ffff', muted: '#3a4a65' };

export type ChooseVideoModalProps = {
  visible: boolean;
  onClose: () => void;
  /** asset: 选中的图片；uploadedUrl: 上传后的图片 URL，用于图生视频接口 */
  onChooseGallery?: (asset: Asset, uploadedUrl?: string) => void;
  onTakePhoto?: (asset: Asset, uploadedUrl?: string) => void;
};

export function ChooseVideoModal({
  visible,
  onClose,
  onChooseGallery,
  onTakePhoto,
}: ChooseVideoModalProps) {
  const insets = useSafeAreaInsets();
  const [uploading, setUploading] = useState(false);

  const handleUploadAndCallback = async (asset: Asset, callback?: (a: Asset, url?: string) => void) => {
    if (!asset.uri || !callback) return;
    setUploading(true);
    try {
      // const result = await uploadImage(asset.uri, 'pet');
      // callback(asset, result.url);
      callback(asset, 'https://tiantaiapp.oss-cn-hangzhou.aliyuncs.com/static/image.png');
      onClose();
    } catch (e) {
      __DEV__ && console.warn('[ChooseVideoModal] upload failed', e);
      Alert.alert('上传失败', '请确认已登录后重试');
    } finally {
      setUploading(false);
    }
  };

  const handleChooseGallery = () => {
    const options: ImageLibraryOptions = { mediaType: 'photo', selectionLimit: 1 };
    launchImageLibrary(options, (res) => {
      if (res.didCancel || res.errorCode || !res.assets?.[0]) return;
      handleUploadAndCallback(res.assets[0], onChooseGallery);
    });
  };

  const handleTakePhoto = () => {
    const options: CameraOptions = { mediaType: 'photo', cameraType: 'back', saveToPhotos: true };
    launchCamera(options, (res) => {
      if (res.didCancel || res.errorCode || !res.assets?.[0]) return;
      handleUploadAndCallback(res.assets[0], onTakePhoto);
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.panel,
            {
              paddingBottom: insets.bottom + 24,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <CloseIcon width={14} height={14} />
            </TouchableOpacity>
            <Text style={styles.title}>Create Video</Text>
            <View style={styles.closeBtn} />
          </View>

          <TouchableOpacity
            style={styles.optionRow}
            activeOpacity={0.8}
            onPress={handleChooseGallery}
          >
            <View style={styles.optionIconWrap}>
              <PhotoIcon width={24} height={24} />
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>Choose from Gallery</Text>
              <Text style={styles.optionSub}>Browse files</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            activeOpacity={0.8}
            onPress={handleTakePhoto}
          >
            <View style={styles.optionIconWrap}>
              <CameraIcon width={24} height={24} />
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>Take a Photo</Text>
              <Text style={styles.optionSub}>Use Camera</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  uploadingText: {
    color: COLORS.accent,
    fontSize: 14,
    marginTop: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(0,255,255,0.2)',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0,255,255,0.2)',
    paddingLeft: 12,
    marginBottom: 8,
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: 'rgba(0,255,255,0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(0,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#ffffff',
    marginBottom: 2,
  },
  optionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.muted,
  },
});
