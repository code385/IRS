import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = {
  title: string;
  subtitle?: string;
  value: string;
  tone?: 'default' | 'success' | 'warning';
  style?: ViewStyle;
  onPress?: () => void;
};

const StatCard: React.FC<Props> = memo(({ title, subtitle, value, tone = 'default', style, onPress }) => {
  const toneColor = useMemo(
    () => (tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : colors.textPrimary),
    [tone]
  );

  const content = (
    <>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <Text style={[styles.value, { color: toneColor }]}>{value}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={[styles.card, styles.pressable, style]} onPress={onPress}>
        {content}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{content}</View>;
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  pressable: {},
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textSecondary,
  },
  value: {
    marginTop: spacing.sm,
    fontSize: 20,
    fontWeight: '600',
  },
});

export default StatCard;

