import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Video from 'react-native-video';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../routes/types';
import arrowLeft from '../../assets/details/arrow-left.png';
import { dp,hp } from '../../utils/scale';
import PlayBtnIcon from '../../assets/details/paly-btn.svg';
import ShareGenIcon from '../../assets/details/share-gen-icon.svg';
import DownIcon from '../../assets/details/down-icon.svg';

type GenerateVideoRoute = RouteProp<RootStackParamList, 'GenerateVideo'>;

const COLORS = { bg: '#050a14', accent: '#00ffff', card: '#09111f' };

export function GenerateVideoScreen() {
  const navigation = useNavigation();
  const route = useRoute<GenerateVideoRoute>();
  const insets = useSafeAreaInsets();
  const { imageUri, videoUri } = route.params;
  const [paused, setPaused] = useState(true);
  const hasVideo = !!videoUri;

  const handleShare = () => {
    // TODO: share and get +1 free chance
  };

  const handleSaveToGallery = () => {
    // TODO: save video/photo to gallery
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          {/* <Image source={yuanBg} style={styles.backBtnBg} resizeMode="cover" /> */}
          <Image source={arrowLeft} style={styles.backBtnIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <View style={styles.videoWrap}>
        <View style={styles.videoFrame}>
          {hasVideo ? (
            <Video
              source={{ uri: videoUri! }}
              style={styles.video}
              resizeMode="cover"
              paused={paused}
              onError={(e) => {
                __DEV__ && console.warn('[GenerateVideo] video error', e);
              }}
            />
          ) : (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          )}
        </View>
        {hasVideo && (
          <TouchableOpacity
            style={styles.playBtnOverlay}
            onPress={() => setPaused((p) => !p)}
            activeOpacity={0.9}
          >
            <PlayBtnIcon width={60} height={60} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleShare} activeOpacity={0.8}>
        <View style={styles.primaryBtnInner}>
          <ShareGenIcon width={dp(24)} height={dp(24)} />
          <Text style={styles.primaryBtnLine} numberOfLines={2}>
            <Text style={styles.primaryBtnText}>SHARE NOW </Text>
            <Text style={styles.primaryBtnSub}>To Get +1 Free Chance</Text>
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={handleSaveToGallery} activeOpacity={0.8}>
        <View style={styles.secondaryBtnInner}>
          <DownIcon width={dp(24)} height={dp(24)} />
          <Text style={styles.secondaryBtnText}>SAVE TO GALLERY</Text>
        </View>
      </TouchableOpacity>
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
    paddingTop: 8,
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnBg: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  backBtnIcon: {
    width: 20,
    height: 20,
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
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.accent,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  playBtnOverlay: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -30,
    marginTop: -30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: dp(343),
    paddingVertical: hp(12),
    paddingHorizontal: dp(16),
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
    gap: dp(8),
    flexWrap: 'wrap',
  },
  primaryBtnLine: {
    flexShrink: 1,
    textAlign: 'center',
  },
  primaryBtnText: {
    fontSize: dp(16),
    fontWeight: '700',
    color: '#020410',
  },
  primaryBtnSub: {
    fontSize: dp(12),
    fontWeight: '400',
    color: '#020410',
  },
  secondaryBtn: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: dp(343),
    paddingVertical: hp(12),
    paddingHorizontal: dp(16),
    borderRadius: dp(12),
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: 'rgba(0,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
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
    letterSpacing: 0.5,
  },
});
