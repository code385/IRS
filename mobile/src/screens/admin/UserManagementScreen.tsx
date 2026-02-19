import React, { useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Platform } from 'react-native';
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

  const isSuperAdmin = currentUser?.role === 'Super Admin';

  // ✅ Super Admin sees all, Admin hides Super Admin users
  const filteredUsers = useMemo(
    () => (isSuperAdmin ? users : users.filter((u) => u.role !== 'Super Admin')),
    [users, isSuperAdmin]
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const isBlocked = item.status === 'Blocked';

      return (
        <View style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.email}>{item.email}</Text>
          </View>

          <View style={styles.meta}>
            <Text style={styles.role}>{item.role}</Text>

            <View style={[styles.statusPill, isBlocked && styles.statusPillBlocked]}>
              <Text style={[styles.statusText, isBlocked && styles.statusTextBlocked]}>
                {item.status}
              </Text>
            </View>

            <Text style={styles.created}>{item.created}</Text>

            {/* ✅ List page: ONLY Edit button */}
            <View style={styles.btnWrap}>
              <AppButton
                label="Edit"
                variant="secondary"
                onPress={() => navigation.navigate('UserEdit', { mode: 'edit', userId: item.id })}
              />
            </View>
          </View>
        </View>
      );
    },
    [navigation]
  );

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
          contentContainerStyle={styles.listContent}

          // ✅ Cross-platform touch stability
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}

          // optional perf
          removeClippedSubviews={Platform.OS !== 'web'}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          renderItem={renderItem}
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
  listContent: {
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    flex: 1,
    paddingRight: spacing.md,
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
  },
  role: {
    fontWeight: '500',
    color: colors.textPrimary,
  },
  statusPill: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: '#dff6dd',
    marginTop: spacing.xs,
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
    marginTop: spacing.xs,
  },
  btnWrap: {
    marginTop: spacing.xs,
    alignSelf: 'stretch',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
});

export default UserManagementScreen;
