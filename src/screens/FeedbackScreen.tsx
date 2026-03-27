import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../store/useUserStore';
import { submitFeedback } from '../api/services/feedback';

const BG = '#0f1419';
const INPUT_BG = '#1a2332';
const TEXT_MAIN = '#ffffff';
const TEXT_MUTED = '#8b949e';
/** 说明文案（与设置页副文案同色） */
const HINT_COLOR = '#3A4A65';
/** 与 Settings 页 FEEDBACK 按钮一致 */
const SUBMIT_BG = '#00FFFF';
const SUBMIT_TEXT = '#020410';

const PLACEHOLDER =
  'Cinematic space explorer cat, high-fidelity astronaut suit, glowing nebula background, 8k resolution, photorealistic. Cinematic.';

export function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const user = useUserStore((s) => s.user);
  const [issue, setIssue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = issue.trim();
    if (!trimmed) {
      Alert.alert('提示', '请填写问题描述');
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({
        issue: trimmed,
        email: user?.email ?? undefined,
      });
      setIssue('');
      Alert.alert('提交成功', '我们会尽快通过邮件回复您。', [
        { text: '知道了', onPress: () => navigation.goBack() },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '提交失败，请重试';
      Alert.alert('提交失败', msg, [{ text: '知道了' }]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.content}>
        <TextInput
          style={[styles.input, styles.inputIssue]}
          placeholder={PLACEHOLDER}
          placeholderTextColor={TEXT_MUTED}
          value={issue}
          onChangeText={setIssue}
          multiline
          textAlignVertical="top"
          editable={!submitting}
        />
        <Text style={styles.hint}>We will reply to your email within 1-2 business days.</Text>
        <Pressable
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={SUBMIT_TEXT} />
          ) : (
            <Text style={styles.submitBtnText}>SUBMIT</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    padding: 16,
    fontFamily: 'Space Grotesk',
    fontSize: 16,
    lineHeight: 20,
    color: TEXT_MAIN,
  },
  inputIssue: {
    minHeight: 160,
  },
  hint: {
    marginTop: 10,
    fontFamily: 'Space Grotesk',
    fontSize: 13,
    lineHeight: 18,
    color: HINT_COLOR,
  },
  submitBtn: {
    marginTop: 20,
    backgroundColor: SUBMIT_BG,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    fontFamily: 'Space Grotesk',
    fontSize: 16,
    fontWeight: '700',
    color: SUBMIT_TEXT,
    letterSpacing: 0.5,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
});
