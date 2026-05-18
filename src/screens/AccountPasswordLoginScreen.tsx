import { useCallback, useState } from 'react';
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loginWithAccountPassword } from '../services/thirdPartyAuth';
import type { RootStackParamList } from '../routes/types';
import { dp, hp } from '../utils/scale';

const PRIVACY_URL = 'https://www.petsgo.ai/privacyPolicy.html';
const TERMS_URL = 'https://www.petsgo.ai/termsService.html';

export function AccountPasswordLoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [agreedBeforeLogin, setAgreedBeforeLogin] = useState(false);

  const openLegalPage = useCallback(
    (url: string, title: RootStackParamList['WebView']['title']) => {
      navigation.navigate('WebView', { url, title });
    },
    [navigation],
  );

  const handleLogin = useCallback(async () => {
    if (submitting) return;
    if (!agreedBeforeLogin) {
      Alert.alert('Notice', 'Please agree to the Privacy Policy and Terms of Service first.');
      return;
    }
    setSubmitting(true);
    try {
      const ok = await loginWithAccountPassword(username, password);
      if (ok) navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  }, [agreedBeforeLogin, navigation, password, submitting, username]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View>
          <Text style={styles.title}>Account Login</Text>
          <Text style={styles.subtitle}>Use your account and password to continue</Text>

          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Email or username"
            placeholderTextColor="#6D7A91"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
            editable={!submitting}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#6D7A91"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            style={styles.input}
            editable={!submitting}
          />

          <Pressable
            style={styles.termsCheckRow}
            onPress={() => setAgreedBeforeLogin(v => !v)}
            disabled={submitting}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreedBeforeLogin }}
            accessibilityLabel="Agree to Privacy Policy and Terms of Service"
          >
            <View style={[styles.termsCheckCircle, agreedBeforeLogin ? styles.termsCheckCircleOn : styles.termsCheckCircleOff]}>
              {agreedBeforeLogin ? <Text style={styles.termsCheckMark}>✓</Text> : null}
            </View>
            <Text style={styles.termsCheckLabel}>
              I agree to{' '}
              <Text
                style={styles.termsCheckLink}
                onPress={() => {
                  if (submitting) return;
                  openLegalPage(PRIVACY_URL, 'Privacy Policy');
                }}
              >
                Privacy Policy
              </Text>
              {' and '}
              <Text
                style={styles.termsCheckLink}
                onPress={() => {
                  if (submitting) return;
                  openLegalPage(TERMS_URL, 'Terms of Service');
                }}
              >
                Terms of Service
              </Text>
            </Text>
          </Pressable>

          <Pressable
            style={[styles.loginButton, submitting ? styles.loginButtonDisabled : null]}
            onPress={handleLogin}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </Pressable>
        </View>

        {/* <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.footerMuted}>By Continuing, you agree to the</Text>
          <View style={styles.footerLinks}>
            <Pressable
              onPress={() => openLegalPage(PRIVACY_URL, 'Privacy Policy')}
              disabled={submitting}
            >
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Pressable>
            <Text style={styles.footerMuted}> and </Text>
            <Pressable
              onPress={() => openLegalPage(TERMS_URL, 'Terms of Service')}
              disabled={submitting}
            >
              <Text style={styles.footerLink}>Terms of Service</Text>
            </Pressable>
          </View>
        </View> */}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050A14',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: dp(20),
    paddingTop: hp(32),
  },
  title: {
    color: '#FFFFFF',
    fontSize: dp(28),
    fontWeight: '700',
    marginBottom: hp(8),
  },
  subtitle: {
    color: '#3A4A65',
    fontSize: dp(14),
    marginBottom: hp(24),
  },
  input: {
    height: hp(48),
    borderRadius: dp(12),
    borderWidth: 0.5,
    borderColor: 'rgba(0, 255, 255, 0.2)',
    backgroundColor: '#09111F',
    color: '#FFFFFF',
    paddingHorizontal: dp(14),
    marginBottom: hp(12),
    fontSize: dp(15),
  },
  loginButton: {
    height: hp(48),
    borderRadius: dp(12),
    borderWidth: 0.5,
    borderColor: 'rgba(0, 255, 255, 0.2)',
    backgroundColor: '#09111F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(8),
  },
  termsCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(4),
    marginBottom: hp(4),
  },
  termsCheckCircle: {
    width: dp(18),
    height: dp(18),
    borderRadius: dp(9),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: dp(8),
  },
  termsCheckCircleOn: {
    backgroundColor: '#00E8DC',
  },
  termsCheckCircleOff: {
    borderWidth: 1.2,
    borderColor: 'rgba(0, 255, 255, 0.35)',
    backgroundColor: 'transparent',
  },
  termsCheckMark: {
    color: '#021018',
    fontSize: dp(11),
    fontWeight: '700',
    marginTop: -1,
  },
  termsCheckLabel: {
    color: '#8EA1BF',
    fontSize: dp(12),
    flexShrink: 1,
  },
  termsCheckLink: {
    color: '#40D3E5',
    fontSize: dp(12),
    fontWeight: '500',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: dp(16),
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  footerMuted: {
    fontSize: 12,
    color: '#3A4A65',
    marginBottom: 2,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLink: {
    fontSize: 12,
    color: '#40D3E5',
    fontWeight: '500',
    opacity: 0.95,
  },
});
