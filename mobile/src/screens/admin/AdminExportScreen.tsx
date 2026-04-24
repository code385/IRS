import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { exportCsvAsFile } from '../../utils/csvExport';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import AppDropdown from '../../components/AppDropdown';
import { useTimesheetStore, WeekTimesheet } from '../../store/timesheetStore';
import { useUserStore } from '../../store/userStore';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const AdminExportScreen: React.FC<Props> = () => {
  const weeks = useTimesheetStore((s) => s.weeks);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);
  const users = useUserStore((s) => s.users);
  const loadUsers = useUserStore((s) => s.loadUsers);

  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');
  const [selectedWeekIds, setSelectedWeekIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => { loadWeeks(); loadUsers(); }, [loadWeeks, loadUsers]);

  const employeesFromWeeks = Array.from(
    new Map(weeks.map((w) => [w.employeeId, { id: w.employeeId, name: w.employeeName || 'Unknown' }])).values()
  );
  const employees = employeesFromWeeks.length > 0
    ? employeesFromWeeks
    : users.filter((u) => u.role === 'Employee' || u.role === 'Manager').map((u) => ({ id: u.id, name: u.name }));
  const employeeOptions = employees.map((e) => e.name);
  const selectedEmployee = employees.find((e) => e.name === selectedEmployeeName) || employees[0];
  const employeeWeeks = weeks.filter((w) => w.employeeId === selectedEmployee?.id);

  useEffect(() => { setSelectedWeekIds(new Set()); }, [selectedEmployee?.id]);
  useEffect(() => {
    if (employees.length > 0 && !selectedEmployeeName) {
      setSelectedEmployeeName(employees[0].name);
    }
  }, [employees.length]);

  const toggleWeek = useCallback((weekId: string) => {
    setSelectedWeekIds((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  }, []);

  const selectAllWeeks = useCallback(() => {
    setSelectedWeekIds(new Set(employeeWeeks.map((w) => w.id)));
  }, [employeeWeeks]);

  const handleExport = useCallback(async () => {
    if (!selectedEmployee || !employeeOptions.length) {
      Alert.alert('Select employee', 'No timesheet data available.');
      return;
    }
    const toExport = employeeWeeks.filter((w) => selectedWeekIds.has(w.id));
    if (toExport.length === 0) {
      Alert.alert('Select weeks', 'Please select at least one week to export.');
      return;
    }
    setIsExporting(true);
    try {
      const header = 'Employee,Week End,Week Start,Day,Hours,Shift,LAFHA,Status';
      const rows: string[] = [header];
      for (const week of toExport) {
        for (const d of week.days) {
          rows.push([
            `"${week.employeeName || selectedEmployee.name}"`, `"${week.label}"`, `"${week.weekStart}"`,
            `"${d.label}"`, d.hours.toFixed(2), d.shiftType || '', d.livingAway || '', week.status,
          ].join(','));
        }
      }
      const safeName = (selectedEmployee.name || 'employee').replace(/\s+/g, '_');
      await exportCsvAsFile(rows.join('\n'), `timesheet_${safeName}_${toExport.length}weeks`);
    } catch (e: any) {
      Alert.alert('Export failed', e?.message || 'Could not export.');
    } finally {
      setIsExporting(false);
    }
  }, [selectedEmployee, employeeWeeks, selectedWeekIds]);

  return (
    <AppLayout>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Export CSV</Text>
        <Text style={styles.pageSubtitle}>Select an employee and weeks to export their timesheet data.</Text>

        <AppDropdown
          label="Employee"
          value={selectedEmployeeName}
          options={employeeOptions}
          onSelect={setSelectedEmployeeName}
          placeholder="Select employee"
          fullWidth
        />

        {employeeOptions.length === 0 && (
          <View style={styles.emptyHint}>
            <Text style={styles.emptyHintText}>No timesheet data available. Employees need to submit timesheets first.</Text>
          </View>
        )}

        {selectedEmployee && employeeWeeks.length > 0 && (
          <>
            <View style={styles.weeksSectionHeader}>
              <Text style={styles.sectionLabel}>Select Weeks</Text>
              <View style={styles.weekActions}>
                <TouchableOpacity onPress={selectAllWeeks} activeOpacity={0.75}>
                  <Text style={styles.actionLink}>Select all</Text>
                </TouchableOpacity>
                <Text style={styles.actionSep}>·</Text>
                <TouchableOpacity onPress={() => setSelectedWeekIds(new Set())} activeOpacity={0.75}>
                  <Text style={styles.actionLink}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>

            {employeeWeeks.map((w) => {
              const totalHours = w.days.reduce((s, d) => s + d.hours, 0);
              const isSelected = selectedWeekIds.has(w.id);
              return (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.weekRow, isSelected && styles.weekRowSelected]}
                  onPress={() => toggleWeek(w.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <View style={styles.checkboxInner} />}
                  </View>
                  <View style={styles.weekInfo}>
                    <Text style={styles.weekLabel}>{w.label} – {w.weekStart}</Text>
                    <Text style={styles.weekMeta}>{totalHours.toFixed(1)} hrs  ·  {w.status}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={styles.exportAction}>
              <AppButton
                label={isExporting ? 'Exporting...' : `Export ${selectedWeekIds.size} week${selectedWeekIds.size !== 1 ? 's' : ''}`}
                onPress={handleExport}
                disabled={isExporting || selectedWeekIds.size === 0}
                fullWidth
              />
            </View>
          </>
        )}

        {selectedEmployee && employeeWeeks.length === 0 && (
          <View style={styles.noWeeks}>
            <Text style={styles.noWeeksText}>No timesheets found for this employee.</Text>
          </View>
        )}
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  pageTitle: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  emptyHint: {
    backgroundColor: colors.warningSurface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.warning}30`,
    marginBottom: spacing.md,
  },
  emptyHintText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.warning,
  },
  weeksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  weekActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionLink: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  actionSep: {
    color: colors.textMuted,
    fontSize: 13,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 12,
  },
  weekRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  weekInfo: { flex: 1 },
  weekLabel: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  weekMeta: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 2,
  },
  exportAction: { marginTop: spacing.sm },
  noWeeks: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  noWeeksText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default AdminExportScreen;
