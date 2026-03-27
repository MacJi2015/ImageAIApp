import React, { useMemo } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../routes/types';
import arrowLeft from '../../assets/details/arrow-left.png';
import { dp, hp } from '../../utils/scale';
import ShareGenIcon from '../../assets/details/share-gen-icon.svg';
import DownIcon from '../../assets/details/down-icon.svg';
import { useAppStore } from '../../store';
import { PromptCloseIcon, saveMediaToGallery } from '../../utils';
import { MediaPreviewPlayer } from '../../components';
import { deleteVideo } from '../../api/services/feed';

type WorkDetailRoute = RouteProp<RootStackParamList, 'WorkDetail'>;

const COLORS = { bg: '#050a14', accent: '#00ffff', card: '#09111f' };

export function WorkDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<WorkDetailRoute>();
  const insets = useSafeAreaInsets();
  const openShareModal = useAppStore((s) => s.openShareModal);
  const { item } = route.params;
  const imageUri = item.thumbnailUrl ?? item.petImageUrl ?? item.videoUrl ?? '';
  const videoUri = item.videoUrl;
  const [promptVisible, setPromptVisible] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const displayDate = useMemo(() => {
    if (item.createdTime) return item.createdTime.slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  }, [item.createdTime]);

  const handleShare = () => {
    openShareModal({
      url: videoUri ?? '',
      title: 'Share to get +1 free chance',
      message: 'Share to get +1 free chance',
    });
  };

  const handleDelete = () => {
    if (deleting) return;
    Alert.alert('Delete', 'Are you sure you want to delete this work?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const id = item.id;
          if (!id) {
            Alert.alert('Delete failed', 'This work has no feed id and cannot be removed.');
            return;
          }
          const run = async () => {
            setDeleting(true);
            try {
              const ok = await deleteVideo(id);
              if (ok) {
                navigation.goBack();
              } else {
                Alert.alert('Delete failed', 'Please try again later.');
              }
            } catch (e) {
              Alert.alert('Delete failed', e instanceof Error ? e.message : 'Please try again later.');
            } finally {
              setDeleting(false);
            }
          };
          run();
        },
      },
    ]);
  };

  const handleSaveToGallery = () => {
    if (saving) return;
    const save = async () => {
      setSaving(true);
      const type = videoUri ? 'video' : 'photo';
      const uri = videoUri ?? imageUri;
      const result = await saveMediaToGallery(uri, type);
      if (!result.ok) {
        if (result.reason === 'permission') {
          Alert.alert('Permission required', 'Please allow media library access and try again.');
        } else if (result.reason === 'empty') {
          Alert.alert('Notice', 'There is no media to save.');
        } else {
          Alert.alert('Save failed', result.message || 'Please try again later.');
        }
        setSaving(false);
        return;
      }
      Alert.alert('Saved', videoUri ? 'Video has been saved to your gallery.' : 'Image has been saved to your gallery.');
      setSaving(false);
    };

    save().catch(() => {
      setSaving(false);
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Image source={arrowLeft} style={styles.backBtnIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <View style={styles.videoWrap}>
        <MediaPreviewPlayer
          imageUri={imageUri}
          videoUri={videoUri}
          frameStyle={styles.videoFrame}
          mediaStyle={styles.media}
          playButtonMode="pausedOrEnded"
          overlayContent={
            <View style={styles.metaBar}>
              <TouchableOpacity
                style={styles.metaLeftBtn}
                onPress={() => setPromptVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.metaLeft} numberOfLines={1}>
                  {'Prompt Used'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.metaRight}>{displayDate}</Text>
            </View>
          }
        />
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleShare} activeOpacity={0.8}>
        <View style={styles.primaryBtnInner}>
          <ShareGenIcon width={dp(24)} height={dp(24)} />
          <Text style={styles.primaryBtnText}>SHARE NOW</Text>
          <Text style={styles.primaryBtnSub}>To Get +1 Free Chance</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
          onPress={handleDelete}
          activeOpacity={0.8}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#3a4a65" />
          ) : (
            <Text style={styles.deleteBtnText}>DELETE</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryBtn, saving && styles.secondaryBtnDisabled]}
          onPress={handleSaveToGallery}
          activeOpacity={0.8}
          disabled={saving}
        >
          <View style={styles.secondaryBtnInner}>
            <DownIcon width={dp(24)} height={dp(24)} />
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.secondaryBtnText}>SAVE TO GALLERY</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={promptVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPromptVisible(false)}
      >
        <View style={styles.promptModalMask}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={4}
          />
          <View style={styles.promptModalOverlay} />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setPromptVisible(false)}
          />
          <View style={[styles.promptSheet, { paddingBottom: insets.bottom + hp(20) }]}>
            <View pointerEvents="none" style={styles.promptSheetTopRim} />
            <View style={styles.promptSheetHeader}>
              <TouchableOpacity
                style={styles.promptCloseBtn}
                onPress={() => setPromptVisible(false)}
                activeOpacity={0.8}
              >
                <PromptCloseIcon />
              </TouchableOpacity>
              <Text style={styles.promptSheetTitle}>Prompt Used</Text>
              <View style={styles.promptCloseBtnPlaceholder} />
            </View>
            <ScrollView
              style={styles.promptScroll}
              contentContainerStyle={styles.promptScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.promptSheetContent}>
                {item.promptText || 'No prompt text available.'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: dp(16),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: hp(8),
    marginBottom: hp(12),
  },
  backBtn: {
    width: dp(38),
    height: dp(38),
    borderRadius: dp(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnIcon: {
    width: dp(20),
    height: hp(20),
  },
  videoWrap: {
    alignSelf: 'center',
    width: dp(300),
    height: hp(533),
    marginBottom: hp(24),
    position: 'relative',
  },
  videoFrame: {
    width: '100%',
    height: '100%',
    borderRadius: dp(12),
    borderWidth: dp(2),
    borderColor: COLORS.accent,
    overflow: 'hidden',
    position: 'relative',
  },
  media: { width: '100%', height: '100%' },
  metaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: hp(32),
    backgroundColor: 'rgba(5,10,20,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dp(12),
  },
  metaLeft: {
    fontSize: dp(10),
    fontWeight: '700',
    color: COLORS.accent,
    lineHeight: dp(12),
  },
  metaLeftBtn: {
    flex: 1,
    justifyContent: 'center',
  },
  metaRight: {
    fontSize: dp(10),
    lineHeight: dp(12),
    color: '#3a4a65',
    marginLeft: dp(12),
  },
  promptModalMask: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  promptModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  promptSheet: {
    width: '100%',
    minHeight: hp(278),
    backgroundColor: '#050a14',
    borderTopLeftRadius: dp(32),
    borderTopRightRadius: dp(32),
    overflow: 'hidden',
    paddingHorizontal: dp(16),
    paddingTop: hp(16),
  },
  promptSheetTopRim: {
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
  promptSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(24),
  },
  promptCloseBtn: {
    width: dp(32),
    height: dp(32),
    borderRadius: dp(16),
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptCloseBtnPlaceholder: {
    width: dp(32),
    height: dp(32),
  },
  promptSheetTitle: {
    fontSize: dp(18),
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  promptSheetContent: {
    fontSize: dp(12),
    lineHeight: dp(20),
    color: '#3a4a65',
    paddingHorizontal: dp(8),
  },
  promptScroll: {
    maxHeight: hp(220),
  },
  promptScrollContent: {
    paddingBottom: hp(4),
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: hp(10),
    borderRadius: dp(12),
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(12),
  },
  primaryBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: dp(4),
  },
  primaryBtnText: {
    fontSize: dp(16),
    fontWeight: '700',
    color: '#020410',
  },
  primaryBtnSub: {
    fontSize: dp(10),
    color: '#020410',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: dp(12),
  },
  deleteBtn: {
    width: dp(131),
    height: hp(48),
    borderRadius: dp(12),
    borderWidth: 0.5,
    borderColor: 'rgba(0,255,255,0.2)',
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnDisabled: {
    opacity: 0.7,
  },
  deleteBtnText: {
    fontSize: dp(16),
    fontWeight: '700',
    color: '#3a4a65',
  },
  secondaryBtn: {
    flex: 1,
    height: hp(48),
    borderRadius: dp(12),
    borderWidth: 0.5,
    borderColor: 'rgba(0,255,255,0.2)',
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnDisabled: {
    opacity: 0.7,
  },
  secondaryBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: dp(8),
  },
  secondaryBtnText: {
    fontSize: dp(16),
    fontWeight: '700',
    color: '#ffffff',
  },
});
