import React, { useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, Platform, TouchableOpacity,
} from 'react-native';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

const ROLE_CONFIG: Record<string, { color: string; bg: string }> = {
  'Super Admin': { color: colors.primary,  bg: colors.primarySurface },
  'Admin':       { color: colors.info,     bg: colors.infoSurface    },
  'Manager':     { color: colors.warning,  bg: colors.warningSurface },
  'Employee':    { color: colors.success,  bg: colors.successSurface },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  Active:   { color: colors.success, bg: colors.successSurface },
  Inactive: { color: colors.textMuted, bg: colors.background   },
  Blocked:  { color: colors.error,   bg: colors.errorSurface   },
};

function UserAvatar({ name }: { name: string }) {
  const initials = name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials || '?'}</Text>
    </View>
  );
}

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

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const confirmDelete = async (id: string, name: string) => {
    const message = `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`;
    if (Platform.OS === 'web') {
      const ok = window.confirm(message);
      if (!ok) return;
      try {
        await deleteUser(id);
        await loadUsers();
        window.alert(`"${name}" has been deleted successfully.`);
      } catch (error: any) {
        window.alert(`Error: ${error?.message || 'Failed to delete user.'}`);
      }
      return;
    }
    Alert.alert('Delete user?', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(id);
            await loadUsers();
            Alert.alert('Deleted', `"${name}" has been deleted.`);
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to delete user.');
          }
        },
      },
    ]);
  };

  return (
    <AppLayout>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>User Accounts</Text>
          <Text style={styles.pageSubtitle}>{filteredUsers.length} member{filteredUsers.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('UserEdit', { mode: 'create' })}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add User</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          removeClippedSubviews
          renderItem={({ item }) => {
            const roleCfg = ROLE_CONFIG[item.role] ?? ROLE_CONFIG.Employee;
            const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.Active;
            const canModify =
              (isSuperAdmin && item.id !== currentUser?.id) ||
              (currentUser?.role === 'Admin' && item.role !== 'Admin' && item.role !== 'Super Admin');

            return (
              <View style={styles.userCard}>
                <View style={styles.userCardMain}>
                  <UserAvatar name={item.name} />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, { backgroundColor: roleCfg.bg }]}>
                        <Text style={[styles.badgeText, { color: roleCfg.color }]}>{item.role}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
                        <Text style={[styles.badgeText, { color: statusCfg.color }]}>{item.status}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('UserEdit', { mode: 'edit', userId: item.id })}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>
                  {canModify && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, item.status === 'Blocked' ? styles.actionBtnGreen : styles.actionBtnOrange]}
                        onPress={() => {
                          const newStatus = item.status === 'Blocked' ? 'Active' : 'Blocked';
                          Alert.alert(
                            newStatus === 'Blocked' ? 'Block user?' : 'Unblock user?',
                            newStatus === 'Blocked' ? 'User will not be able to log in.' : 'User will be able to log in again.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'OK', onPress: async () => {
                                try {
                                  await updateUser(item.id, { status: newStatus });
                                  await loadUsers();
                                } catch (e: any) {
                                  Alert.alert('Error', e?.message || 'Failed.');
                                }
                              }},
                            ]
                          );
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.actionBtnText, item.status === 'Blocked' ? { color: colors.success } : { color: colors.warning }]}>
                          {item.status === 'Blocked' ? 'Unblock' : 'Block'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnRed]}
                        onPress={() => confirmDelete(item.id, item.name)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No users yet</Text>
              <Text style={styles.emptySubtitle}>Tap "Add User" to create the first account.</Text>
            </View>
          }
        />
      )}
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 1,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  list: { paddingBottom: spacing.xl },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  userCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 5,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
  },
  userActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  actionBtnGreen: { backgroundColor: colors.successSurface },
  actionBtnOrange: { backgroundColor: colors.warningSurface },
  actionBtnRed: { backgroundColor: colors.errorSurface },
  actionBtnText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default UserManagementScreen;
