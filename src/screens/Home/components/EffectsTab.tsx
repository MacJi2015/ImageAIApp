import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../routes/types';
import { getOfficialTemplates, type AppVideoTemplate } from '../../../api/services/template';
import ascIcon from '../../../assets/asc-icon.png';
import dogIcon from '../../../assets/dog-icon.png';
import cartIcon from '../../../assets/cart-icon.png';
import placeholderImage from '../../image-2.png';

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
  isLeft,
  cornerIcon,
}: {
  template: AppVideoTemplate;
  index: number;
  isLeft: boolean;
  cornerIcon: ImageSourcePropType;
}) {
  const navigation = useNavigation<Nav>();

  return (
    <TouchableOpacity
      style={[styles.effectCard, isLeft ? styles.effectCardLeft : styles.effectCardRight]}
      activeOpacity={0.9}
      onPress={() =>
        navigation.navigate('Detail', {
          id: template.templateId,
          title: template.templateName,
        })
      }
    >
      {/* <Image
        source={{ uri: template.coverImageUrl }}
        style={styles.effectCardImage}
        resizeMode="cover"
      /> */}
      <Image source={placeholderImage} style={styles.effectCardImage} resizeMode="cover" />
      <View style={styles.effectCardGradient} />
      <View style={styles.effectCardCornerIconWrap}>
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
      setList(entry ?? []);
      setStatus(!entry?.length ? EMPTY : 'idle');
    } catch {
      setList([]);
      setStatus(EMPTY);
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
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No effects yet</Text>
      </View>
    );
  }

  const leftItems = list.filter((_, i) => i % 2 === 0);
  const rightItems = list.filter((_, i) => i % 2 === 1);

  return (
    <View style={styles.effectsContainer}>
      <View style={styles.effectsGrid}>
        <View style={styles.effectsColumn}>
          {leftItems.map((t, i) => (
            <EffectCard key={t.templateId} template={t} index={i * 2} isLeft cornerIcon={dogIcon} />
          ))}
        </View>
        <View style={styles.effectsColumn}>
          {rightItems.map((t, i) => (
            <EffectCard key={t.templateId} template={t} index={i * 2 + 1} isLeft={false} cornerIcon={cartIcon} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  effectsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  effectsGrid: {
    flexDirection: 'row',
    gap: 7,
  },
  effectsColumn: {
    flex: 1,
    maxWidth: 168,
    gap: 8,
  },
  effectCard: {
    width: '100%',
    height: 268,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  effectCardLeft: { marginRight: 0 },
  effectCardRight: { marginLeft: 0 },
  effectCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  effectCardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
    backgroundColor: 'rgba(5,10,20,0.8)',
  },
  effectCardCornerIconWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#48312E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectCardCornerIcon: {
    width: 16,
    height: 16,
  },
  effectCardBottom: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
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
    marginRight: 6,
  },
  effectCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  effectCardTrendIcon: {
    width: 10,
    height: 10,
    marginRight: 4,
  },
  effectCardCount: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '400',
  },
  effectCardTryBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 22,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectCardTryText: {
    color: COLORS.bg,
    fontSize: 10,
    fontWeight: '700',
  },
  placeholder: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#3a4a65',
    fontSize: 14,
  },
});
