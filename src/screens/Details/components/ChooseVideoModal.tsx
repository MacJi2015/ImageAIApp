import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CameraIcon from '../../../assets/details/camera.svg';
import PhotoIcon from '../../../assets/details/photo.svg';
import CloseIcon from '../../../assets/details/close-icon.svg';

const COLORS = { bg: '#050a14', card: '#09111f', accent: '#00ffff', muted: '#3a4a65' };

export type ChooseVideoModalProps = {
  visible: boolean;
  onClose: () => void;
  onChooseGallery?: () => void;
  onTakePhoto?: () => void;
};

export function ChooseVideoModal({
  visible,
  onClose,
  onChooseGallery,
  onTakePhoto,
}: ChooseVideoModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
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
            onPress={onChooseGallery}
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
            onPress={onTakePhoto}
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
