import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator,
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
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const STATUS_CONFIG: Record<TimesheetStatus, { color: string; bg: string }> = {
  Draft:     { color: colors.warning,  bg: colors.warningSurface  },
  Submitted: { color: colors.info,     bg: colors.infoSurface     },
  Approved:  { color: colors.success,  bg: colors.successSurface  },
  Rejected:  { color: colors.error,    bg: colors.errorSurface    },
};

const AdminTimesheetDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { weekId } = route.params ?? {};
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);
  const setWeekStatus = useTimesheetStore((s) => s.setWeekStatus);

  const [week, setWeek] = useState<WeekTimesheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadWeeks();
      (async () => {
        const fetched = await getWeekById(weekId);
        if (fetched) {
          const name = await getUserById(fetched.employeeId).then((u) => u?.name || 'Unknown');
          setWeek({ ...fetched, employeeName: name });
        } else {
          setWeek(null);
        }
        setIsLoading(false);
      })();
    }, [weekId, loadWeeks])
  );

  if (isLoading) {
    return (
      <AppLayout>
        <View style={styles.loader}><ActivityIndicator size="large" color={colors.primary} /></View>
      </AppLayout>
    );
  }

  if (!week) {
    return (
      <AppLayout>
        <Text style={styles.notFound}>Timesheet not found</Text>
      </AppLayout>
    );
  }

  const totalHours = week.days.reduce((sum, d) => sum + d.hours, 0);
  const cfg = STATUS_CONFIG[week.status] ?? STATUS_CONFIG.Submitted;

  const handleEditDay = (d: { id: string; label: string; hours: number }) => {
    navigation.navigate('DayTimesheetEntry', {
      dayId: d.id, dayLabel: d.label, weekEndId: week.id, weekEndLabel: week.label,
      weekStart: week.weekStart, onStandby: week.onStandby ?? 'No',
      employeeIdForEdit: week.employeeId, initialHours: d.hours, initialDayData: d,
    });
  };

  const handleApprove = async () => {
    try {
      await setWeekStatus(week.id, 'Approved');
      await loadWeeks();
      Alert.alert('Approved', 'Timesheet approved successfully.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to approve.');
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      Alert.alert('Comment required', 'Please add a rejection reason.');
      return;
    }
    try {
      await setWeekStatus(week.id, 'Rejected', comment.trim());
      await loadWeeks();
      Alert.alert('Rejected', 'Timesheet rejected.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to reject.');
    }
  };

  const handleExport = async () => {
    const header = 'Employee,Week End,Week Start,Day,Hours,Shift,LAFHA,Status';
    const rows = week.days.map((d) =>
      [`"${week.employeeName||''}"`, `"${week.label}"`, `"${week.weekStart}"`, `"${d.label}"`, d.hours.toFixed(2), d.shiftType||'', d.livingAway||'', week.status].join(',')
    );
    await exportCsvAsFile([header, ...rows].join('\n'), `timesheet_${week.employeeName||'export'}`);
  };

  return (
    <AppLayout>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryInfo}>
              <Text style={styles.employeeName}>{week.employeeName || 'Unknown'}</Text>
              <Text style={styles.weekRange}>{week.label} – {week.weekStart}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.statusText, { color: cfg.color }]}>{week.status}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalHours.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Hours</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{week.days.filter((d) => d.hours > 0).length}</Text>
              <Text style={styles.statLabel}>Days Worked</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{week.onStandby ?? '-'}</Text>
              <Text style={styles.statLabel}>On Standby</Text>
            </View>
          </View>
        </View>

        {week.rejectionComment && (
          <View style={styles.rejectCard}>
            <Text style={styles.rejectTitle}>Rejection Reason</Text>
            <Text style={styles.rejectText}>{week.rejectionComment}</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Daily Entries</Text>
        <View style={styles.daysCard}>
          {week.days.map((d, index) => (
            <TouchableOpacity
              key={d.id}
              style={[styles.dayRow, index === week.days.length - 1 && styles.dayRowLast]}
              onPress={() => handleEditDay(d)}
              activeOpacity={0.8}
            >
              <View style={styles.dayInfo}>
                <Text style={styles.dayLabel}>{d.label}</Text>
                {d.jobNo && <Text style={styles.dayDetail}>Job: {d.jobNo}</Text>}
                {d.location && <Text style={styles.dayDetail}>Location: {d.location}</Text>}
                {(d.startTime || d.finishTime) && <Text style={styles.dayDetail}>{d.startTime} – {d.finishTime}</Text>}
                {d.shiftType && <Text style={styles.dayDetail}>Shift: {d.shiftType}  LAFHA: {d.livingAway || '-'}</Text>}
              </View>
              <View style={styles.dayRight}>
                <Text style={[styles.dayHours, d.hours > 0 ? styles.dayHoursActive : styles.dayHoursZero]}>
                  {d.hours.toFixed(2)} h
                </Text>
                <View style={styles.editChip}>
                  <Text style={styles.editChipText}>Edit</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {week.status === 'Submitted' && (
          <>
            <Text style={styles.sectionLabel}>Approval Decision</Text>
            <AppTextInput
              label="Rejection Comment (required for rejection)"
              placeholder="Explain why you are rejecting this timesheet..."
              multiline
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
            />
            <View style={styles.decisionRow}>
              <TouchableOpacity style={styles.approveBtn} onPress={handleApprove} activeOpacity={0.8}>
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} activeOpacity={0.8}>
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <AppButton label="Export CSV" variant="secondary" onPress={handleExport} fullWidth />
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 17, fontFamily: 'Lato_400Regular', color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
  },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  summaryInfo: { flex: 1, paddingRight: spacing.sm },
  employeeName: { fontSize: 18, fontFamily: 'Lato_700Bold', fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2 },
  weekRange: { fontSize: 13, fontFamily: 'Lato_400Regular', color: colors.textMuted, marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  statusText: { fontSize: 12, fontFamily: 'Lato_700Bold', fontWeight: '700' },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: 'Lato_700Bold', fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
  statLabel: { fontSize: 10, fontFamily: 'Lato_400Regular', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 1 },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 2 },
  rejectCard: {
    backgroundColor: colors.errorSurface, borderRadius: 12, padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: `${colors.error}30`,
  },
  rejectTitle: { fontSize: 13, fontFamily: 'Lato_700Bold', fontWeight: '700', color: colors.error, marginBottom: 4 },
  rejectText: { fontSize: 14, fontFamily: 'Lato_400Regular', color: colors.textPrimary, lineHeight: 20 },
  sectionLabel: { fontSize: 12, fontFamily: 'Lato_700Bold', fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: spacing.sm },
  daysCard: { backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden', marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  dayRowLast: { borderBottomWidth: 0 },
  dayInfo: { flex: 1, paddingRight: spacing.sm },
  dayLabel: { fontSize: 14, fontFamily: 'Lato_700Bold', fontWeight: '700', color: colors.textPrimary },
  dayDetail: { fontSize: 12, fontFamily: 'Lato_400Regular', color: colors.textMuted, marginTop: 1 },
  dayRight: { alignItems: 'flex-end', gap: 4 },
  dayHours: { fontSize: 14, fontFamily: 'Lato_700Bold', fontWeight: '700' },
  dayHoursActive: { color: colors.success },
  dayHoursZero: { color: colors.textMuted },
  editChip: { backgroundColor: colors.primarySurface, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  editChipText: { fontSize: 11, fontFamily: 'Lato_700Bold', fontWeight: '700', color: colors.primary },
  commentInput: { minHeight: 90, textAlignVertical: 'top' },
  decisionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  approveBtn: { flex: 1, backgroundColor: colors.success, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  approveBtnText: { fontSize: 15, fontFamily: 'Lato_700Bold', fontWeight: '700', color: '#FFFFFF' },
  rejectBtn: { flex: 1, backgroundColor: colors.errorSurface, borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: `${colors.error}50` },
  rejectBtnText: { fontSize: 15, fontFamily: 'Lato_700Bold', fontWeight: '700', color: colors.error },
});

export default AdminTimesheetDetailScreen;
