import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import { getSubscriptionList, type AppSubscriptionConfig } from '../api/services/subscription';
import { PromptCloseIcon } from '../utils';
import { dp, hp } from '../utils/scale';

const headerDiamondImage = require('../assets/buy/Container.png');
const subscribeBtnDiamondIcon = require('../assets/my/vip.png');

const MODAL_HEIGHT_RATIO = 0.78;

const COLORS = {
  backdrop: 'rgba(0,0,0,0.72)',
  panelStart: '#061126',
  panelEnd: '#020914',
  accent: '#00f0ff',
  titleWhite: '#ffffff',
  titleAccent: '#00f0ff',
  subtitle: '#3A4A65',
  loadingMuted: 'rgba(186, 198, 224, 0.62)',
  cardBg: 'rgba(4, 14, 31, 0.88)',
  cardBorder: '#00f0ff',
  cardBorderInactive: 'rgba(75, 103, 145, 0.35)',
  price: '#ffffff',
  discountBg: '#dc2626',
  discountText: '#ffffff',
  radioBorder: 'rgba(0, 240, 255, 0.45)',
  radioFill: '#00f0ff',
  buttonBg: '#efe4d4',
  buttonText: '#2c241c',
};

export type PremiumModalProps = {
  visible: boolean;
  onClose: () => void;
  /** 传入选中的 productId（Apple/Google 产品 ID） */
  onSubscribe?: (productId: string) => void;
};

const platform: 1 | 2 = Platform.OS === 'ios' ? 1 : 2;

function formatPrice(price: number, currency: string): string {
  if (currency === 'USD' || currency === 'usd') return `$${price.toFixed(2)}`;
  if (currency === 'CNY' || currency === 'cny') return `¥${price.toFixed(2)}`;
  return `${currency} ${price.toFixed(2)}`;
}

/** 周期时间文案，显示在价格下方 */
function formatCycleDuration(item: AppSubscriptionConfig): string {
  if (item.durationMonths >= 12) {
    const years = item.durationMonths / 12;
    return years === 1 ? '1年' : `${years}年`;
  }
  if (item.durationMonths > 0) {
    return item.durationMonths === 1 ? '1个月' : `${item.durationMonths}个月`;
  }
  return item.durationDays === 1 ? '1天' : `${item.durationDays}天`;
}

const FALLBACK_PLANS: AppSubscriptionConfig[] = [
  {
    id: 0,
    name: '30 Days',
    price: 9.9,
    currency: 'USD',
    productId: 'com.imageaiapp.premium.30d',
    durationDays: 30,
    durationMonths: 1,
    subscriptionType: 1,
    platform: 1,
    priority: 10,
    status: 'ACTIVE',
  },
  {
    id: 1,
    name: '7 Days',
    price: 1.9,
    currency: 'USD',
    productId: 'com.imageaiapp.premium.7d',
    durationDays: 7,
    durationMonths: 0,
    subscriptionType: 1,
    platform: 1,
    priority: 5,
    status: 'ACTIVE',
  },
  {
    id: 2,
    name: '30 Days',
    price: 9.9,
    currency: 'USD',
    productId: 'com.imageaiapp.premium.30d',
    durationDays: 30,
    durationMonths: 1,
    subscriptionType: 1,
    platform: 2,
    priority: 10,
    status: 'ACTIVE',
  },
  {
    id: 3,
    name: '7 Days',
    price: 1.9,
    currency: 'USD',
    productId: 'com.imageaiapp.premium.7d',
    durationDays: 7,
    durationMonths: 0,
    subscriptionType: 1,
    platform: 2,
    priority: 5,
    status: 'ACTIVE',
  },
];

