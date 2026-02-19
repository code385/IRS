import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Share,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';

import AppLayout from '../../components/AppLayout';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';
import { useUserStore, UserRole, UserStatus } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { createUserClientSide } from '../../services/createUserClient';

type Props = NativeStackScreenProps<any>;

const roles: UserRole[] = ['Super Admin', 'Admin', 'Manager', 'Employee'];
const statuses: UserStatus[] = ['Active', 'Inactive', 'Blocked'];

function generatePassword(length: number = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

const UserEditScreen: React.FC<Props> = ({ route, navigation }) => {
  const { width } = useWindowDimensions();
  const isNarrow = width < 720; // responsive breakpoint (web + tablets)

  const { mode, userId } = route.params ?? { mode: 'create' };
  const currentUser = useAuthStore((s) => s.user);

  const users = useUserStore((s) => s.users);
  const loadUsers = useUserStore((s) => s.loadUsers);
  const updateUser = useUserStore((s) => s.updateUser);
  const deleteUser = useUserStore((s) => s.deleteUser);

  const existing = useMemo(() => users.find((u) => u.id === userId), [users, userId]);

  const isSuperAdmin = currentUser?.role === 'Super Admin';

  const canBlock =
    !!existing &&
    existing.id !== currentUser?.id &&
    (isSuperAdmin ||
      (currentUser?.role === 'Admin' &&
        existing.role !== 'Admin' &&
        existing.role !== 'Super Admin'));

  const canDelete =
    !!existing &&
    existing.id !== currentUser?.id &&
    (isSuperAdmin ||
      (currentUser?.role === 'Admin' &&
        existing.role !== 'Admin' &&
        existing.role !== 'Super Admin'));

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Employee');
  const [status, setStatus] = useState<UserStatus>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // ensure list loaded when coming direct to edit
    if (!users?.length) loadUsers();
  }, [users?.length, loadUsers]);

  useEffect(() => {
    if (mode === 'create') {
      setName('');
      setEmail('');
      setPassword('');
      setRole('Employee');
      setStatus('Active');
    } else if (existing) {
      setName(existing.name ?? '');
      setEmail(existing.email ?? '');
      setPassword(''); // do not prefill
      setRole(existing.role ?? 'Employee');
      setStatus(existing.status ?? 'Active');
    }
  }, [mode, existing]);

  const handleGeneratePassword = () => setPassword(generatePassword());

  const showMsg = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const shareCredentials = async (msg: string) => {
    if (Platform.OS === 'web') {
      try {
        const clip = (globalThis as any)?.navigator?.clipboard;
        if (clip?.writeText) {
          await clip.writeText(msg);
          showMsg('Copied ✅', 'Credentials copied to clipboard. Now paste & share via WhatsApp / Email.');
        } else {
          showMsg('Credentials', msg);
        }
      } catch {
        showMsg('Credentials', msg);
      }
      return;
    }

    try {
      await Share.share({ message: msg, title: 'IRS Timesheet Credentials' });
    } catch {
      Alert.alert('Credentials', msg);
    }
  };

  const doResetToLogin = () => {
    navigation.getParent()?.getParent()?.getParent()?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth', params: { screen: 'Login' } }],
      })
    );
  };

  const handleSave = async () => {
    if (!name || !email) {
      showMsg('Missing details', 'Please enter name and email.');
      return;
    }

    // CREATE
    if (mode === 'create') {
      if (!password || password.length < 6) {
        showMsg('Invalid password', 'Please enter a password (min 6 characters) or tap "Generate password".');
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await createUserClientSide({
          email: email.trim().toLowerCase(),
          password,
          name,
          role,
        });

        await loadUsers();

        const creds = result.credentials;
        const msg = creds
          ? `IRS Timesheet – Login credentials\n\nName: ${creds.name}\nEmail: ${creds.email}\nPassword: ${creds.password}\nRole: ${creds.role}\n\nUse these to sign in to the app.`
          : `IRS Timesheet – Login credentials\n\nEmail: ${email.trim().toLowerCase()}\nPassword: ${password}\nRole: ${role}\n\nUse these to sign in to the app.`;

        if (Platform.OS === 'web') {
          await shareCredentials(msg);
          if (!result.adminReloggedIn) doResetToLogin();
          else navigation.goBack();
          return;
        }

        if (!result.adminReloggedIn) doResetToLogin();
        else navigation.goBack();

        Alert.alert(
          'User created successfully! ✅',
          result.message || `New user "${name}" has been created. Tap Share to send credentials.`,
          [{ text: 'OK' }, { text: 'Share credentials', onPress: () => shareCredentials(msg) }]
        );
      } catch (err: any) {
        const m = err?.message || err?.code || 'Failed to create user.';
        showMsg(
          'Error creating user',
          `Error: ${m}\n\nPlease check:\n- Email format is correct\n- Password is at least 6 characters\n- Firebase connection is working`
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // EDIT
    if (existing) {
      setIsSubmitting(true);
      try {
        await updateUser(existing.id, { name, email, role, status });
        await loadUsers();
        showMsg('User updated ✅', 'User details have been saved.');
        navigation.goBack();
      } catch (err: any) {
        showMsg('Error', err?.message || 'Failed to update user.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBlockToggle = async () => {
    if (!existing) return;

    const newStatus: UserStatus = existing.status === 'Blocked' ? 'Active' : 'Blocked';
    const title = newStatus === 'Blocked' ? 'Block user?' : 'Unblock user?';
    const message =
      newStatus === 'Blocked'
        ? 'This user will not be able to log in until unblocked.'
        : 'This user will be able to log in again.';

    if (Platform.OS === 'web') {
      const ok = window.confirm(`${title}\n\n${message}`);
      if (!ok) return;
      try {
        await updateUser(existing.id, { status: newStatus });
        await loadUsers();
        window.alert(newStatus === 'Blocked' ? 'User blocked ✅' : 'User unblocked ✅');
        navigation.goBack();
      } catch (e: any) {
        window.alert(`Error ❌\n\n${e?.message || 'Failed to update user status.'}`);
      }
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'OK',
        onPress: async () => {
          try {
            await updateUser(existing.id, { status: newStatus });
            await loadUsers();
            Alert.alert(newStatus === 'Blocked' ? 'User blocked ✅' : 'User unblocked ✅', '');
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to update user status.');
          }
        },
      },
    ]);
  };

  const handleDelete = async () => {
    if (!existing) return;
    const message = `Are you sure you want to delete "${existing.name}"?\n\nThis action cannot be undone. The user will not be able to log in.`;

    if (Platform.OS === 'web') {
      const ok = window.confirm(message);
      if (!ok) return;
      try {
        await deleteUser(existing.id);
        await loadUsers();
        window.alert(`User deleted ✅\n\n"${existing.name}" has been deleted successfully.`);
        navigation.goBack();
      } catch (e: any) {
        window.alert(`Error ❌\n\n${e?.message || 'Failed to delete user.'}`);
      }
      return;
    }

    Alert.alert('Delete user?', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(existing.id);
            await loadUsers();
            Alert.alert('User deleted ✅', `"${existing.name}" has been deleted successfully.`);
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to delete user.');
          }
        },
      },
    ]);
  };

  return (
    <AppLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* ✅ ScrollView fixes missing buttons on web/small screens */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
        >
          <Text style={styles.title}>{mode === 'create' ? 'Add new user' : 'Edit user'}</Text>

          <View style={styles.form}>
            <AppTextInput label="Name" placeholder="Full name" value={name} onChangeText={setName} />

            <AppTextInput
              label="Email"
              placeholder="user@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {(mode === 'create' || (mode === 'edit' && isSuperAdmin)) && (
              <View style={styles.passwordRow}>
                <View style={styles.passwordInput}>
                  <AppTextInput
                    label={mode === 'create' ? 'Password' : 'New password (optional)'}
                    placeholder={mode === 'create' ? 'Min 6 characters' : 'Leave empty to keep current password'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <View style={{ marginTop: spacing.sm }}>
                  <AppButton
                    label="Generate password"
                    variant="secondary"
                    onPress={handleGeneratePassword}
                  />
                </View>
              </View>
            )}

            {/* ✅ Responsive: narrow screens => column, wide => row */}
            <View style={[styles.row, isNarrow && styles.rowStack]}>
              <View style={[styles.half, isNarrow && styles.full]}>
                <Text style={styles.label}>Role</Text>
                <View style={styles.dropdown}>
                  {(currentUser?.role === 'Super Admin' ? roles : roles.filter((r) => r !== 'Super Admin')).map(
                    (r) => (
                      <Text
                        key={r}
                        style={[styles.option, r === role && styles.optionSelected]}
                        onPress={() => setRole(r)}
                      >
                        {r}
                      </Text>
                    )
                  )}
                </View>
              </View>

              <View style={[styles.half, isNarrow && styles.full, isNarrow && { marginTop: spacing.md }]}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.dropdown}>
                  {(isSuperAdmin ? statuses : statuses.filter((s) => s !== 'Blocked')).map((s) => (
                    <Text
                      key={s}
                      style={[styles.option, s === status && styles.optionSelected]}
                      onPress={() => setStatus(s)}
                    >
                      {s}
                    </Text>
                  ))}
                </View>
              </View>
            </View>

            {/* Actions */}
            {mode === 'edit' && existing && canBlock && (
              <View style={{ marginTop: spacing.md }}>
                <AppButton
                  label={existing.status === 'Blocked' ? 'Unblock user' : 'Block user'}
                  variant="secondary"
                  onPress={handleBlockToggle}
                  disabled={isSubmitting}
                />
              </View>
            )}

            {mode === 'edit' && existing && canDelete && (
              <View style={{ marginTop: spacing.sm }}>
                <AppButton
                  label="Delete user"
                  variant="secondary"
                  onPress={handleDelete}
                  disabled={isSubmitting}
                />
              </View>
            )}

            {/* ✅ This was not visible before due to missing scroll */}
            <View style={{ marginTop: spacing.md }}>
              <AppButton
                label={
                  mode === 'create'
                    ? isSubmitting
                      ? 'Creating…'
                      : 'Create user'
                    : isSubmitting
                      ? 'Saving…'
                      : 'Save changes'
                }
                onPress={handleSave}
                disabled={isSubmitting}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl, // ✅ ensures last button never hides
  },
  title: {
    ...typography.screenTitle,
    marginBottom: spacing.md,
  },
  form: {
    // ❌ gap removed for better cross-platform consistency
  },

  passwordRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: spacing.md,
  },
  passwordInput: {
    width: '100%',
  },

  row: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  rowStack: {
    flexDirection: 'column',
  },
  half: {
    flex: 1,
  },
  full: {
    width: '100%',
    flex: 0,
  },

  label: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  option: {
    paddingVertical: 6,
    color: colors.textSecondary,
  },
  optionSelected: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

export default UserEditScreen;
