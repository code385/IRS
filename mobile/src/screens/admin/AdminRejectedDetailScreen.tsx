import React, { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import { useTimesheetStore, WeekTimesheet } from '../../store/timesheetStore';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const AdminRejectedDetailScreen: React.FC<Props> = ({ navigation }) => {
  const weeks = useTimesheetStore((s) => s.weeks);
  const isLoading = useTimesheetStore((s) => s.isLoading);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useEffect(() => { loadWeeks(); }, [loadWeeks]);

  const rejected = weeks.filter((w) => w.status === 'Rejected');

  const renderCard = useCallback(
    ({ item }: { item: WeekTimesheet }) => {
      const totalHours = item.days.reduce((s, d) => s + d.hours, 0);
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('AdminTimesheetDetail', { weekId: item.id })}
          activeOpacity={0.8}
        >
          <View style={styles.cardAccent} />
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.employeeName}>{item.employeeName || 'Unknown'}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Rejected</Text>
              </View>
            </View>
            <Text style={styles.weekRange}>{item.label} – {item.weekStart}</Text>
            <Text style={styles.hours}>{totalHours.toFixed(1)} hrs total</Text>
            {item.rejectionComment && (
              <View style={styles.reasonWrap}>
                <Text style={styles.reasonLabel}>Rejection reason</Text>
                <Text style={styles.reasonText} numberOfLines={2}>{item.rejectionComment}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [navigation],
  );

  return (
    <AppLayout>
      <Text style={styles.pageTitle}>Rejected Timesheets</Text>
      <Text style={styles.pageSubtitle}>{rejected.length} timesheet{rejected.length !== 1 ? 's' : ''} rejected by manager</Text>

      {isLoading && <View style={styles.loading}><ActivityIndicator size="small" color={colors.primary} /></View>}

      <FlatList
        data={rejected}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderCard}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No rejected timesheets</Text>
              <Text style={styles.emptySubtitle}>All timesheets are in good standing.</Text>
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
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginBottom: spacing.md,
    marginTop: 2,
  },
  loading: { paddingVertical: spacing.sm, alignItems: 'center' },
  list: { paddingBottom: spacing.xl },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
    overflow: 'hidden',
    shadowColor: colors.error,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardAccent: {
    width: 4,
    backgroundColor: colors.error,
  },
  cardBody: { flex: 1, padding: 14 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  employeeName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.errorSurface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.error,
  },
  weekRange: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginBottom: 4,
  },
  hours: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  reasonWrap: {
    marginTop: 8,
    backgroundColor: colors.errorSurface,
    borderRadius: 8,
    padding: 8,
  },
  reasonLabel: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.error,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  reasonText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: colors.textPrimary,
  },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default AdminRejectedDetailScreen;
