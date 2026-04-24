import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import AppLayout from '../../components/AppLayout';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { useTimesheetStore, TimesheetStatus } from '../../store/timesheetStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

const STATUS_CONFIG: Record<TimesheetStatus, { color: string; bg: string }> = {
  Draft:     { color: colors.warning,  bg: colors.warningSurface  },
  Submitted: { color: colors.info,     bg: colors.infoSurface     },
  Approved:  { color: colors.success,  bg: colors.successSurface  },
  Rejected:  { color: colors.error,    bg: colors.errorSurface    },
};

const ReportsScreen: React.FC<Props> = ({ navigation }) => {
  const weeks = useTimesheetStore((s) => s.weeks);
  const isLoading = useTimesheetStore((s) => s.isLoading);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);

  useEffect(() => { loadWeeks(); }, [loadWeeks]);

  const employees = Array.from(
    new Set(weeks.map((w) => w.employeeName).filter((name): name is string => Boolean(name))),
  );
  const activeEmployee = selectedEmployee ?? (employees[0] ?? null);

  const filteredWeeks = useMemo(
    () => (activeEmployee ? weeks.filter((w) => w.employeeName === activeEmployee) : weeks),
    [weeks, activeEmployee],
  );

  const renderCard = useCallback(
    ({ item }: { item: typeof filteredWeeks[0] }) => {
      const totalHours = item.days.reduce((s, d) => s + d.hours, 0);
      const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.Submitted;

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('AdminTimesheetDetail', { weekId: item.id })}
          activeOpacity={0.8}
        >
          <View style={[styles.cardAccent, { backgroundColor: cfg.color }]} />
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.employeeName}>{item.employeeName || 'Unknown'}</Text>
              <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.badgeText, { color: cfg.color }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.weekRange}>{item.label} – {item.weekStart}</Text>
            <Text style={[styles.hours, { color: cfg.color }]}>{totalHours.toFixed(1)} hrs total</Text>
          </View>
          <View style={styles.arrow}>
            <View style={styles.arrowLine} />
            <View style={styles.arrowHead} />
          </View>
        </TouchableOpacity>
      );
    },
    [navigation],
  );

  return (
    <AppLayout>
      <Text style={styles.pageTitle}>Timesheets</Text>

      <View style={styles.filterWrap}>
        <Text style={styles.filterLabel}>Filter by Employee</Text>
        <TouchableOpacity
          style={[styles.filterBox, isEmployeeOpen && styles.filterBoxOpen]}
          onPress={() => setIsEmployeeOpen((p) => !p)}
          activeOpacity={0.8}
        >
          <Text style={styles.filterValue}>{activeEmployee ?? 'All employees'}</Text>
          <Text style={styles.filterChevron}>{isEmployeeOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {isEmployeeOpen && (
          <View style={styles.dropdown}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => { setSelectedEmployee(null); setIsEmployeeOpen(false); }}
              >
                <Text style={[styles.dropdownItemText, !selectedEmployee && styles.dropdownItemActive]}>All employees</Text>
              </TouchableOpacity>
              {employees.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={styles.dropdownItem}
                  onPress={() => { setSelectedEmployee(e); setIsEmployeeOpen(false); }}
                >
                  <Text style={[styles.dropdownItemText, selectedEmployee === e && styles.dropdownItemActive]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {isLoading && <View style={styles.loading}><ActivityIndicator size="small" color={colors.primary} /></View>}

      <FlatList
        data={filteredWeeks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderCard}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No timesheets found</Text>
              <Text style={styles.emptySubtitle}>Employees need to submit timesheets first.</Text>
            </View>
          ) : null
        }
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
  filterWrap: { marginBottom: spacing.md },
  filterLabel: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  filterBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  filterBoxOpen: {
    borderColor: colors.primary,
  },
  filterValue: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  filterChevron: {
    fontSize: 11,
    color: colors.textMuted,
  },
  dropdown: {
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    zIndex: 100,
  },
  dropdownItem: {
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textSecondary,
  },
  dropdownItemActive: {
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  loading: { paddingVertical: spacing.sm, alignItems: 'center' },
  list: { paddingBottom: spacing.xl },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  employeeName: { fontSize: 15, fontFamily: 'Lato_700Bold', fontWeight: '700', color: colors.textPrimary, flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontFamily: 'Lato_700Bold', fontWeight: '700' },
  weekRange: { fontSize: 12, fontFamily: 'Lato_400Regular', color: colors.textMuted, marginBottom: 4 },
  hours: { fontSize: 14, fontFamily: 'Lato_700Bold', fontWeight: '700' },
  arrow: { paddingRight: 14, flexDirection: 'row', alignItems: 'center' },
  arrowLine: { width: 10, height: 1.5, backgroundColor: colors.textMuted, borderRadius: 1 },
  arrowHead: { width: 5, height: 5, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: colors.textMuted, transform: [{ rotate: '45deg' }, { translateX: -2.5 }] },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontFamily: 'Lato_700Bold', fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, fontFamily: 'Lato_400Regular', color: colors.textMuted, textAlign: 'center' },
});

export default ReportsScreen;
