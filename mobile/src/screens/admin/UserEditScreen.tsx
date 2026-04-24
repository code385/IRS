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
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';

import AppLayout from '../../components/AppLayout';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import { spacing } from '../../theme/spacing';
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
          ? `IRS Timesheet – Login credentials\n\nName: ${creds.name}\nEmail: ${creds.email}\nPassword: ${creds.password}\nRole: ${creds.role}\n\nYour account is ready. Open the app and sign in with these credentials.`
          : `IRS Timesheet – Login credentials\n\nEmail: ${email.trim().toLowerCase()}\nPassword: ${password}\nRole: ${role}\n\nYour account is ready. Open the app and sign in with these credentials.`;

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
          result.message || `New user "${name}" has been created and can log in immediately.`,
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

  const availableRoles = currentUser?.role === 'Super Admin' ? roles : roles.filter((r) => r !== 'Super Admin');
  const availableStatuses = isSuperAdmin ? statuses : statuses.filter((s) => s !== 'Blocked');

  return (
    <AppLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
        >
          <Text style={styles.pageTitle}>{mode === 'create' ? 'Add New User' : 'Edit User'}</Text>

          <Text style={styles.sectionLabel}>Personal Details</Text>
          <AppTextInput label="Full Name" placeholder="Enter full name" value={name} onChangeText={setName} autoCapitalize="words" />
          <AppTextInput
            label="Email Address"
            placeholder="user@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          {(mode === 'create' || (mode === 'edit' && isSuperAdmin)) && (
            <>
              <Text style={styles.sectionLabel}>Password</Text>
              <AppTextInput
                label={mode === 'create' ? 'Password' : 'New Password (optional)'}
                placeholder={mode === 'create' ? 'Min 6 characters' : 'Leave empty to keep current'}
                value={password}
                onChangeText={setPassword}
                showPasswordToggle
              />
              <AppButton
                label="Generate Random Password"
                variant="secondary"
                onPress={handleGeneratePassword}
                fullWidth
              />
            </>
          )}

          <Text style={styles.sectionLabel}>Role</Text>
          <View style={styles.chipRow}>
            {availableRoles.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, r === role && styles.chipActive]}
                onPress={() => setRole(r)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, r === role && styles.chipTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Status</Text>
          <View style={styles.chipRow}>
            {availableStatuses.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, s === status && styles.chipActive]}
                onPress={() => setStatus(s)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, s === status && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.mainAction}>
            <AppButton
              label={mode === 'create' ? (isSubmitting ? 'Creating...' : 'Create User') : (isSubmitting ? 'Saving...' : 'Save Changes')}
              onPress={handleSave}
              disabled={isSubmitting}
              fullWidth
            />
          </View>

          {mode === 'edit' && existing && canBlock && (
            <AppButton
              label={existing.status === 'Blocked' ? 'Unblock User' : 'Block User'}
              variant="secondary"
              onPress={handleBlockToggle}
              disabled={isSubmitting}
              fullWidth
            />
          )}

          {mode === 'edit' && existing && canDelete && (
            <AppButton
              label="Delete User"
              variant="danger"
              onPress={handleDelete}
              disabled={isSubmitting}
              fullWidth
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  mainAction: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});

export default UserEditScreen;
