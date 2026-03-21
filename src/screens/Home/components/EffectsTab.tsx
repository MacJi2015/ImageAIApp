import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../routes/types';
import { getOfficialTemplates, type AppVideoTemplate } from '../../../api/services/template';
import { dp, hp } from '../../../utils/scale';
import ascIcon from '../../../assets/asc-icon.png';

const OSS_BASE = 'https://tiantaiapp.oss-cn-hangzhou.aliyuncs.com/static/cat/';
const MOCK_TEMPLATES: AppVideoTemplate[] = [
  { id: 1, templateId: 'mock-1', templateName: 'Space Explorer', templateType: 'effect', status: '1', isOfficial: true, sortOrder: 1, coverImageUrl: `${OSS_BASE}dog1.jpg`, previewVideoUrl: `${OSS_BASE}dog-video1.mov`, promptText: 'Cinematic space explorer.' },
  { id: 2, templateId: 'mock-2', templateName: 'Rock Star', templateType: 'effect', status: '1', isOfficial: true, sortOrder: 2, coverImageUrl: `${OSS_BASE}cat2.jpg`, previewVideoUrl: `${OSS_BASE}cat-video2.mov`, promptText: 'Rock star stage performance.' },
  { id: 3, templateId: 'mock-3', templateName: 'Astronaut', templateType: 'effect', status: '1', isOfficial: true, sortOrder: 3, coverImageUrl: `${OSS_BASE}cat3.jpg`, previewVideoUrl: `${OSS_BASE}cat-video3.mov`, promptText: 'Astronaut in space suit.' },
  { id: 4, templateId: 'mock-4', templateName: 'Superhero', templateType: 'effect', status: '1', isOfficial: true, sortOrder: 4, coverImageUrl: `${OSS_BASE}cat4.jpg`, previewVideoUrl: `${OSS_BASE}cat-video4.mov`, promptText: 'Superhero cape and mask.' },
  { id: 5, templateId: 'mock-5', templateName: 'Under the Sea', templateType: 'effect', status: '1', isOfficial: true, sortOrder: 5, coverImageUrl: `${OSS_BASE}cat1.jpg`, previewVideoUrl: `${OSS_BASE}cat-video1.mov`, promptText: 'Under the sea adventure.' },
];
import dogIcon from '../../../assets/dog-icon.png';
import cartIcon from '../../../assets/cart-icon.png';
import preGoodsImg from '../../../assets/details/pre-goods-img.png';
import emptyImg from '../../../assets/details/empty.png';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const COLORS = { bg: '#050a14', accent: '#00ffff' };
const LOADING = 'loading';
const EMPTY = 'empty';
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function EffectCard({
  template,
  cornerIcon,
}: {
  template: AppVideoTemplate;
  index: number;
  cornerIcon: ImageSourcePropType;
}) {
  const navigation = useNavigation<Nav>();
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageUri = template.coverImageUrl || 'https://picsum.photos/seed/feed3/172/224';

  return (
    <TouchableOpacity
      style={styles.effectCard}
      activeOpacity={0.9}
      onPress={() =>
        navigation.navigate('Detail', {
          id: template.templateId,
          title: template.templateName,
          source: 'effect',
          videoUrl: template.previewVideoUrl || undefined,
          thumbnailUrl: template.coverImageUrl || undefined,
        })
      }
    >
      <View style={styles.effectCardImageWrap}>
        <Image source={preGoodsImg} style={styles.effectCardImagePreloadPlaceholder} resizeMode="contain" />
        <Image
          source={{ uri: imageUri }}
          style={[styles.effectCardImage, imageLoaded ? styles.effectCardImageLoaded : styles.effectCardImagePreload]}
          resizeMode="cover"
          onLoadEnd={() => setImageLoaded(true)}
        />
      </View>
      <LinearGradient
        colors={['rgba(5, 10, 20, 0)', 'rgba(5, 10, 20, 0.80)']}
        style={styles.effectCardGradient}
        pointerEvents="none"
      />
      <View style={styles.effectCardCornerIconWrap}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={5}
        />
        <View style={styles.effectCardCornerOverlay} />
        <Image source={cornerIcon} style={styles.effectCardCornerIcon} resizeMode="contain" />
      </View>
      <View style={styles.effectCardBottom}>
        <View style={styles.effectCardBottomLeft}>
          <Text style={styles.effectCardTitle} numberOfLines={1}>
            {template.templateName || 'Effect'}
          </Text>
          <View style={styles.effectCardMeta}>
            <Image source={ascIcon} style={styles.effectCardTrendIcon} resizeMode="contain" />
            <Text style={styles.effectCardCount}>{formatCount(1_200_000)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.effectCardTryBtn}
          activeOpacity={0.8}
          onPress={(e) => {
            e.stopPropagation();
          }}
        >
          <Text style={styles.effectCardTryText}>TRY</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

interface EffectsTabProps {
  refreshKey?: number;
}

export function EffectsTab({ refreshKey }: EffectsTabProps) {
  const [list, setList] = useState<AppVideoTemplate[]>([]);
  const [status, setStatus] = useState<'idle' | typeof LOADING | typeof EMPTY>('idle');


  const loadData = useCallback(async () => {
    setStatus(LOADING);
    try {
      const entry = await getOfficialTemplates();
      // setList(entry ?? []);
      // setStatus(!entry?.length ? EMPTY : 'idle');
      const data = entry?.length ? entry : MOCK_TEMPLATES;
      setList(data);
      setStatus('idle');
    } catch {
//  setList([]);
//  setStatus(EMPTY);
      setList(MOCK_TEMPLATES);
      setStatus('idle');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  if (status === LOADING) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Loading...</Text>
      </View>
    );
  }

  if (status === EMPTY) {
    return (
      <View style={styles.emptyState}>
        <Image source={emptyImg} style={styles.emptyStateIcon} resizeMode="contain" />
        <Text style={styles.emptyStateText}>Hmm, something's off.</Text>
        <TouchableOpacity style={styles.emptyStateRefreshBtn} activeOpacity={0.8} onPress={loadData}>
          <Text style={styles.emptyStateRefreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.effectsContainer}>
      <View style={styles.effectsGrid}>
        {list.map((t, i) => (
          <EffectCard
            key={t.templateId}
            template={t}
            index={i}
            cornerIcon={i % 2 === 0 ? dogIcon : cartIcon}
         
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  effectsContainer: {
    paddingHorizontal: dp(16),
    paddingTop: hp(7),
    paddingBottom: hp(120),
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: dp(7),
    rowGap: hp(7),
  },
  effectCard: {
    height: hp(226),
    borderRadius:dp(12),
    width:dp(168),
    overflow: 'hidden',
    position: 'relative',
  },
  effectCardImageWrap: {
    ...StyleSheet.absoluteFillObject,
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
  },
  effectCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  effectCardImagePreloadPlaceholder: {
    width: dp(69),
    height: hp(28),
  },
  effectCardImagePreload: {
    opacity: 0,
  },
  effectCardImageLoaded: {
    opacity: 1,
  },
  effectCardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: hp(40),
  },
  effectCardCornerIconWrap: {
    position: 'absolute',
    top: hp(8),
    right: dp(8),
    width: dp(28),
    height: dp(28),
    borderRadius: dp(14),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectCardCornerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  effectCardCornerIcon: {
    width: dp(16),
    height: dp(16),
  },
  effectCardBottom: {
    position: 'absolute',
    left: dp(8),
    right: dp(8),
    bottom: hp(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  effectCardBottomLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
  },
  effectCardTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginRight: dp(6),
    marginBottom: hp(4),
  },
  effectCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  effectCardTrendIcon: {
    width: dp(10),
    height: dp(10),
    marginRight: 4,
  },
  effectCardCount: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '400',
  },
  effectCardTryBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: hp(6),
    paddingHorizontal: dp(12),
    borderRadius: dp(22),
    minWidth: dp(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectCardTryText: {
    color: COLORS.bg,
    fontSize: 10,
    fontWeight: '700',
  },
  placeholder: {
    paddingVertical: hp(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#3a4a65',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(80),
  },
  emptyStateIcon: {
    width: dp(85),
    height: hp(85),
    marginBottom: hp(8),
  },
  emptyStateText: {
    color: '#3a4a65',
    fontSize: 14,
    marginBottom: hp(16),
  },
  emptyStateRefreshBtn: {
    backgroundColor: '#09111f',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 255, 255, 0.2)',
    paddingVertical: hp(10),
    paddingHorizontal: dp(28),
    borderRadius: dp(12),
    minHeight: hp(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateRefreshText: {
    color: '#ffffff',
    fontSize: 12,
  },
});
