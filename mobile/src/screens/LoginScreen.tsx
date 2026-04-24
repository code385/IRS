import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import AppLayout from '../components/AppLayout';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

const PRIVACY_URL =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? `${window.location.origin}/privacy-policy.html`
    : 'https://irstimesheet.com/privacy-policy.html';

const LoginScreen: React.FC<Props> = ({ route, navigation }) => {
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const scrollToFormField = (y: number) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigation.getParent()?.navigate('Main');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.message || 'Incorrect email or password. Please try again.';
      Alert.alert('Login failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
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
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in to continue to your workspace</Text>

            <View style={styles.formGap}>
              <AppTextInput
                label="Email address"
                placeholder="name@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => scrollToFormField(0)}
              />
              <AppTextInput
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => scrollToFormField(140)}
                showPasswordToggle
              />
            </View>

            <AppButton
              label={isLoading ? 'Signing in...' : 'Sign in'}
              onPress={handleLogin}
              disabled={isLoading}
              fullWidth
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.signupBtn}
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.7}
            >
              <Text style={styles.signupBtnText}>Create an account</Text>
            </TouchableOpacity>
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
  flex: {
    flex: 1,
  },
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
  logoMeta: {
    flex: 1,
  },
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
  formGap: {
    gap: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  signupBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  signupBtnText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textSecondary,
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

export default LoginScreen;
