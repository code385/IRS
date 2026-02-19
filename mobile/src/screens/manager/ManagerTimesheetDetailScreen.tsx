import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { exportCsvAsFile } from '../../utils/csvExport';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { useTimesheetStore, WeekTimesheet, TimesheetStatus } from '../../store/timesheetStore';
import { getWeekById } from '../../services/firebaseTimesheets';
import { getUserById } from '../../services/firebaseUsers';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const statusColors: Record<TimesheetStatus, string> = {
  Draft: colors.textSecondary,
  Submitted: colors.warning,
  Approved: colors.success,
  Rejected: '#DC2626',
};

const ManagerTimesheetDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { width } = useWindowDimensions();
  const isNarrow = width < 720;

  const { weekId } = route.params ?? {};
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);
  const setWeekStatus = useTimesheetStore((s) => s.setWeekStatus);

  const [week, setWeek] = useState<WeekTimesheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');

  const refresh = useCallback(async () => {
    if (!weekId) return;
    setIsLoading(true);
    try {
      await loadWeeks();
      const fetched = await getWeekById(weekId);
      if (fetched) {
        const name = await getUserById(fetched.employeeId).then((u) => u?.name || 'Unknown');
        setWeek({ ...fetched, employeeName: name });
      } else {
        setWeek(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [weekId, loadWeeks]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (isLoading) {
    return (
      <AppLayout>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppLayout>
    );
  }

  if (!week) {
    return (
      <AppLayout>
        <Text style={styles.title}>Timesheet not found</Text>
      </AppLayout>
    );
  }

  const totalHours = week.days.reduce((sum, d) => sum + d.hours, 0);
  const statusColor = statusColors[week.status] || colors.textSecondary;

  const showApprovalActions = week.status === 'Submitted' || week.status === 'Draft';

  const handleEditDay = (d: { id: string; label: string; hours: number }) => {
    navigation.navigate('DayTimesheetEntry', {
      dayId: d.id,
      dayLabel: d.label,
      weekEndId: week.id,
      weekEndLabel: week.label,
      weekStart: week.weekStart,
      employeeIdForEdit: week.employeeId,
      initialHours: d.hours,
      initialDayData: d,
    });
  };

  const handleApprove = async () => {
    try {
      await setWeekStatus(week.id, 'Approved');
      await refresh();
      Alert.alert('Approved', 'Timesheet approved successfully.');
      navigation.navigate('ManagerHome');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to approve.');
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      Alert.alert('Comment required', 'Rejection comment is mandatory. Please explain why this timesheet is rejected.');
      return;
    }
    try {
      await setWeekStatus(week.id, 'Rejected', comment.trim());
      await refresh();
      Alert.alert('Rejected', 'Timesheet rejected successfully.');
      navigation.navigate('ManagerHome');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to reject.');
    }
  };

  const handleExport = async () => {
    const header = 'Employee,Week End,Week Start,Day,Hours,Status';
    const rows = week.days.map((d) =>
      [
        `"${week.employeeName || ''}"`,
        `"${week.label}"`,
        `"${week.weekStart}"`,
        `"${d.label}"`,
        d.hours.toFixed(2),
        week.status,
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    await exportCsvAsFile(csv, `timesheet_${week.employeeName || 'export'}`);
  };

  return (
    <AppLayout>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        <View style={styles.headerCard}>
          <Text style={styles.employeeName}>{week.employeeName || 'Unknown'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{week.status}</Text>
          </View>
        </View>

        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Week</Text>
          <Text style={styles.metaValue}>
            {week.label} – {week.weekStart}
          </Text>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Hours</Text>
          <Text style={styles.totalValue}>{totalHours.toFixed(2)} h</Text>
        </View>

        {week.rejectionComment ? (
          <View style={styles.rejectCard}>
            <Text style={styles.rejectLabel}>Rejection reason</Text>
            <Text style={styles.rejectText}>{week.rejectionComment}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Daily Entries</Text>
        <View style={styles.daysCard}>
          {week.days.map((d) => (
            <TouchableOpacity key={d.id} style={styles.dayRow} onPress={() => handleEditDay(d)} activeOpacity={0.85}>
              <View style={styles.dayMain}>
                <Text style={styles.dayLabel}>{d.label}</Text>
                <Text style={styles.dayHours}>{d.hours.toFixed(2)} h</Text>
              </View>

              <View style={styles.editPill}>
                <Text style={styles.editPillText}>✏️ Edit</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {showApprovalActions ? (
          <>
            <Text style={styles.sectionTitle}>Comment (required for rejection)</Text>

            {/* ✅ FIX: wrapper view */}
            <View style={styles.commentBox}>
              <AppTextInput
                placeholder="Required - explain why you are rejecting"
                multiline
                value={comment}
                onChangeText={setComment}
              />
            </View>

            <View style={[styles.actions, isNarrow && styles.actionsStack]}>
              <View style={[styles.actionCol, isNarrow && styles.actionFull]}>
                <AppButton label="✓ Approve" onPress={handleApprove} />
              </View>
              <View style={[styles.actionCol, isNarrow && styles.actionFull]}>
                <AppButton label="✗ Reject" variant="secondary" onPress={handleReject} />
              </View>
            </View>
          </>
        ) : null}

        <View style={{ marginTop: spacing.md }}>
          <AppButton label="Export CSV" variant="secondary" onPress={handleExport} />
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.screenTitle, marginBottom: spacing.md },

  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  employeeName: { ...typography.sectionTitle, fontSize: 18 },

  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 10 },
  statusText: { fontWeight: '700', fontSize: 14 },

  metaCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaLabel: { ...typography.body, marginBottom: spacing.xs, color: colors.textSecondary },
  metaValue: { ...typography.sectionTitle },

  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  totalLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  totalValue: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: spacing.xs },

  rejectCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  rejectLabel: { ...typography.sectionTitle, marginBottom: spacing.xs, color: '#DC2626' },
  rejectText: { ...typography.body, color: colors.textPrimary },

  sectionTitle: { ...typography.sectionTitle, marginBottom: spacing.sm },

  daysCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dayLabel: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  dayHours: { fontWeight: '800', color: colors.primary },

  editPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  editPillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // ✅ NEW wrapper for AppTextInput
  commentBox: {
    minHeight: 90,
    marginBottom: spacing.md,
  },

  actions: { flexDirection: 'row', marginBottom: spacing.lg },
  actionsStack: { flexDirection: 'column' },
  actionCol: { flex: 1, marginRight: spacing.md },
  actionFull: { marginRight: 0, marginBottom: spacing.md },
});

export default ManagerTimesheetDetailScreen;
