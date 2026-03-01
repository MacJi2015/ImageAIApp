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
import yuanBg from '../../assets/details/yuan-bg.png';
import PlayBtnIcon from '../../assets/details/paly-btn.svg';

type GenerateVideoRoute = RouteProp<RootStackParamList, 'GenerateVideo'>;

const COLORS = { bg: '#050a14', accent: '#00ffff', card: '#09111f' };

export function GenerateVideoScreen() {
  const navigation = useNavigation();
  const route = useRoute<GenerateVideoRoute>();
  const insets = useSafeAreaInsets();
  const { imageUri, videoUri } = route.params;
  const [paused, setPaused] = useState(true);
  const url = 'https://tiantaiapp.oss-cn-hangzhou.aliyuncs.com/static/55.mp4?x-oss-credential=LTAI5t934Y1iXJWgumoVcBVm%2F20260301%2Fcn-hangzhou%2Foss%2Faliyun_v4_request&x-oss-date=20260301T020733Z&x-oss-expires=32400&x-oss-signature-version=OSS4-HMAC-SHA256&x-oss-signature=75b209dda52f8c2a06fac30bdd262226959337b860cfe56dbefd01eb8224c212'
  const hasVideo = !!url;

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
          <Image source={yuanBg} style={styles.backBtnBg} resizeMode="cover" />
          <Image source={arrowLeft} style={styles.backBtnIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <View style={styles.videoWrap}>
        <View style={styles.videoFrame}>
          {hasVideo ? (
            <Video
              source={{ uri: url }}
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
        <TouchableOpacity
          style={styles.playBtnOverlay}
          onPress={() => setPaused((p) => !p)}
          activeOpacity={0.9}
        >
          <PlayBtnIcon width={60} height={60} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleShare} activeOpacity={0.8}>
        <Text style={styles.primaryBtnText}>SHARE NOW</Text>
        <Text style={styles.primaryBtnSub}>To Get +1 Free Chance</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={handleSaveToGallery} activeOpacity={0.8}>
        <Text style={styles.secondaryBtnText}>SAVE TO GALLERY</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
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
    width: 300,
    height: 533,
    marginBottom: 24,
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
    maxWidth: 343,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#020410',
  },
  primaryBtnSub: {
    fontSize: 10,
    fontWeight: '400',
    color: COLORS.bg,
    marginTop: 2,
  },
  secondaryBtn: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 343,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 0.5,
    borderColor: 'rgba(0,255,255,0.2)',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
