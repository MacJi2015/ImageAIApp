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
import { BlurView } from '@react-native-community/blur';
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
import { PromptCloseIcon } from '../../../utils';
import { dp, hp } from '../../../utils/scale';

const COLORS = {
  /** 接近纯黑的深底 */
  panel: '#020308',
  /** 比面板略亮一档的选项区 */
  optionCard: '#0b121c',
  accent: '#00ffff',
  subtitle: '#4a5d7a',
  closeBg: 'rgba(255,255,255,0.05)',
  closeBorder: 'rgba(255,255,255,0.1)',
  optionBorder: 'rgba(0, 255, 255, 0.2)',
};

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
      const result = await uploadImage(asset.uri, 'pet');
      callback(asset, result.url);
      // callback(asset, 'https://tiantaiapp.oss-cn-hangzhou.aliyuncs.com/static/image.png');
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
        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={4} />
        <View style={styles.backdropOverlay} />
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
          <View pointerEvents="none" style={styles.panelTopRim} />
          <View style={styles.header}>
            <View style={styles.headerLeading}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <PromptCloseIcon />
              </TouchableOpacity>
            </View>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.title} numberOfLines={1}>
                Create Video
              </Text>
            </View>
            <View style={styles.headerTrailing} />
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
    fontWeight: '500',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  panel: {
    backgroundColor: COLORS.panel,
    borderTopLeftRadius: dp(32),
    borderTopRightRadius: dp(32),
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  panelTopRim: {
    position: 'absolute',
    left: 0.5,
    right: 0.5,
    top: -0.5,
    height: hp(32),
    borderTopLeftRadius: dp(32),
    borderTopRightRadius: dp(32),
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,255,255,0.1)',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  /** 与关闭按钮同宽，保证标题在中间列 flex:1 内真正居中 */
  headerLeading: {
    width: 34,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 0,
  },
  headerTrailing: {
    width: 34,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.closeBg,
    borderWidth: 0.5,
    borderColor: COLORS.closeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Space Grotesk',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 84,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: COLORS.optionCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.optionBorder,
    marginBottom: 12,
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    marginLeft: 14,
    flex: 1,
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 11,
    fontFamily: 'Space Grotesk',
  },
  optionSub: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.subtitle,
    fontFamily: 'Space Grotesk',
    lineHeight: 18,
  },
});
