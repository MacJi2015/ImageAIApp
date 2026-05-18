import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  Easing,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import RNShare from 'react-native-share';
import Clipboard from '@react-native-clipboard/clipboard';
import type { SharePayload } from '../store/useAppStore';
import { useAppStore } from '../store';
import { useUserStore } from '../store/useUserStore';
import { reportFeed, reportTemplate } from '../api/services/feed';
import { shareVideoToCommunity } from '../api/services/video';
import { isLoginSessionError } from '../api/request';
import { shareToX as shareToXService } from '../services/shareToSocial';
import { saveMediaToGallery } from '../utils/media';
import { dp, hp } from '../utils/scale';

const shareIcons = {
  x: require('../assets/share/xshare.png'),
  system: require('../assets/share/syshare.png'),
  download: require('../assets/share/downvideo.png'),
  copy: require('../assets/share/copyvideo.png'),
  feedback: require('../assets/share/feedback-icon.png'),
  close: require('../assets/share/close.png'),
} as const;

// 与 Create Video 底栏一致：深底、大圆角、标题独立一行（分享弹窗无顶边描边，避免色偏）
const COLORS = {
  backdrop: 'rgba(0,0,0,0.75)',
  panel: '#050A14',
  closeBtnBg: 'rgba(255,255,255,0.05)',
  closeBtnBorder: 'rgba(255,255,255,0.1)',
  title: '#FFFFFF',
  iconCircle: '#09111F',
  iconCircleBorder: 'rgba(0, 255, 255, 0.18)',
  communityLabel: 'rgba(140, 160, 190, 0.95)',
  checkboxOn: '#00E8DC',
  checkboxOffBorder: 'rgba(0, 255, 255, 0.35)',
};

export type ShareModalProps = {
  visible: boolean;
  onClose: () => void;
  /** 分享内容，不传则用默认 message */
  payload?: SharePayload | null;
};

type ShareActionKey = 'x' | 'system' | 'download' | 'copy_link' | 'feedback';
type ShareOption = {
  key: ShareActionKey;
  renderIcon: () => React.ReactNode;
};

type ReportContext = {
  targetId: string;
  targetType: 'feed' | 'template';
  onModerationDone?: () => void;
};

const REPORT_FEEDBACK_MESSAGE =
  'If this content is inappropriate, we will report it and block this user. Their content will be removed from your Feed immediately.';

function buildShareOptions(downloading: boolean, includeFeedback: boolean): ShareOption[] {
  const options: ShareOption[] = [
    {
      key: 'x',
      renderIcon: () => (
        <Image source={shareIcons.x} style={[styles.shareIconImage]} resizeMode="contain" />
      ),
    },
    {
      key: 'system',
      renderIcon: () => (
        <Image source={shareIcons.system} style={styles.shareIconImage} resizeMode="contain" />
      ),
    },
    {
      key: 'download',
      renderIcon: () =>
        downloading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <Image source={shareIcons.download} style={styles.shareIconImage} resizeMode="contain" />
        ),
    },
    {
      key: 'copy_link',
      renderIcon: () => (
        <Image source={shareIcons.copy} style={styles.shareIconImage} resizeMode="contain" />
      ),
    },
  ];
  if (includeFeedback) {
    options.push({
      key: 'feedback',
      renderIcon: () => (
        <Image
          source={shareIcons.feedback}
          style={[styles.shareIconImage, { width: dp(30), height: dp(30) }]}
          resizeMode="contain"
        />
      ),
    });
  }
  return options;
}

/** 无 payload 时随机使用的默认分享文案 */
const DEFAULT_SHARE_MESSAGES = [
  'Turn your pets into superstar!',
  'Check this out!',
  'Made with ImageAI — try it!',
  'So much fun with my pet video!',
  'Love this effect!',
  'My pet is a star!',
];

function getRandomDefaultMessage(): string {
  return DEFAULT_SHARE_MESSAGES[Math.floor(Math.random() * DEFAULT_SHARE_MESSAGES.length)];
}

function fallbackShare(_payload: SharePayload) {
  Alert.alert('分享未配置', '当前平台分享能力未配置，请联系开发同学。');
}

function isCommunityTaskId(s: unknown): s is string {
  return typeof s === 'string' && s.trim().length > 0;
}

function toNonEmptyString(value: string | number | undefined): string {
  if (value == null) return '';
  return String(value).trim();
}

