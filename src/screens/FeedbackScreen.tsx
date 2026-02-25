import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG = '#0f1419';
const INPUT_BG = '#1a2332';
const TEXT_MAIN = '#ffffff';
const TEXT_MUTED = '#8b949e';
const SUBMIT_BG = '#22c4c4';

const PLACEHOLDER =
  'Cinematic space explorer cat, high-fidelity astronaut suit, glowing nebula background, 8k resolution, photorealistic. Cinematic.';

export function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  const handleSubmit = () => {
    // TODO: 调用反馈接口或发邮件
    setText('');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder={PLACEHOLDER}
          placeholderTextColor={TEXT_MUTED}
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.hint}>
          We will reply to your email within 1-2 business days.
        </Text>
        <Pressable style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>SUBMIT</Text>
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
    minHeight: 160,
    fontFamily: 'Space Grotesk',
    fontSize: 16,
    color: TEXT_MAIN,
  },
  hint: {
    fontFamily: 'Space Grotesk',
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
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
});
