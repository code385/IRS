import React, { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { useTimesheetStore } from '../../store/timesheetStore';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import ProfileIcon from '../../components/ProfileIcon';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const EmployeeHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Keeping loadWeeks call so other screens stay synced (safe even if we hide stats)
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useEffect(() => {
    if (user?.id) loadWeeks(user.id);
  }, [user?.id, loadWeeks]);

  return (
    <AppLayout>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.appTitle}>IRS Timesheet Portal</Text>
          <Text style={styles.appSubtitle}>Employee Dashboard</Text>
        </View>

        <View style={styles.headerRight}>
          <ProfileIcon userName={user?.name ?? 'Employee'} onLogout={logout} />
        </View>
      </View>

      {/* ✅ Buttons only (stats removed) */}
      <View style={[styles.actionsWrap, isWide && styles.actionsWrapWide]}>
        <View style={styles.btnBlock}>
          <AppButton label="New Timesheet" onPress={() => navigation.navigate('DailyTimesheet')} />
        </View>

        <View style={styles.btnBlock}>
          <AppButton
            label="My Timesheets"
            variant="secondary"
            onPress={() => navigation.navigate('MyTimesheets')}
          />
        </View>

        <View style={styles.btnBlock}>
          <AppButton
            label="View Drafts"
            variant="secondary"
            onPress={() => navigation.navigate('DraftTimesheets')}
          />
        </View>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  appSubtitle: {
    color: '#E8F0FF',
    marginTop: spacing.xs,
  },
  headerRight: {
    overflow: 'visible',
  },

  // Buttons container
  actionsWrap: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },

  // On wide screens, keep them a bit narrower and centered (web/tablet)
  actionsWrapWide: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
  },

  btnBlock: {
    width: '100%',
  },
});

export default EmployeeHomeScreen;