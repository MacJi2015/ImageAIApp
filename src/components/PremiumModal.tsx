import React, { useState } from 'react';
import {
  Image,
  Modal,
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
  onSubscribe?: (planId: '7d' | '30d') => void;
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

const PLANS = [
  { id: '30d' as const, price: '$9.90', duration: '30 Days Membership', discount: '20% off' },
  { id: '7d' as const, price: '$1.90', duration: '7 Days Membership', discount: null },
] as const;

export function PremiumModal({
  visible,
  onClose,
  onSubscribe,
}: PremiumModalProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [selectedPlan, setSelectedPlan] = useState<'7d' | '30d'>('30d');

  const handleSubscribe = () => {
    onSubscribe?.(selectedPlan);
    onClose();
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

                <View style={styles.plans}>
                {PLANS.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={[
                        styles.planCard,
                        isSelected ? styles.planCardSelected : styles.planCardInactive,
                      ]}
                      onPress={() => setSelectedPlan(plan.id)}
                      activeOpacity={0.85}
                    >
                      {plan.discount ? (
                        <View style={styles.discountTag}>
                          <Text style={styles.discountText}>{plan.discount}</Text>
                        </View>
                      ) : null}
                      <View style={styles.planLeft}>
                        <Text style={styles.planPrice}>{plan.price}</Text>
                        <Text style={styles.planDuration}>{plan.duration}</Text>
                      </View>
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected ? (
                          <View style={styles.radioInner} />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.subscribeBtn}
                onPress={handleSubscribe}
                activeOpacity={0.9}
              >
                <Image source={diamondIcon} style={styles.subscribeBtnIcon} resizeMode="contain" />
                <Text style={styles.subscribeBtnText}>SUBSCRIBE NOW</Text>
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
});
