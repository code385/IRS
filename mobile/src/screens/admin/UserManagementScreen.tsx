import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

const UserManagementScreen: React.FC<Props> = ({ navigation }) => {
  const currentUser = useAuthStore((s) => s.user);
  const users = useUserStore((s) => s.users);
  const isLoading = useUserStore((s) => s.isLoading);
  const loadUsers = useUserStore((s) => s.loadUsers);
  const updateUser = useUserStore((s) => s.updateUser);
  const deleteUser = useUserStore((s) => s.deleteUser);
  const isSuperAdmin = currentUser?.role === 'Super Admin';

  const filteredUsers = useMemo(
    () => (isSuperAdmin ? users : users.filter((u) => u.role !== 'Super Admin')),
    [users, isSuperAdmin]
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const confirmDelete = async (id: string, name: string) => {
    const message = `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone. The user will not be able to log in.`;

    // ✅ WEB: Alert.alert unreliable -> window.confirm + window.alert
    if (Platform.OS === 'web') {
      const ok = window.confirm(message);
      if (!ok) return;

      try {
        await deleteUser(id);
        await loadUsers();
        window.alert(`User deleted ✅\n\n"${name}" has been deleted successfully.`);
      } catch (error: any) {
        window.alert(`Error ❌\n\n${error?.message || 'Failed to delete user.'}`);
      }
      return;
    }

    // ✅ MOBILE: Alert.confirm
    Alert.alert('Delete user?', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(id);
            await loadUsers();
            Alert.alert('User deleted', `"${name}" has been deleted successfully.`);
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to delete user.');
          }
        },
      },
    ]);
  };

  return (
    <AppLayout>
      <Text style={styles.title}>User accounts</Text>

      <View style={styles.actions}>
        <AppButton
          label="+ Add new user"
          onPress={() => navigation.navigate('UserEdit', { mode: 'create' })}
        />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.lg }}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>

              <View style={styles.meta}>
                <Text style={styles.role}>{item.role}</Text>

                <View
                  style={[
                    styles.statusPill,
                    item.status === 'Blocked' && styles.statusPillBlocked,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'Blocked' && styles.statusTextBlocked,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>

                <Text style={styles.created}>{item.created}</Text>

                {((isSuperAdmin && item.id !== currentUser?.id) ||
                  (currentUser?.role === 'Admin' &&
                    item.role !== 'Admin' &&
                    item.role !== 'Super Admin')) && (
                  <>
                    <AppButton
                      label={item.status === 'Blocked' ? 'Unblock' : 'Block'}
                      variant="secondary"
                      onPress={() => {
                        const title = item.status === 'Blocked' ? 'Unblock user?' : 'Block user?';
                        const msg =
                          item.status === 'Blocked'
                            ? 'This user will be able to log in again.'
                            : 'This user will not be able to log in until unblocked.';

                        // (block/unblock Alert usually works, but we keep mobile style)
                        Alert.alert(title, msg, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'OK',
                            onPress: async () => {
                              try {
                                await updateUser(item.id, {
                                  status: item.status === 'Blocked' ? 'Active' : 'Blocked',
                                });
                                await loadUsers();
                              } catch (error: any) {
                                const em = error?.message || 'Failed to update user status.';
                                Platform.OS === 'web'
                                  ? window.alert(`Error ❌\n\n${em}`)
                                  : Alert.alert('Error', em);
                              }
                            },
                          },
                        ]);
                      }}
                    />

                    <AppButton
                      label="Delete"
                      variant="secondary"
                      onPress={() => confirmDelete(item.id, item.name)}
                    />
                  </>
                )}

                <AppButton
                  label="Edit"
                  variant="secondary"
                  onPress={() =>
                    navigation.navigate('UserEdit', { mode: 'edit', userId: item.id })
                  }
                />
              </View>
            </View>
          )}
        />
      )}
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    ...typography.screenTitle,
    marginBottom: spacing.md,
  },
  actions: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  email: {
    ...typography.body,
  },
  meta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  role: {
    fontWeight: '500',
    color: colors.textPrimary,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: '#dff6dd',
    marginBottom: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  statusPillBlocked: {
    backgroundColor: '#fde7e9',
  },
  statusTextBlocked: {
    color: '#a80000',
  },
  created: {
    ...typography.body,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
});

export default UserManagementScreen;
