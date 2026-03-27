import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../routes/types';
import { getVideoTaskStatus } from '../../api/services/video';
import arrowLeft from '../../assets/details/arrow-left.png';
import { dp,hp } from '../../utils/scale';

const genLoadingGif = require('../../assets/details/gen-loading.gif');

type GenerationInProgressRoute = RouteProp<RootStackParamList, 'GenerationInProgress'>;

const COLORS = {
  bg: '#050a14',
  accent: '#00ffff',
  muted: '#3a4a65',
  card: '#09111f',
  cardBorder: 'rgba(0,255,255,0.2)',
};
const POLL_DURATION_MS = 60 * 1000;
const POLL_INTERVAL_MS = 3000;

export function GenerationInProgressScreen() {
  const navigation = useNavigation();
  const route = useRoute<GenerationInProgressRoute>();
  const insets = useSafeAreaInsets();
  const { taskId, imageUri } = route.params;
  const [remainingSec, setRemainingSec] = useState(60);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const oneMinuteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigatedRef = useRef(false);

  const cleanupTimers = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (oneMinuteTimerRef.current) {
      clearTimeout(oneMinuteTimerRef.current);
      oneMinuteTimerRef.current = null;
    }
  }, []);

  const resetToGenerateVideo = useCallback(
    (params: { thumbnailUrl?: string; videoUrl?: string }) => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      cleanupTimers();
      const nextImageUri = params.thumbnailUrl || imageUri;
      (navigation as any).replace('GenerateVideo', {
        imageUri: nextImageUri,
        videoUri: params.videoUrl,
      });
    },
    [cleanupTimers, imageUri, navigation],
  );

  // 60s 倒计时显示
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSec((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 轮询一分钟，到点无论成功失败都跳转「我的」
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await getVideoTaskStatus(taskId);
        const status = (res as any)?.status as string | undefined;
        if (status === 'SUCCESS') {
          resetToGenerateVideo({
            thumbnailUrl: (res as any)?.thumbnailUrl,
            videoUrl: (res as any)?.videoUrl,
          });
        }
      } catch {
        // 忽略单次失败，继续轮询
      }
    };

    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    poll();

    oneMinuteTimerRef.current = setTimeout(() => {
      cleanupTimers();
    }, POLL_DURATION_MS);

    return () => {
      cleanupTimers();
    };
  }, [cleanupTimers, resetToGenerateVideo, taskId]);

  const handleBack = () => {
    cleanupTimers();
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          {/* <Image source={yuanBg} style={styles.backBtnBg} resizeMode="cover" /> */}
          <Image source={arrowLeft} style={styles.backBtnIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <View style={styles.animationWrap}>
        <Image source={genLoadingGif} style={styles.gif} resizeMode="contain" />
      </View>

      <Text style={styles.statusText}>Brewing effects...</Text>
      <Text style={styles.timeText}>
        Est. Time: <Text style={styles.timeValue}>{60 - remainingSec}s</Text>
      </Text>

      <TouchableOpacity
        style={[styles.continueBtn, { bottom: insets.bottom + 24 }]}
        onPress={() => {
          cleanupTimers();
          navigation.goBack();
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.continueBtnTitle}>Continue in background</Text>
        <Text style={styles.continueBtnSub}>Check progress in Profile</Text>
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
    paddingTop: hp(8),
    marginBottom: hp(12),
  },
  backBtn: {
    width: dp(38),
    height: dp(38),
    borderRadius: dp(19),
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
    width: dp(20),
    height: hp(20),
  },
  animationWrap: {
    width: '100%',
    height: hp(260),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(48),
    marginBottom: hp(16),
  },
  gif: {
    width: dp(220),
    height: dp(220),
  },
  statusText: {
    fontSize: dp(16),
    fontWeight: '400',
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: hp(12),
  },
  timeText: {
    fontSize: dp(24),
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.75,
  },
  timeValue: {
    color: COLORS.accent,         
  },
  continueBtn: {
    position: 'absolute',
    left: dp(16),
    right: dp(16),
    height: hp(48),
    backgroundColor: COLORS.card,
    borderWidth: 0.5,
    borderColor: COLORS.cardBorder,
    borderRadius: dp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnTitle: {
    fontSize: dp(16),
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  continueBtnSub: {
    fontSize: 10,
    fontWeight: '400',
    color: COLORS.muted,
    marginTop: hp(2),
  },
});
