import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import AppLayout from '../components/AppLayout';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';
import { resendVerificationEmail } from '../services/firebaseAuth';

type Props = NativeStackScreenProps<any>;

const PRIVACY_URL =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? `${window.location.origin}/privacy-policy.html`
    : 'https://irstimesheet.com/privacy-policy.html';

const SignupScreen: React.FC<Props> = ({ route, navigation }) => {
  const role = route.params?.role ?? 'Employee';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const signup = useAuthStore((s) => s.signup);

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
    <AppLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.appTitle}>Create your account</Text>
            <Text style={styles.appSubtitle}>
              {showVerification
                ? 'Check your email and click the verification link to activate your account.'
                : 'Sign up with your name, email, and password to access the app immediately.'}
            </Text>
          </View>
          <View style={styles.card}>
            {showVerification ? (
              <>
                <Text style={styles.title}>Verify your email</Text>
                <Text style={styles.verificationText}>
                  We've sent a verification email to {email}. Please check your inbox and click the link to verify your account.
                </Text>
                <AppButton
                  label={isResending ? 'Resending...' : 'Resend verification email'}
                  onPress={handleResendVerification}
                  disabled={isResending}
                />
                <TouchableOpacity
                  style={styles.backToLogin}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backToLoginText}>Back to login</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <AppTextInput
                  label="Full name"
                  placeholder="Your full name"
                  value={name}
                  onChangeText={setName}
                />
                <AppTextInput
                  label="Email"
                  placeholder="name@company.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <AppTextInput
                  label="Password"
                  placeholder="Create a password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  showPasswordToggle
                />
                <AppButton
                  label={isSubmitting ? 'Creating account…' : 'Create account'}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                />
              </>
            )}
            <TouchableOpacity
              onPress={async () => {
                try {
                  if (Platform.OS === 'web') {
                    Linking.openURL(PRIVACY_URL);
                  } else {
                    await WebBrowser.openBrowserAsync(PRIVACY_URL);
                  }
                } catch (e) {
                  Alert.alert('Error', 'Could not open Privacy Policy. Please check your internet connection.');
                }
              }}
              style={styles.privacyLink}
              activeOpacity={0.7}
            >
              <Text style={styles.privacyLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.lg,
  },
  appTitle: {
    ...typography.screenTitle,
  },
  appSubtitle: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    ...typography.screenTitle,
    marginBottom: spacing.md,
  },
  verificationText: {
    ...typography.body,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  backToLogin: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  backToLoginText: {
    ...typography.body,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  privacyLink: {
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  privacyLinkText: {
    ...typography.body,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

export default SignupScreen;

