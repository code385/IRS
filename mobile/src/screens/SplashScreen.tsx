import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import AppButton from '../components/AppButton';
import { typography } from '../theme/typography';
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
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>IRS</Text>
        </View>
        <Text style={styles.title}>IRS Timesheet</Text>
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>IRS</Text>
      </View>
      <Text style={styles.title}>Infrastructure Renewal Services</Text>
      <Text style={styles.subtitle}>Digital timesheet & approvals</Text>

      <Text style={styles.intro}>
        Manage employee timesheets, approvals, and reporting in one modern mobile experience. Built
        for field teams, managers, and administrators.
      </Text>

      <View style={styles.loginBtnWrap}>
        <AppButton
          label="Login"
          onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 24,
  },
  title: {
    ...typography.screenTitle,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  intro: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  loginBtnWrap: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  spinner: {
    marginTop: spacing.xl,
  },
});

export default SplashScreen;

