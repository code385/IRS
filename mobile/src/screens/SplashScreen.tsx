import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import AppButton from '../components/AppButton';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && user) {
      navigation.replace('Main');
    }
  }, [user, isLoading, navigation]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>IRS</Text>
          </View>
        </View>
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
        <Text style={styles.loadingText}>Loading your workspace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>IRS</Text>
          </View>
          <View style={styles.logoDot} />
        </View>
        <Text style={styles.brand}>Infrastructure Renewal Services</Text>
        <Text style={styles.tagline}>Timesheet & Approvals Platform</Text>
      </View>

      <View style={styles.middleSection}>
        <View style={styles.featureRow}>
          <View style={styles.featureDot} />
          <Text style={styles.featureText}>Real-time timesheet submissions</Text>
        </View>
        <View style={styles.featureRow}>
          <View style={styles.featureDot} />
          <Text style={styles.featureText}>Manager approvals & review workflow</Text>
        </View>
        <View style={styles.featureRow}>
          <View style={styles.featureDot} />
          <Text style={styles.featureText}>Admin reporting & export</Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <AppButton
          label="Get Started"
          onPress={() => navigation.navigate('Auth', { mode: 'login' })}
          fullWidth
        />
        <Text style={styles.version}>Version 1.0.2</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: spacing.xl,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  logoWrap: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    fontSize: 28,
    letterSpacing: 1,
  },
  logoDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  brand: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  middleSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textSecondary,
  },
  bottomSection: {
    gap: 8,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 4,
  },
  spinner: {
    marginTop: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
  },
});

export default SplashScreen;