export function ShareModal({
  visible,
  onClose,
  payload = null,
}: ShareModalProps) {
  const insets = useSafeAreaInsets();
  const showToast = useAppStore(s => s.showToast);
  const openLoginModal = useAppStore(s => s.openLoginModal);
  const token = useUserStore(s => s.token);
  const [downloading, setDownloading] = React.useState(false);
  const [alsoShareToCommunity, setAlsoShareToCommunity] = React.useState(true);
  const [reportConfirmVisible, setReportConfirmVisible] = React.useState(false);
  const [reportSubmitting, setReportSubmitting] = React.useState(false);
  const [reportContext, setReportContext] = React.useState<ReportContext | null>(null);
  const panelTranslateY = useRef(new Animated.Value(48)).current;
  const closingRef = useRef(false);

  const communityTaskId = (payload?.communityShareTaskId ?? '').trim();
  const showCommunityOption =
    payload?.showCommunityShareOption === true && isCommunityTaskId(communityTaskId);
  const moderationTargetId = toNonEmptyString(payload?.feedbackTargetId);
  const moderationTargetType = payload?.reportTargetType;
  const canReportAndBlock =
    (moderationTargetType === 'feed' || moderationTargetType === 'template') &&
    moderationTargetId.length > 0;

  useEffect(() => {
    if (visible && showCommunityOption) {
      setAlsoShareToCommunity(true);
    }
  }, [visible, showCommunityOption]);

  useEffect(() => {
    if (!visible) return;
    closingRef.current = false;
    setDownloading(false);
    setReportConfirmVisible(false);
    setReportSubmitting(false);
    setReportContext(null);
    panelTranslateY.setValue(48);
    Animated.timing(panelTranslateY, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [panelTranslateY, visible]);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.timing(panelTranslateY, {
      toValue: 48,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      closingRef.current = false;
      onClose();
    });
  }, [onClose, panelTranslateY]);

  const sharePayload: SharePayload = React.useMemo(
    () => payload ?? { message: getRandomDefaultMessage() },
    [payload]
  );

  /** 去掉仅弹窗 UI 使用的字段；勾选状态仅在 showCommunityShareOption 时写入 shareToCommunity */
  const payloadForShare = React.useMemo((): SharePayload => {
    const rest = { ...sharePayload };
    delete rest.showCommunityShareOption;
    delete rest.communityShareTaskId;
    delete rest.feedbackTargetId;
    delete rest.reportTargetType;
    delete rest.onModerationDone;
    if (showCommunityOption) {
      return { ...rest, shareToCommunity: alsoShareToCommunity };
    }
    return rest;
  }, [sharePayload, alsoShareToCommunity, showCommunityOption]);

  const buildMessage = useCallback((p: SharePayload): string => {
    const message = p.message ?? p.title ?? p.url ?? 'Share';
    const url = p.url ?? '';
    return url ? `${message}\n${url}` : message;
  }, []);

  const shareSystem = useCallback(async (p: SharePayload) => {
    await RNShare.open({
      title: p.title ?? 'Share',
      message: buildMessage(p),
      url: p.url || undefined,
      showAppsToView: true,
      failOnCancel: false,
    });
  }, [buildMessage]);

  const downloadVideo = useCallback(async (p: SharePayload) => {
    if (downloading) return;
    const uri = p.url ?? '';
    setDownloading(true);
    const result = await saveMediaToGallery(uri, 'video')
      .catch((e: unknown) => {
        return { ok: false, reason: 'error' as const, message: e instanceof Error ? e.message : undefined };
      });
    setDownloading(false);
    if (!result.ok) {
      if (result.reason === 'permission') {
        Alert.alert('Permission required', 'Please allow media library access and try again.');
      } else if (result.reason === 'empty') {
        Alert.alert('Notice', 'There is no media to save.');
      } else {
        Alert.alert('Save failed', result.message || 'Please try again later.');
      }
      return;
    }
    showToast('Download successful');
  }, [downloading, showToast]);

  const copyLink = useCallback((p: SharePayload) => {
    const url = (p.url ?? '').trim();
    if (!url) {
      Alert.alert('Notice', 'There is no link to copy.');
      return;
    }
    Clipboard.setString(url);
    showToast('Link copied successfully');
  }, [showToast]);

  const runAction = useCallback(async (key: ShareActionKey, p: SharePayload) => {
    switch (key) {
      case 'x':
        await shareToXService(p);
        return;
      case 'system':
        await shareSystem(p);
        return;
      case 'download':
        await downloadVideo(p);
        return;
      case 'copy_link':
        copyLink(p);
        return;
      case 'feedback':
        setReportConfirmVisible(true);
        return;
      default:
        fallbackShare(p);
    }
  }, [copyLink, downloadVideo, shareSystem]);

  const handleCancelReport = useCallback(() => {
    if (reportSubmitting) return;
    setReportConfirmVisible(false);
    setReportContext(null);
  }, [reportSubmitting]);

  const handleSubmitReport = useCallback(async () => {
    if (reportSubmitting) return;
    if (!token) {
      setReportConfirmVisible(false);
      setReportContext(null);
      openLoginModal();
      return;
    }
    const context = reportContext ?? (
      canReportAndBlock && moderationTargetType
        ? {
            targetId: moderationTargetId,
            targetType: moderationTargetType,
            onModerationDone: payload?.onModerationDone,
          }
        : null
    );
    if (!context) {
      Alert.alert('Notice', 'This content cannot be reported right now.');
      return;
    }
    setReportSubmitting(true);
    try {
      if (context.targetType === 'feed') {
        await reportFeed(context.targetId);
      } else {
        await reportTemplate(context.targetId);
      }
      setReportConfirmVisible(false);
      setReportContext(null);
      context.onModerationDone?.();
      showToast('Reported and blocked successfully.');
    } catch (e: unknown) {
      if (isLoginSessionError(e)) {
        setReportConfirmVisible(false);
        setReportContext(null);
        return;
      }
      const msg = e instanceof Error ? e.message : 'Submit failed, please try again.';
      Alert.alert('Submit failed', msg);
    } finally {
      setReportSubmitting(false);
    }
  }, [
    canReportAndBlock,
    moderationTargetId,
    moderationTargetType,
    reportContext,
    token,
    openLoginModal,
    payload,
    reportSubmitting,
    showToast,
  ]);

  const SHARE_OPTIONS = React.useMemo(
    () => buildShareOptions(downloading, canReportAndBlock),
    [canReportAndBlock, downloading]
  );

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={requestClose}
      >
        <View style={styles.backdrop}>
          <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={4} />
          <View style={styles.backdropOverlay} />
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={requestClose} />
          <Animated.View
            style={[
              styles.panel,
              {
                paddingBottom: insets.bottom + 28,
                transform: [{ translateY: panelTranslateY }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View pointerEvents="none" style={styles.panelTopRim} />
            <View style={styles.header}>
              <View style={styles.headerLeading}>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={requestClose}
                  activeOpacity={0.8}
                >
                  <Image source={shareIcons.close} style={styles.closeIcon} resizeMode="contain" />
                </TouchableOpacity>
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Share to
                </Text>
              </View>
              <View style={styles.headerTrailing} />
            </View>

            <View style={styles.iconsRow}>
              {SHARE_OPTIONS.map(({ key, renderIcon }) => (
                <TouchableOpacity
                  key={key}
                  style={styles.iconCircle}
                  activeOpacity={0.8}
                  disabled={downloading && key === 'download'}
                  onPress={() => {
                    if (downloading && key === 'download') return;
                    const isShareAction = key === 'x' || key === 'system';
                    const isFeedbackAction = key === 'feedback';
                    const shouldCloseFirst = isShareAction;
                    const shouldShareToCommunity =
                      isShareAction &&
                      showCommunityOption &&
                      alsoShareToCommunity &&
                      !!useUserStore.getState().token &&
                      isCommunityTaskId(communityTaskId);

                    if (isFeedbackAction) {
                      if (canReportAndBlock && moderationTargetType) {
                        setReportContext({
                          targetId: moderationTargetId,
                          targetType: moderationTargetType,
                          onModerationDone: payload?.onModerationDone,
                        });
                      } else {
                        setReportContext(null);
                      }
                      requestClose();
                      setTimeout(() => {
                        setReportConfirmVisible(true);
                      }, 280);
                      return;
                    }

                    if (shouldCloseFirst) {
                      // 先关弹窗，延迟后再调分享，避免原生编辑页被遮住；延迟需足够长让 slide 动画完全结束，否则下拉看文字时会被弹回、遮挡
                      requestClose();
                      setTimeout(() => {
                        if (shouldShareToCommunity) {
                          shareVideoToCommunity(communityTaskId).catch(() => {});
                        }
                        runAction(key, payloadForShare).catch(() => {});
                      }, 280);
                      return;
                    }

                    // 下载/复制：先执行动作并展示 Toast，再稍后关闭弹窗，避免“关太快看不见提示”
                    runAction(key, payloadForShare)
                      .then(() => {
                        setTimeout(() => requestClose(), 520);
                      })
                      .catch(() => {});
                  }}
                >
                  {renderIcon()}
                </TouchableOpacity>
              ))}
            </View>

            {showCommunityOption ? (
              <TouchableOpacity
                style={styles.communityRow}
                activeOpacity={0.85}
                onPress={() => setAlsoShareToCommunity(v => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: alsoShareToCommunity }}
                accessibilityLabel="Also share to the PetsGO community"
              >
                <View
                  style={[
                    styles.checkboxOuter,
                    alsoShareToCommunity ? styles.checkboxOuterOn : styles.checkboxOuterOff,
                  ]}
                >
                  {alsoShareToCommunity ? <Text style={styles.checkboxMark}>✓</Text> : null}
                </View>
                <Text style={styles.communityLabel}>Also share to the PetsGO community</Text>
              </TouchableOpacity>
            ) : null}
          </Animated.View>
        </View>
      </Modal>
      <Modal
        visible={reportConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelReport}
      >
        <View style={styles.reportOverlay}>
          <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={4} />
          <View style={styles.backdropOverlay} />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleCancelReport}
            disabled={reportSubmitting}
          />
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Report and block this user?</Text>
            <Text style={styles.reportMessage}>{REPORT_FEEDBACK_MESSAGE}</Text>
            <View style={styles.reportActions}>
              <TouchableOpacity
                style={styles.reportCancelBtn}
                activeOpacity={0.85}
                onPress={handleCancelReport}
                disabled={reportSubmitting}
              >
                <Text style={styles.reportCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reportSubmitBtn, reportSubmitting && styles.reportSubmitBtnDisabled]}
                activeOpacity={0.85}
                onPress={() => {
                  handleSubmitReport().catch(() => {});
                }}
                disabled={reportSubmitting}
              >
                {reportSubmitting ? (
                  <ActivityIndicator size="small" color="#020410" />
                ) : (
                  <Text style={styles.reportSubmitText}>Report & Block</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  panel: {
    backgroundColor: COLORS.panel,
    borderTopLeftRadius: dp(32),
    borderTopRightRadius: dp(32),
    paddingHorizontal: dp(16),
    paddingTop: hp(16),
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(30),
    minHeight: 40,
  },
  headerLeading: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 0,
  },
  headerTrailing: {
    width: 32,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.closeBtnBg,
    borderWidth: 0,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.title,
    textAlign: 'center',
    fontFamily: 'Space Grotesk',
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingHorizontal: dp(16),
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(24),
    paddingHorizontal: dp(16),
    alignSelf: 'center',
    maxWidth: '100%',
  },
  checkboxOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxOuterOn: {
    backgroundColor: COLORS.checkboxOn,
  },
  checkboxOuterOff: {
    borderWidth: 2,
    borderColor: COLORS.checkboxOffBorder,
    backgroundColor: 'transparent',
  },
  checkboxMark: {
    fontSize: 13,
    fontWeight: '800',
    color: '#020308',
    marginTop: -1,
  },
  communityLabel: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.communityLabel,
    fontFamily: 'Space Grotesk',
    lineHeight: 20,
    textAlign: 'left',
  },
  iconCircle: {
    width: dp(60),
    height: dp(60),
    borderRadius: dp(30),
    borderWidth: 0.5,
    borderColor: 'rgba(0, 255, 255, 0.20)',
    backgroundColor: COLORS.iconCircle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIconImage: {
    width: dp(36),
    height: dp(36),
  },
  loadingWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: dp(24),
  },
  reportCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#050A14',
    borderRadius: dp(24),
    borderWidth: 0.8,
    borderColor: 'rgba(0, 255, 255, 0.18)',
    paddingHorizontal: dp(18),
    paddingTop: hp(20),
    paddingBottom: hp(16),
  },
  reportTitle: {
    color: '#FFFFFF',
    fontSize: dp(20),
    fontWeight: '700',
    textAlign: 'center',
  },
  reportMessage: {
    marginTop: hp(10),
    color: '#8EA1BF',
    fontSize: dp(13),
    lineHeight: hp(20),
    textAlign: 'center',
  },
  reportActions: {
    marginTop: hp(18),
    flexDirection: 'row',
    gap: dp(12),
  },
  reportCancelBtn: {
    flex: 1,
    height: hp(52),
    borderRadius: dp(12),
    borderWidth: 0.8,
    borderColor: 'rgba(0, 255, 255, 0.20)',
    backgroundColor: '#09111F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportSubmitBtn: {
    flex: 1,
    height: hp(52),
    borderRadius: dp(12),
    backgroundColor: '#1FE1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportSubmitBtnDisabled: {
    opacity: 0.75,
  },
  reportCancelText: {
    color: '#FFFFFF',
    fontSize: dp(18),
    fontWeight: '700',
  },
  reportSubmitText: {
    color: '#020410',
    fontSize: dp(18),
    fontWeight: '700',
  },
});
