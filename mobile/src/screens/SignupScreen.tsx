import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import AppLayout from '../components/AppLayout';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import { spacing } from '../theme/spacing';
import { colors } from '../theme/colors';
import { resendVerificationEmail } from '../services/firebaseAuth';

type Props = NativeStackScreenProps<any>;

const PRIVACY_URL =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? `${window.location.origin}/privacy-policy.html`
    : 'https://irstimesheet.com/privacy-policy.html';

const SignupScreen: React.FC<Props> = ({ route, navigation }) => {
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const role = route.params?.role ?? 'Employee';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const signup = useAuthStore((s) => s.signup);

  const scrollToFormField = (y: number) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    });
  };

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing fields', 'Please enter your name, email, and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      await signup(email.trim().toLowerCase(), password, name.trim(), role);
      setShowVerification(true);
      Alert.alert('Account created', 'Please check your email and click the verification link to activate your account.');
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Signup failed', error?.message || 'Could not create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      Alert.alert('Verification email sent', 'Please check your email for the verification link.');
    } catch (error: any) {
      Alert.alert('Resend failed', error?.message || 'Could not resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AppLayout safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + spacing.sm : 24}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>IRS</Text>
            </View>
            <View style={styles.logoMeta}>
              <Text style={styles.logoTitle}>IRS Timesheet</Text>
              <Text style={styles.logoSub}>Infrastructure Renewal Services</Text>
            </View>
          </View>

          <View style={styles.card}>
            {showVerification ? (
              <>
                <View style={styles.emailIconWrap}>
                  <View style={styles.emailIconCircle}>
                    <Text style={styles.emailIconText}>✉</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle}>Check your inbox</Text>
                <Text style={styles.verificationText}>
                  We sent a verification link to{'\n'}<Text style={styles.emailHighlight}>{email}</Text>
                </Text>
                <Text style={styles.verificationHint}>
                  Click the link in the email to activate your account. Check spam if you don't see it.
                </Text>
                <AppButton
                  label={isResending ? 'Resending...' : 'Resend verification email'}
                  onPress={handleResendVerification}
                  disabled={isResending}
                  variant="secondary"
                  fullWidth
                />
                <TouchableOpacity
                  style={styles.backToLogin}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backToLoginText}>← Back to sign in</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>Create account</Text>
                <Text style={styles.cardSubtitle}>Join your team on IRS Timesheet</Text>

                <View style={styles.formGap}>
                  <AppTextInput
                    label="Full name"
                    placeholder="Your full name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    onFocus={() => scrollToFormField(0)}
                  />
                  <AppTextInput
                    label="Email address"
                    placeholder="name@company.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => scrollToFormField(60)}
                  />
                  <AppTextInput
                    label="Password"
                    placeholder="Create a strong password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => scrollToFormField(180)}
                    showPasswordToggle
                  />
                </View>

                <AppButton
                  label={isSubmitting ? 'Creating account...' : 'Create account'}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  fullWidth
                />

                <TouchableOpacity
                  style={styles.backToLogin}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backToLoginText}>Already have an account? Sign in</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity
            onPress={async () => {
              try {
                if (Platform.OS === 'web') {
                  Linking.openURL(PRIVACY_URL);
                } else {
                  await WebBrowser.openBrowserAsync(PRIVACY_URL);
                }
              } catch (e) {
                Alert.alert('Error', 'Could not open Privacy Policy.');
              }
            }}
            style={styles.privacyLink}
            activeOpacity={0.7}
          >
            <Text style={styles.privacyLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing.xl * 1.5,
    paddingBottom: spacing.xl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: 14,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  logoText: {
    color: '#FFFFFF',
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  logoMeta: { flex: 1 },
  logoTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  logoSub: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  formGap: { gap: 4 },
  emailIconWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emailIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailIconText: {
    fontSize: 28,
  },
  verificationText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emailHighlight: {
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  verificationHint: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 19,
  },
  backToLogin: {
    marginTop: spacing.md,
    alignSelf: 'center',
    paddingVertical: 4,
  },
  backToLoginText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.primary,
  },
  privacyLink: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    paddingVertical: 4,
  },
  privacyLinkText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});

export default SignupScreen;
