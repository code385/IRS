import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import { useUserStore, AppUser } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  Active:   { color: colors.success, bg: colors.successSurface },
  Inactive: { color: colors.textMuted, bg: colors.background   },
  Blocked:  { color: colors.error,   bg: colors.errorSurface   },
};

const ROLE_CONFIG: Record<string, { color: string; bg: string }> = {
  'Super Admin': { color: colors.primary,  bg: colors.primarySurface },
  'Admin':       { color: colors.info,     bg: colors.infoSurface    },
  'Manager':     { color: colors.warning,  bg: colors.warningSurface },
  'Employee':    { color: colors.success,  bg: colors.successSurface },
};

const UserStatsDetailScreen: React.FC<Props> = ({ route }) => {
  const { hideSuperAdmin } = (route.params ?? {}) as { hideSuperAdmin?: boolean };
  const users = useUserStore((s) => s.users);
  const loadUsers = useUserStore((s) => s.loadUsers);
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'Super Admin';

  const filtered = (hideSuperAdmin || !isSuperAdmin)
    ? users.filter((u) => u.role !== 'Super Admin')
    : users;

  const active = filtered.filter((u) => u.status === 'Active').length;
  const inactive = filtered.filter((u) => u.status === 'Inactive').length;
  const blocked = filtered.filter((u) => u.status === 'Blocked').length;

  useEffect(() => { loadUsers(); }, [loadUsers]);

  return (
    <AppLayout>
      <Text style={styles.pageTitle}>User Overview</Text>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.activeCard]}>
          <Text style={[styles.statValue, { color: colors.success }]}>{active}</Text>
          <Text style={[styles.statLabel, { color: colors.success }]}>Active</Text>
        </View>
        <View style={[styles.statCard, styles.inactiveCard]}>
          <Text style={[styles.statValue, { color: colors.textMuted }]}>{inactive}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Inactive</Text>
        </View>
        <View style={[styles.statCard, styles.blockedCard]}>
          <Text style={[styles.statValue, { color: colors.error }]}>{blocked}</Text>
          <Text style={[styles.statLabel, { color: colors.error }]}>Blocked</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>All Users ({filtered.length})</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: AppUser }) => {
          const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.Active;
          const roleCfg = ROLE_CONFIG[item.role] ?? ROLE_CONFIG.Employee;
          return (
            <View style={styles.userRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {item.name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
              </View>
              <View style={styles.userBadges}>
                <View style={[styles.badge, { backgroundColor: roleCfg.bg }]}>
                  <Text style={[styles.badgeText, { color: roleCfg.color }]}>{item.role}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
                  <Text style={[styles.badgeText, { color: statusCfg.color }]}>{item.status}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  activeCard: { backgroundColor: colors.successSurface, borderColor: `${colors.success}30` },
  inactiveCard: { backgroundColor: colors.background, borderColor: colors.border },
  blockedCard: { backgroundColor: colors.errorSurface, borderColor: `${colors.error}30` },
  statValue: {
    fontSize: 28,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  list: { paddingBottom: spacing.xl },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 14,
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
  userBadges: { alignItems: 'flex-end', gap: 4 },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontFamily: 'Lato_700Bold', fontWeight: '700' },
});

export default UserStatsDetailScreen;
