import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { exportCsvAsFile } from '../../utils/csvExport';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import AppDropdown from '../../components/AppDropdown';
import { useTimesheetStore, WeekTimesheet } from '../../store/timesheetStore';
import { useUserStore } from '../../store/userStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
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

  useEffect(() => {
    loadWeeks();
    loadUsers();
  }, [loadWeeks, loadUsers]);

  const employeesFromWeeks = Array.from(
    new Map(
      weeks.map((w) => [w.employeeId, { id: w.employeeId, name: w.employeeName || 'Unknown' }])
    ).values()
  );
  const employees = employeesFromWeeks.length > 0
    ? employeesFromWeeks
    : users.filter((u) => u.role === 'Employee' || u.role === 'Manager').map((u) => ({ id: u.id, name: u.name }));
  const employeeOptions = employees.map((e) => e.name);
  const selectedEmployee = employees.find((e) => e.name === selectedEmployeeName) || employees[0];
  const employeeWeeks = weeks.filter((w) => w.employeeId === selectedEmployee?.id);

  useEffect(() => {
    setSelectedWeekIds(new Set());
  }, [selectedEmployee?.id]);

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

  const clearSelection = useCallback(() => {
    setSelectedWeekIds(new Set());
  }, []);

  const handleExport = useCallback(async () => {
    if (!selectedEmployee || !employeeOptions.length) {
      Alert.alert('Select employee', 'Please select an employee first. No timesheet data available.');
      return;
    }
    const toExport = employeeWeeks.filter((w) => selectedWeekIds.has(w.id));
    if (toExport.length === 0) {
      Alert.alert('Select weeks', 'Please select at least one week to export.');
      return;
    }

    setIsExporting(true);
    try {
      const rows: string[] = [];
      const header = 'Employee,Week End,Week Start,Day,Hours,Status';
      rows.push(header);

      for (const week of toExport) {
        for (const d of week.days) {
          rows.push(
            [
              `"${week.employeeName || selectedEmployee.name}"`,
              `"${week.label}"`,
              `"${week.weekStart}"`,
              `"${d.label}"`,
              d.hours.toFixed(2),
              week.status,
            ].join(',')
          );
        }
      }

      const csv = rows.join('\n');
      const safeName = (selectedEmployee.name || 'employee').replace(/\s+/g, '_');
      const filename = `timesheet_${safeName}_${toExport.length}weeks`;
      await exportCsvAsFile(csv, filename);
    } catch (e: any) {
      Alert.alert('Export failed', e?.message || 'Could not export.');
    } finally {
      setIsExporting(false);
    }
  }, [selectedEmployee, employeeWeeks, selectedWeekIds]);

  const weeksForEmployee = weeks.filter((w) => w.employeeId === selectedEmployee?.id);

  return (
    <AppLayout>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Export timesheet to CSV</Text>
        <Text style={styles.subtitle}>
          Select employee and weeks, then export
        </Text>

        <AppDropdown
          label="Employee"
          value={selectedEmployeeName}
          options={employeeOptions}
          onSelect={setSelectedEmployeeName}
          placeholder="Select employee"
          fullWidth
        />

        {employeeOptions.length === 0 && (
          <Text style={styles.emptyHint}>No timesheet data. Employees need to submit timesheets first.</Text>
        )}

        {selectedEmployee && (
          <>
            <View style={styles.weekSection}>
              <View style={styles.weekSectionHeader}>
                <Text style={styles.sectionTitle}>Select weeks</Text>
                <View style={styles.weekActions}>
                  <TouchableOpacity onPress={selectAllWeeks}>
                    <Text style={styles.link}>Select all</Text>
                  </TouchableOpacity>
                  <Text style={styles.linkSep}>|</Text>
                  <TouchableOpacity onPress={clearSelection}>
                    <Text style={styles.link}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {weeksForEmployee.length === 0 ? (
                <Text style={styles.emptyText}>No timesheets for this employee</Text>
              ) : (
                weeksForEmployee.map((w) => {
                  const totalHours = w.days.reduce((s, d) => s + d.hours, 0);
                  const isSelected = selectedWeekIds.has(w.id);
                  return (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.weekRow, isSelected && styles.weekRowSelected]}
                      onPress={() => toggleWeek(w.id)}
                    >
                      <Text style={styles.weekCheck}>{isSelected ? '☑' : '☐'}</Text>
                      <View style={styles.weekInfo}>
                        <Text style={styles.weekLabel}>
                          {w.label} – {w.weekStart}
                        </Text>
                        <Text style={styles.weekMeta}>
                          {totalHours.toFixed(1)} h | {w.status}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            <AppButton
              label={isExporting ? 'Exporting...' : `Export ${selectedWeekIds.size} week(s)`}
              onPress={handleExport}
              disabled={isExporting || selectedWeekIds.size === 0}
            />
          </>
        )}
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  title: { ...typography.screenTitle, marginBottom: spacing.xs },
  subtitle: { ...typography.body, marginBottom: spacing.lg, color: colors.textSecondary },
  emptyHint: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  weekSection: { marginBottom: spacing.lg },
  weekSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.sectionTitle },
  weekActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  link: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  linkSep: { color: colors.textSecondary },
  emptyText: { ...typography.body, color: colors.textSecondary, fontStyle: 'italic', marginTop: spacing.sm },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekRowSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  weekCheck: { fontSize: 18, marginRight: spacing.sm },
  weekInfo: { flex: 1 },
  weekLabel: { ...typography.body, fontWeight: '500', color: colors.textPrimary },
  weekMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});

export default AdminExportScreen;
