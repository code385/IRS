import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import { useUserStore, AppUser } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const UserStatsDetailScreen: React.FC<Props> = ({ route }) => {
  const { hideSuperAdmin } = (route.params ?? {}) as { hideSuperAdmin?: boolean };
  const users = useUserStore((s) => s.users);
  const loadUsers = useUserStore((s) => s.loadUsers);
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'Super Admin';

  const filterUsers = (list: AppUser[]) => {
    if (hideSuperAdmin || !isSuperAdmin) {
      return list.filter((u) => u.role !== 'Super Admin');
    }
    return list;
  };

  const filtered = filterUsers(users);
  const active = filtered.filter((u) => u.status === 'Active');
  const inactive = filtered.filter((u) => u.status === 'Inactive');
  const blocked = filtered.filter((u) => u.status === 'Blocked');

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const renderItem = ({ item }: { item: AppUser }) => (
    <View style={styles.row}>
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <View style={[styles.pill, item.status === 'Active' && styles.pillActive, item.status === 'Blocked' && styles.pillBlocked]}>
        <Text style={styles.pillText}>{item.status}</Text>
      </View>
      <Text style={styles.role}>{item.role}</Text>
    </View>
  );

  return (
    <AppLayout>
      <Text style={styles.title}>User status overview</Text>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Active: {active.length}</Text>
        <Text style={styles.summaryText}>Inactive: {inactive.length}</Text>
        <Text style={styles.summaryText}>Blocked: {blocked.length}</Text>
      </View>

      <Text style={styles.sectionTitle}>All users</Text>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    ...typography.screenTitle,
    marginBottom: spacing.md,
  },
  summary: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  summaryText: {
    ...typography.body,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.sm,
  },
  list: { paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: { fontWeight: '600', color: colors.textPrimary },
  email: { ...typography.body, marginTop: 2 },
  role: { fontSize: 12, color: colors.textSecondary },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#e0e0e0',
  },
  pillActive: { backgroundColor: '#dff6dd' },
  pillBlocked: { backgroundColor: '#fde7e9' },
  pillText: { fontSize: 11, fontWeight: '600', color: colors.textPrimary },
});

export default UserStatsDetailScreen;
