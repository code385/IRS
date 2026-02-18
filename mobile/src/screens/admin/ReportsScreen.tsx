import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AppLayout from '../../components/AppLayout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';
import { useTimesheetStore, TimesheetStatus } from '../../store/timesheetStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

const statusColors: Record<TimesheetStatus, string> = {
  Draft: colors.textSecondary,
  Submitted: colors.warning,
  Approved: colors.success,
  Rejected: '#DC2626',
};

const ReportsScreen: React.FC<Props> = ({ navigation }) => {
  const weeks = useTimesheetStore((s) => s.weeks);
  const isLoading = useTimesheetStore((s) => s.isLoading);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);

  useEffect(() => {
    loadWeeks();
  }, [loadWeeks]);

  const employees = Array.from(new Set(weeks.map((w) => w.employeeName).filter(Boolean)));
  const activeEmployee = selectedEmployee ?? (employees[0] ?? null);

  const filteredWeeks = useMemo(
    () => (activeEmployee ? weeks.filter((w) => w.employeeName === activeEmployee) : weeks),
    [weeks, activeEmployee],
  );

  const handleCardPress = useCallback(
    (weekId: string) => {
      navigation.navigate('AdminTimesheetDetail', { weekId });
    },
    [navigation],
  );

  const renderCard = useCallback(
    ({ item }: { item: typeof filteredWeeks[0] }) => {
      const totalHours = item.days.reduce((s, d) => s + d.hours, 0);
      const statusColor = statusColors[item.status] || colors.textSecondary;

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleCardPress(item.id)}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.employeeName}>{item.employeeName || 'Unknown'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.weekLabel}>
              {item.label} – {item.weekStart}
            </Text>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursLabel}>Total</Text>
              <Text style={styles.hoursValue}>{totalHours.toFixed(1)} h</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.tapHint}>Tap to view & edit</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleCardPress],
  );

  return (
    <AppLayout>
      <Text style={styles.title}>Timesheets</Text>

      <View style={styles.filtersRow}>
        <View style={styles.filter}>
          <Text style={styles.filterLabel}>Filter by employee</Text>
          <View style={styles.filterBox}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setIsEmployeeOpen((p) => !p)}
            >
              <Text style={styles.filterValue}>{activeEmployee ?? 'All employees'}</Text>
              <Text style={styles.dropdownArrow}>{isEmployeeOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {isEmployeeOpen && (
              <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedEmployee(null);
                    setIsEmployeeOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItem}>All employees</Text>
                </TouchableOpacity>
                {employees.map((e) => (
                  <TouchableOpacity
                    key={e}
                    onPress={() => {
                      setSelectedEmployee(e);
                      setIsEmployeeOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItem}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </View>

      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      <FlatList
        data={filteredWeeks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderCard}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No timesheets</Text>
            </View>
          ) : null
        }
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    ...typography.screenTitle,
    marginBottom: spacing.md,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  filter: {
    flex: 1,
  },
  filterLabel: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  filterBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  filterValue: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownArrow: {
    color: colors.textSecondary,
  },
  dropdownList: {
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: spacing.sm,
    color: colors.textSecondary,
  },
  loading: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  list: {
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  employeeName: {
    ...typography.sectionTitle,
    fontSize: 17,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 12,
  },
  cardBody: {
    paddingVertical: spacing.xs,
  },
  weekLabel: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursLabel: {
    ...typography.body,
  },
  hoursValue: {
    fontWeight: '700',
    fontSize: 18,
    color: colors.primary,
  },
  cardFooter: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tapHint: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
  },
});

export default ReportsScreen;
