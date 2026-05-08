import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PromptCloseIcon } from '../utils';
import { dp, hp } from '../utils/scale';

type UgcConsentModalProps = {
  visible: boolean;
  onAgree: () => Promise<void> | void;
  onDisagree: () => void;
  onPressPrivacy: () => void;
  onPressTerms: () => void;
};

export function UgcConsentModal({
  visible,
  onAgree,
  onDisagree,
  onPressPrivacy,
  onPressTerms,
}: UgcConsentModalProps) {
  const insets = useSafeAreaInsets();
  const [agreeSubmitting, setAgreeSubmitting] = useState(false);
  const panelTranslateY = useRef(new Animated.Value(48)).current;
  const closingRef = useRef(false);

  useEffect(() => {
    if (!visible) setAgreeSubmitting(false);
  }, [visible]);

  const requestClose = useCallback(() => {
    if (closingRef.current || agreeSubmitting) return;
    closingRef.current = true;
    Animated.timing(panelTranslateY, {
      toValue: 48,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      closingRef.current = false;
      onDisagree();
    });
  }, [agreeSubmitting, onDisagree, panelTranslateY]);

  useEffect(() => {
    if (!visible) return;
    closingRef.current = false;
    panelTranslateY.setValue(48);
    Animated.timing(panelTranslateY, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [panelTranslateY, visible]);

  const handleAgree = useCallback(() => {
    if (agreeSubmitting) return;
    setAgreeSubmitting(true);
    Promise.resolve(onAgree()).finally(() => {
      setAgreeSubmitting(false);
    });
  }, [agreeSubmitting, onAgree]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={requestClose}>
      <View style={styles.backdrop}>
        <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={4} />
        <View style={styles.backdropOverlay} />
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={requestClose}
          disabled={agreeSubmitting}
        />
        <Animated.View
          style={[
            styles.panel,
            {
              paddingBottom: insets.bottom + 20,
              transform: [{ translateY: panelTranslateY }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View pointerEvents="none" style={styles.panelTopRim} />
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.8}
              onPress={requestClose}
              disabled={agreeSubmitting}
            >
              <PromptCloseIcon />
            </TouchableOpacity>
            <Text style={styles.title}>Welcome to PetsGO</Text>
          </View>
          <Text style={styles.lead}>Before you continue, please agree to the following:</Text>

          <View style={styles.bullets}>
            <Text style={styles.bullet}>• Only upload photos you own or have permission to use.</Text>
            <Text style={styles.bullet}>• Do not upload photos of other people without their consent.</Text>
            <Text style={styles.bullet}>• Do not upload illegal, violent, hateful, sexual, or harmful content.</Text>
            <Text style={styles.bullet}>• You are responsible for the content you create and share.</Text>
          </View>

          <Text style={styles.termsLead}>
            By tapping "Agree", you confirm that you have read and agree to our
            <Text style={styles.link} onPress={onPressPrivacy}> Privacy Policy</Text>
            <Text> and </Text>
            <Text style={styles.link} onPress={onPressTerms}>Terms of Service</Text>
            <Text>.</Text>
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, styles.disagreeBtn]}
              onPress={requestClose}
              disabled={agreeSubmitting}
            >
              <Text style={styles.disagreeText}>DISAGREE</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.agreeBtn, agreeSubmitting && styles.actionBtnDisabled]}
              onPress={handleAgree}
              disabled={agreeSubmitting}
            >
              {agreeSubmitting ? (
                <ActivityIndicator size="small" color="#020410" />
              ) : (
                <Text style={styles.agreeText}>AGREE</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    paddingHorizontal: 0,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  panel: {
    width: '100%',
    borderTopLeftRadius: dp(32),
    borderTopRightRadius: dp(32),
    backgroundColor: '#050A14',
    borderWidth: 0,
    paddingHorizontal: dp(20),
    paddingTop: hp(20),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 6,
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
  },
  header: {
    position: 'relative',
    width: '100%',
    minHeight: dp(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
    width: dp(32),
    height: dp(32),
    borderRadius: dp(16),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d1117',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: dp(24),
    fontWeight: '700',
    lineHeight: dp(30),
    textAlign: 'center',
    width: '100%',
  },
  lead: {
    marginTop: hp(18),
    color: '#3A4A65',
    fontSize: dp(12),
    lineHeight: dp(18),
  },
  bullets: {
    marginTop: hp(10),
    gap: hp(8),
  },
  bullet: {
    color: '#3A4A65',
    fontSize: dp(12),
    lineHeight: dp(18),
  },
  termsLead: {
    marginTop: hp(10),
    color: '#3A4A65',
    fontSize: dp(12),
    lineHeight: dp(18),
  },
  link: {
    color: '#00F2FF',
  },
  actions: {
    marginTop: hp(22),
    flexDirection: 'row',
    gap: dp(12),
  },
  actionBtn: {
    flex: 1,
    height: hp(46),
    borderRadius: dp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  disagreeBtn: {
    borderWidth: 0.8,
    borderColor: 'rgba(0,255,255,0.25)',
    backgroundColor: '#09111F',
  },
  agreeBtn: {
    backgroundColor: '#1FE1E8',
  },
  actionBtnDisabled: {
    opacity: 0.7,
  },
  disagreeText: {
    color: '#FFFFFF',
    fontSize: dp(14),
    fontWeight: '700',
  },
  agreeText: {
    color: '#020410',
    fontSize: dp(14),
    fontWeight: '700',
  },
});

