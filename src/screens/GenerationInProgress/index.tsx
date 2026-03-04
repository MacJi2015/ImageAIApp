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
import yuanBg from '../../assets/details/yuan-bg.png';

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
  const { taskId } = route.params;
  const [remainingSec, setRemainingSec] = useState(60);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const oneMinuteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigateToMy = useCallback(() => {
    (navigation as any).navigate('MainTabs', { screen: 'My' });
  }, [navigation]);

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
        await getVideoTaskStatus(taskId);
      } catch {
        // 忽略单次失败，继续轮询
      }
    };

    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    poll();

    oneMinuteTimerRef.current = setTimeout(() => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      navigateToMy();
    }, POLL_DURATION_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (oneMinuteTimerRef.current) clearTimeout(oneMinuteTimerRef.current);
    };
  }, [taskId, navigateToMy]);

  const handleBack = () => {
    navigateToMy();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Image source={yuanBg} style={styles.backBtnBg} resizeMode="cover" />
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
        onPress={navigateToMy}
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
  animationWrap: {
    width: '100%',
    height: 281,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gif: {
    width: 280,
    height: 281,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.75,
  },
  timeValue: {
    color: COLORS.accent,
  },
  continueBtn: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 44,
    backgroundColor: COLORS.card,
    borderWidth: 0.5,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  continueBtnSub: {
    fontSize: 10,
    fontWeight: '400',
    color: COLORS.muted,
    marginTop: 2,
  },
});
