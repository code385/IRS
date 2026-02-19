import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';

import AppLayout from '../../components/AppLayout';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import AppDropdown from '../../components/AppDropdown';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { useTimesheetStore } from '../../store/timesheetStore';
import { useAuthStore } from '../../store/authStore';
import { getWeekById } from '../../services/firebaseTimesheets';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

/** Given a date, get the Monday of that week (week = Mon–Sun) */
const getMondayOfWeek = (d: Date): Date => {
  const date = new Date(d);
  const dow = date.getDay(); // 0 Sun, 1 Mon...
  const diff = dow === 0 ? 6 : dow - 1;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

/** Format Monday date to DD/MM/YYYY and get week label (Week End – Week Start) */
const formatWeekFromMonday = (monday: Date) => {
  const dd = String(monday.getDate()).padStart(2, '0');
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const yyyy = monday.getFullYear();
  const weekStart = `${dd}/${mm}/${yyyy}`;

  const end = new Date(monday);
  end.setDate(end.getDate() + 6);

  const dd2 = String(end.getDate()).padStart(2, '0');
  const mm2 = String(end.getMonth() + 1).padStart(2, '0');
  const yyyy2 = end.getFullYear();

  return { weekStart, label: `${dd2}/${mm2}/${yyyy2} – ${weekStart}` };
};

/** Parse DD/MM/YYYY -> Date (local) */
const parseDDMMYYYY = (value: string): Date | null => {
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  const [ddS, mmS, yyyyS] = parts;
  const dd = Number(ddS);
  const mm = Number(mmS);
  const yyyy = Number(yyyyS);
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(yyyy, mm - 1, dd);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Date -> yyyy-mm-dd for web input */
const toYYYYMMDD = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const DailyTimesheetScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isNarrow = width < 720;
  const modalMaxWidth = Math.min(520, width - 32);

  const user = useAuthStore((s) => s.user);

  const [companyName, setCompanyName] = useState('Infrastructure Renewal Services');
  const [contractorName, setContractorName] = useState('Infrastructure Renewal Services');
  const [site, setSite] = useState('');
  const [jobTask, setJobTask] = useState('');
  const [reference, setReference] = useState('');
  const [asset, setAsset] = useState('');
  const [onStandby, setOnStandby] = useState<'Yes' | 'No'>('No');
  const [permitRequired, setPermitRequired] = useState<'Yes' | 'No'>('No');

  const submitWeek = useTimesheetStore((s) => s.submitWeek);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  // ✅ IMPORTANT FIX: Never return object from zustand selector (causes infinite loop)
  const getDayDraft = useTimesheetStore((s: any) => s.getDayDraft);
  const dayDrafts = useTimesheetStore((s: any) => s.dayDrafts);

  const getDraftDay = useCallback(
    (weekId: string, dayId: string) => {
      if (typeof getDayDraft === 'function') {
        return getDayDraft(weekId, dayId) ?? null;
      }
      const d1 = dayDrafts?.[weekId]?.[dayId];
      if (d1) return d1;
      const d2 = dayDrafts?.[weekId]?.days?.[dayId];
      if (d2) return d2;
      return null;
    },
    [getDayDraft, dayDrafts]
  );

  const defaultWeek = useMemo(() => {
    const monday = getMondayOfWeek(new Date());
    return formatWeekFromMonday(monday);
  }, []);

  const [weekStart, setWeekStart] = useState(defaultWeek.weekStart);
  const [selectedWeekLabel, setSelectedWeekLabel] = useState(defaultWeek.label);

  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [webDateValue, setWebDateValue] = useState<string>(() => toYYYYMMDD(new Date()));

  const startDate = useMemo(() => parseDDMMYYYY(weekStart) ?? new Date(), [weekStart]);

  const weekEndDate = useMemo(() => {
    const d = new Date(startDate.getTime());
    d.setDate(d.getDate() + 6);
    return d;
  }, [startDate]);

  const weekEndId = useMemo(() => {
    const yyyy = weekEndDate.getFullYear();
    const mm = String(weekEndDate.getMonth() + 1).padStart(2, '0');
    const dd = String(weekEndDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, [weekEndDate]);

  const weekEndLabel = useMemo(() => {
    const dd = String(weekEndDate.getDate()).padStart(2, '0');
    const mm = String(weekEndDate.getMonth() + 1).padStart(2, '0');
    const yyyy = weekEndDate.getFullYear();
    return `Weekend of ${dd}/${mm}/${yyyy}`;
  }, [weekEndDate]);

  const weekRangeLabel = useMemo(() => {
    const endDd = String(weekEndDate.getDate()).padStart(2, '0');
    const endMm = String(weekEndDate.getMonth() + 1).padStart(2, '0');
    const endYyyy = weekEndDate.getFullYear();
    const [dd, mm, yyyy] = weekStart.split('/');
    return `Week ${endDd}/${endMm}/${endYyyy} – ${dd}/${mm}/${yyyy}`;
  }, [weekStart, weekEndDate]);

  const [existingWeek, setExistingWeek] = useState<any>(null);

  const loadExistingWeek = useCallback(async () => {
    if (!user?.id) return;
    try {
      const week = await getWeekById(weekEndId);
      if (week && week.employeeId === user.id) setExistingWeek(week);
      else setExistingWeek(null);
    } catch {
      setExistingWeek(null);
    }
  }, [user?.id, weekEndId]);

  useEffect(() => {
    loadExistingWeek();
  }, [loadExistingWeek]);

  useFocusEffect(
    useCallback(() => {
      loadExistingWeek();
    }, [loadExistingWeek])
  );

  const applySelectedDate = useCallback((selectedDate: Date) => {
    const monday = getMondayOfWeek(selectedDate);
    const { weekStart: ws, label } = formatWeekFromMonday(monday);
    setWeekStart(ws);
    setSelectedWeekLabel(label);
  }, []);

  const openWeekPicker = useCallback(() => {
    setTempDate(startDate);
    if (Platform.OS === 'web') setWebDateValue(toYYYYMMDD(startDate));
    setShowPicker(true);
  }, [startDate]);

  const days = useMemo(() => {
    const labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const ids = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const base = new Date(startDate.getTime());

    return labels.map((name, index) => {
      const d = new Date(base.getTime());
      d.setDate(base.getDate() + index);

      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();

      const dayId = ids[index];
      const draftDay = getDraftDay(weekEndId, dayId);
      const existingDay = existingWeek?.days?.find((day: any) => day.id === dayId);

      const hoursNum = Number(draftDay?.hours ?? existingDay?.hours ?? 0);

      return {
        id: dayId,
        label: `${name}, ${dd}/${mm}/${yyyy}`,
        hours: hoursNum.toFixed(2),
        initialDayData: draftDay ?? existingDay ?? undefined,
      };
    });
  }, [startDate, existingWeek, weekEndId, getDraftDay]);

  const handleSubmitWeek = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }

    const hasHours = days.some((d) => parseFloat(d.hours) > 0);
    if (!hasHours) {
      Alert.alert('No hours', 'Please add at least one day with hours before submitting.');
      return;
    }

    if (existingWeek && existingWeek.status !== 'Draft') {
      Alert.alert('Cannot submit', 'This timesheet has already been submitted.');
      return;
    }

    try {
      await submitWeek(weekEndId);
      await loadWeeks(user.id);
      Alert.alert('Submitted', 'Timesheet submitted to manager successfully.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to submit timesheet. Please try again.');
    }
  };

  return (
    <AppLayout>
      <ScrollView
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>New Timesheet – {weekRangeLabel}</Text>
        <Text style={styles.caption}>Employee: {user?.name ?? 'Employee'}</Text>

        <Text style={styles.sectionTitle}>General information</Text>

        <View style={styles.grid}>
          <View style={[styles.field, isNarrow ? styles.full : styles.half]}>
            <AppTextInput
              label="Company name"
              placeholder="Infrastructure Renewal Services"
              value={companyName}
              onChangeText={setCompanyName}
            />
          </View>

          <View style={[styles.field, isNarrow ? styles.full : styles.half]}>
            <AppTextInput label="Site name" placeholder="Enter site name" value={site} onChangeText={setSite} />
          </View>

          <View style={[styles.field, isNarrow ? styles.full : styles.half]}>
            <AppTextInput
              label="Contractor"
              placeholder="Infrastructure Renewal Services"
              value={contractorName}
              onChangeText={setContractorName}
            />
          </View>

          <View style={[styles.field, isNarrow ? styles.full : styles.half]}>
            <AppTextInput label="Job / task" placeholder="Enter job/task" value={jobTask} onChangeText={setJobTask} />
          </View>

          <View style={[styles.field, styles.full]}>
            <Text style={styles.calendarLabel}>Select week</Text>
            <TouchableOpacity style={styles.calendarTouch} onPress={openWeekPicker} activeOpacity={0.85}>
              <View style={styles.calendarRow}>
                <View style={styles.calendarIconWrap}>
                  <Text style={styles.calendarIcon}>📅</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.calendarValue}>{selectedWeekLabel}</Text>
                  <Text style={styles.calendarHint}>Tap to choose a date (week auto-calculates)</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.field, isNarrow ? styles.full : styles.half]}>
            <AppTextInput label="Reference no." placeholder="e.g. 1434" value={reference} onChangeText={setReference} />
          </View>

          <View style={[styles.field, isNarrow ? styles.full : styles.half]}>
            <AppTextInput label="Asset" placeholder="Asset name" value={asset} onChangeText={setAsset} />
          </View>

          <View style={[styles.field, isNarrow ? styles.full : styles.half]}>
            <AppDropdown
              label="On standby this week?"
              value={onStandby}
              options={['Yes', 'No']}
              onSelect={(v) => setOnStandby(v as 'Yes' | 'No')}
            />
          </View>

          <View style={[styles.field, isNarrow ? styles.full : styles.half]}>
            <AppDropdown
              label="Permit to work required?"
              value={permitRequired}
              options={['Yes', 'No']}
              onSelect={(v) => setPermitRequired(v as 'Yes' | 'No')}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Daily entries</Text>

        {existingWeek && existingWeek.status !== 'Draft' && (
          <View style={styles.statusBanner}>
            <Text style={styles.statusText}>
              Status: {existingWeek.status} {existingWeek.status === 'Submitted' ? '(Cannot edit)' : ''}
            </Text>
          </View>
        )}

        {days.map((day) => (
          <TouchableOpacity
            key={day.id}
            style={[
              styles.daySummaryCard,
              parseFloat(day.hours) > 0 && styles.daySummaryCardFilled,
              existingWeek && existingWeek.status !== 'Draft' && styles.daySummaryCardDisabled,
            ]}
            activeOpacity={0.85}
            onPress={() => {
              if (!user?.id) {
                Alert.alert('Error', 'User not logged in.');
                return;
              }
              if (existingWeek && existingWeek.status !== 'Draft') {
                Alert.alert('Cannot edit', 'This timesheet has already been submitted.');
                return;
              }
              navigation.navigate('DayTimesheetEntry', {
                dayId: day.id,
                dayLabel: day.label,
                weekEndId,
                weekEndLabel,
                weekStart,
                initialHours: parseFloat(day.hours) || 0,
                initialDayData: day.initialDayData,
              });
            }}
          >
            <Text style={styles.daySummaryTitle}>{day.label}</Text>
            <Text style={styles.daySummaryHours}>{day.hours} hrs</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.buttonsRow}>
          <AppButton label="Submit timesheet" onPress={handleSubmitWeek} />
        </View>

        <Modal transparent visible={showPicker} animationType="fade" onRequestClose={() => setShowPicker(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPicker(false)} />
          <View style={[styles.modalCard, { width: modalMaxWidth }]}>
            <Text style={styles.modalTitle}>Select a date</Text>
            <Text style={styles.modalSubtitle}>We’ll automatically set the correct week (Mon–Sun).</Text>

            {Platform.OS === 'web' ? (
              <View style={{ marginTop: spacing.md }}>
                <input
                  type="date"
                  value={webDateValue}
                  onChange={(e) => setWebDateValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 12,
                    border: `1px solid ${colors.border}`,
                    fontSize: 16,
                    outline: 'none',
                  }}
                />
              </View>
            ) : (
              <View style={styles.pickerWrap}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                  maximumDate={new Date()}
                  minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 2))}
                  onChange={(event: any, d) => {
                    // ✅ ANDROID FIX: select => close + apply, dismiss => close
                    if (Platform.OS === 'android') {
                      if (event?.type === 'dismissed') {
                        setShowPicker(false);
                        return;
                      }
                      if (d) {
                        setShowPicker(false);
                        applySelectedDate(d);
                      }
                      return;
                    }

                    // iOS: update temp date, Done will apply
                    if (!d) return;
                    setTempDate(d);
                  }}
                />
              </View>
            )}

            {/* ✅ Android pe Done/Cancel buttons hide (because select auto close) */}
            {Platform.OS !== 'android' && (
              <View style={styles.modalActions}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <AppButton label="Cancel" variant="secondary" onPress={() => setShowPicker(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton
                    label="Done"
                    onPress={() => {
                      setShowPicker(false);
                      const selected = Platform.OS === 'web' ? new Date(webDateValue + 'T00:00:00') : tempDate;
                      applySelectedDate(selected);
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        </Modal>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xl },
  title: { ...typography.screenTitle },
  caption: { ...typography.body, marginTop: spacing.xs, marginBottom: spacing.lg },
  sectionTitle: { ...typography.sectionTitle, marginTop: spacing.lg, marginBottom: spacing.sm },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: -spacing.sm,
    marginRight: -spacing.sm,
  },
  field: { paddingLeft: spacing.sm, paddingRight: spacing.sm, marginBottom: spacing.md },
  half: { width: '50%' },
  full: { width: '100%' },

  calendarLabel: { marginBottom: spacing.xs, fontWeight: '700', color: colors.textSecondary, fontSize: 14 },
  calendarTouch: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  calendarRow: { flexDirection: 'row', alignItems: 'center' },
  calendarIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  calendarIcon: { fontSize: 18 },
  calendarValue: { ...typography.body, color: colors.textPrimary, fontWeight: '800' },
  calendarHint: { marginTop: 2, fontSize: 12, color: colors.textSecondary },

  daySummaryCard: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daySummaryCardFilled: { backgroundColor: '#e8f5e9', borderColor: colors.success },
  daySummaryCardDisabled: { opacity: 0.5 },
  daySummaryTitle: { ...typography.body, color: colors.textPrimary },
  daySummaryHours: { fontWeight: '800', color: colors.success },

  statusBanner: {
    backgroundColor: '#fff3cd',
    padding: spacing.sm,
    borderRadius: 10,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#ffeeba',
  },
  statusText: { ...typography.body, color: '#856404', fontWeight: '800' },

  buttonsRow: { marginTop: spacing.lg, marginBottom: spacing.lg },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '22%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  modalTitle: { ...typography.sectionTitle, marginBottom: spacing.xs },
  modalSubtitle: { ...typography.body, color: colors.textSecondary },

  pickerWrap: {
    marginTop: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  modalActions: { flexDirection: 'row', marginTop: spacing.lg },
});

export default DailyTimesheetScreen;
