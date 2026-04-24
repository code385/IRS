import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { useTimesheetStore } from '../../store/timesheetStore';
import AppLayout from '../../components/AppLayout';
import ProfileIcon from '../../components/ProfileIcon';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

type ActionCardProps = {
  title: string;
  subtitle: string;
  accentColor: string;
  onPress: () => void;
};

function ActionCard({ title, subtitle, accentColor, onPress }: ActionCardProps) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.actionAccent, { backgroundColor: accentColor }]} />
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.actionArrow}>
        <View style={styles.arrowLine} />
        <View style={styles.arrowHead} />
      </View>
    </TouchableOpacity>
  );
}

const EmployeeHomeScreen: React.FC<Props> = ({ navigation }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useEffect(() => {
    if (user?.id) loadWeeks(user.id);
  }, [user?.id, loadWeeks]);

  const firstName = user?.name?.split(' ')[0] ?? 'Employee';

  return (
    <AppLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hello, {firstName}</Text>
              <Text style={styles.headerSubtitle}>Employee Dashboard</Text>
            </View>
            <ProfileIcon userName={user?.name ?? 'Employee'} onLogout={logout} />
          </View>

          <View style={styles.headerBadge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>IRS Timesheet Portal</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Quick Actions</Text>

        <ActionCard
          title="New Timesheet"
          subtitle="Start a new weekly timesheet entry"
          accentColor={colors.primary}
          onPress={() => navigation.navigate('DailyTimesheet')}
        />
        <ActionCard
          title="My Timesheets"
          subtitle="View submitted and approved timesheets"
          accentColor={colors.success}
          onPress={() => navigation.navigate('MyTimesheets')}
        />
        <ActionCard
          title="View Drafts"
          subtitle="Continue working on saved drafts"
          accentColor={colors.warning}
          onPress={() => navigation.navigate('DraftTimesheets')}
        />
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
  },
  header: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  greeting: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.success,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.85)',
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
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
    overflow: 'hidden',
  },
  actionAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  actionContent: {
    flex: 1,
    paddingVertical: 16,
    paddingLeft: 14,
    paddingRight: spacing.sm,
  },
  actionTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
  },
  actionArrow: {
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowLine: {
    width: 12,
    height: 1.5,
    backgroundColor: colors.textMuted,
    borderRadius: 1,
  },
  arrowHead: {
    width: 6,
    height: 6,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: colors.textMuted,
    transform: [{ rotate: '45deg' }, { translateX: -3 }],
  },
});

export default EmployeeHomeScreen;
