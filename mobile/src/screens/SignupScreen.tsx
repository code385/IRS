import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../components/AppLayout';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<any>;

const PRIVACY_URL =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? `${window.location.origin}/privacy-policy.html`
    : 'https://hashtimesheet.web.app/privacy-policy.html';

const SignupScreen: React.FC<Props> = ({ route, navigation }) => {
  const role = route.params?.role ?? 'Employee';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      Alert.alert(
        'Request sent',
        `${role} signup request has been sent to the admin. You will receive an email link to complete your account.`,
      );
      setIsSubmitting(false);
      navigation.goBack();
    }, 600);
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
            <Text style={styles.appTitle}>Request access as {role}</Text>
            <Text style={styles.appSubtitle}>
              Enter your details. An admin will review and send you a login link.
            </Text>
          </View>
          <View style={styles.card}>
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
              label="Additional details"
              placeholder="Optional message for admin (e.g. team, site, manager)"
              multiline
              style={styles.multiline}
              value={notes}
              onChangeText={setNotes}
            />
            <AppButton
              label={isSubmitting ? 'Sending request…' : 'Send signup request'}
              onPress={handleSubmit}
              disabled={isSubmitting}
            />
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
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
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