export function PremiumModal({
  visible,
  onClose,
  onSubscribe,
}: PremiumModalProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [plans, setPlans] = useState<AppSubscriptionConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setLoading(true);
    getSubscriptionList(platform)
      .then((list) => {
        if (list.length > 0) {
          setPlans(list);
          setSelectedProductId(list[0].productId);
        } else {
          setPlans(FALLBACK_PLANS.filter((p) => p.platform === platform));
          setSelectedProductId(FALLBACK_PLANS[0]?.productId ?? null);
        }
      })
      .catch((e) => {
        setPlans(FALLBACK_PLANS.filter((p) => p.platform === platform));
        setSelectedProductId(FALLBACK_PLANS[0]?.productId ?? null);
        setError(e?.message ?? '加载套餐失败');
      })
      .finally(() => setLoading(false));
  }, [visible]);

  const handleSubscribe = () => {
    if (selectedProductId) {
      onSubscribe?.(selectedProductId);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={4} />
        <View style={styles.backdropOverlay} />
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.panelWrap,
            {
              height: screenHeight * MODAL_HEIGHT_RATIO,
              paddingBottom: insets.bottom + 36,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View pointerEvents="none" style={styles.panelTopRim} />
          <LinearGradient
            colors={[COLORS.panelStart, COLORS.panelEnd]}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.panel}>
              <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <PromptCloseIcon />
              </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View style={styles.titleBlock}>
                  <View style={styles.diamondWrap}>
                    <View style={styles.diamondGlow}>
                      <Image source={headerDiamondImage} style={styles.diamondImage} resizeMode="contain" />
                    </View>
                  </View>
                  <View style={styles.titleRow}>
                    <Text style={styles.titlePart}>Get</Text>
                    <Text style={[styles.titlePartAccent, styles.titlePartAccentTight]}>Premium</Text>
                  </View>
                  <Text style={styles.subtitle} numberOfLines={0}>
                    Join the club for unlimited high-fidelity AI creations.
                  </Text>
                </View>

                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}
                <View style={styles.plans}>
                {loading ? (
                  <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                    <Text style={styles.loadingText}>加载套餐中...</Text>
                  </View>
                ) : (
                  plans.map((plan) => {
                    const isSelected = selectedProductId === plan.productId;
                    const discount = plan.discount ?? null;
                    return (
                      <TouchableOpacity
                        key={plan.id}
                        style={[
                          styles.planCard,
                          isSelected ? styles.planCardSelected : styles.planCardInactive,
                        ]}
                        onPress={() => setSelectedProductId(plan.productId)}
                        activeOpacity={0.85}
                      >
                        {discount ? (
                          <View style={styles.discountTag}>
                            <Text style={styles.discountText} numberOfLines={1}>{discount}</Text>
                          </View>
                        ) : null}
                        <View style={styles.planLeft}>
                          <Text style={styles.planPrice}>{formatPrice(plan.price, plan.currency)}</Text>
                          <Text style={styles.planDuration}>
                            {plan.name?.trim() ? plan.name : formatCycleDuration(plan)}
                          </Text>
                        </View>
                        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                          {isSelected ? (
                            <View style={styles.radioInner} />
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.subscribeBtn, (loading || !selectedProductId) && styles.subscribeBtnDisabled]}
                onPress={handleSubscribe}
                activeOpacity={0.9}
                disabled={loading || !selectedProductId}
              >
                <Image source={subscribeBtnDiamondIcon} style={styles.subscribeBtnIcon} resizeMode="contain" />
                <Text style={styles.subscribeBtnText}>
                  {loading ? '加载中...' : 'SUBSCRIBE NOW'}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  panelWrap: {
    borderTopLeftRadius: dp(32),
    borderTopRightRadius: dp(32),
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
    zIndex: 2,
  },
  panel: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  scroll: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  diamondWrap: {
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** 设计稿：大钻石无外圈，仅发光 */
  diamondGlow: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 22,
    elevation: 12,
  },
  diamondImage: {
    width: 72,
    height: 72,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 12,
  },
  titlePart: {
    fontFamily: 'Space Grotesk',
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.titleWhite,
    letterSpacing: -0.8,
  },
  titlePartAccent: {
    fontFamily: 'Space Grotesk',
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.titleAccent,
    letterSpacing: -0.5,
  },
  titlePartAccentTight: {
    marginLeft: 3,
  },
  subtitle: {
    fontFamily: 'Space Grotesk',
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.subtitle,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
    alignSelf: 'stretch',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.discountBg,
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.loadingMuted,
  },
  plans: {
    gap: 18,
    marginBottom: 28,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 18,
    paddingHorizontal: 18,
    paddingRight: 16,
    position: 'relative',
    minHeight: 96,
  },
  planCardSelected: {
    borderColor: COLORS.cardBorder,
    borderWidth: 3,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
  planCardInactive: {
    borderColor: COLORS.cardBorderInactive,
    borderWidth: 2,
  },
  discountTag: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: COLORS.discountBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.discountText,
  },
  planLeft: {
    flex: 1,
  },
  planPrice: {
    fontFamily: 'Space Grotesk',
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.price,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  planDuration: {
    fontFamily: 'Space Grotesk',
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.subtitle,
    letterSpacing: 0.2,
    marginTop: 0,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.radioBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.radioFill,
    borderWidth: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.radioFill,
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingVertical: 15,
    paddingHorizontal: 28,
    backgroundColor: COLORS.buttonBg,
    borderRadius: 9999,
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  subscribeBtnIcon: {
    width: 22,
    height: 22,
  },
  subscribeBtnText: {
    fontFamily: 'Space Grotesk',
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.buttonText,
    letterSpacing: 1.15,
  },
  subscribeBtnDisabled: {
    opacity: 0.6,
  },
});
