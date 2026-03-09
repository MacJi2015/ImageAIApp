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
import Svg, { Path } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSubscriptionList, type AppSubscriptionConfig } from '../api/services/subscription';

const diamondIcon = require('../assets/my/vip.png');

const MODAL_HEIGHT_RATIO = 0.78;

const COLORS = {
  backdrop: 'rgba(0,0,0,0.72)',
  panelStart: '#061126',
  panelEnd: '#020914',
  accent: '#00eaff',
  titleWhite: '#ffffff',
  titleAccent: '#00eaff',
  subtitle: 'rgba(186, 198, 224, 0.55)',
  cardBg: 'rgba(4, 14, 31, 0.88)',
  cardBorder: '#00eaff',
  cardBorderInactive: 'rgba(75, 103, 145, 0.35)',
  price: '#f1f5f9',
  duration: 'rgba(176, 192, 216, 0.5)',
  discountBg: '#dc2626',
  discountText: '#ffffff',
  radioBorder: 'rgba(39, 221, 255, 0.35)',
  radioFill: '#00eaff',
  buttonBg: '#ece3cf',
  buttonText: '#1e1b18',
};

export type PremiumModalProps = {
  visible: boolean;
  onClose: () => void;
  /** 传入选中的 productId（Apple/Google 产品 ID） */
  onSubscribe?: (productId: string) => void;
};

function CloseIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M1.9373 12.7368L0.737305 11.5368L5.5373 6.73682L0.737305 1.93682L1.9373 0.736816L6.7373 5.53682L11.5373 0.736816L12.7373 1.93682L7.9373 6.73682L12.7373 11.5368L11.5373 12.7368L6.7373 7.93682L1.9373 12.7368Z"
        fill="white"
        fillOpacity={0.9}
      />
    </Svg>
  );
}

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
                <CloseIcon />
              </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View style={styles.titleBlock}>
                  <View style={[styles.diamondWrap, styles.diamondGlow]}>
                    <Image source={diamondIcon} style={styles.diamondImage} resizeMode="contain" />
                  </View>
                  <View style={styles.titleRow}>
                    <Text style={styles.titlePart}>Get </Text>
                    <Text style={styles.titlePartAccent}>Premium</Text>
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
                          <Text style={styles.planDuration}>{formatCycleDuration(plan)}</Text>
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
                <Image source={diamondIcon} style={styles.subscribeBtnIcon} resizeMode="contain" />
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
    backgroundColor: COLORS.backdrop,
    justifyContent: 'flex-end',
  },
  panelWrap: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(9, 19, 38, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(120, 143, 181, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 26,
  },
  diamondWrap: {
    marginBottom: 14,
  },
  diamondGlow: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  diamondImage: {
    width: 56,
    height: 56,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titlePart: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.titleWhite,
    letterSpacing: 0.3,
  },
  titlePartAccent: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.titleAccent,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.subtitle,
    textAlign: 'center',
    paddingHorizontal: 22,
    lineHeight: 22,
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
    color: COLORS.subtitle,
  },
  plans: {
    gap: 12,
    marginBottom: 28,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 14,
    position: 'relative',
    minHeight: 88,
  },
  planCardSelected: {
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  planCardInactive: {
    borderColor: COLORS.cardBorderInactive,
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
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.price,
    marginBottom: 4,
  },
  planDuration: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.duration,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.radioBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.radioFill,
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.radioFill,
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    backgroundColor: COLORS.buttonBg,
    borderRadius: 16,
    gap: 10,
    marginTop: 12,
    marginBottom: 16,
  },
  subscribeBtnIcon: {
    width: 20,
    height: 20,
  },
  subscribeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.buttonText,
    letterSpacing: 0.4,
  },
  subscribeBtnDisabled: {
    opacity: 0.6,
  },
});
