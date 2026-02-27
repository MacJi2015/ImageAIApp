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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../store/useUserStore';
import { submitFeedback } from '../api/services/feedback';

const BG = '#0f1419';
const INPUT_BG = '#1a2332';
const TEXT_MAIN = '#ffffff';
const TEXT_MUTED = '#8b949e';
const SUBMIT_BG = '#22c4c4';

const PLACEHOLDER =
  'Cinematic space explorer cat, high-fidelity astronaut suit, glowing nebula background, 8k resolution, photorealistic. Cinematic.';

export function FeedbackScreen() {
  const insets = useSafeAreaInsets();
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
      Alert.alert('提交成功', '我们会尽快通过邮件回复您。', [{ text: '知道了' }]);
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
        <Pressable
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={TEXT_MAIN} />
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
    color: TEXT_MAIN,
  },
  inputIssue: {
    minHeight: 160,
  },
  submitBtn: {
    marginTop: 24,
    backgroundColor: SUBMIT_BG,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    fontFamily: 'Space Grotesk',
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
    letterSpacing: 0.5,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
});
