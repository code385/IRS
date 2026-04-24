import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = {
  title: string;
  subtitle?: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'info' | 'error';
  style?: ViewStyle;
  onPress?: () => void;
  icon?: React.ReactNode;
};

const StatCard: React.FC<Props> = memo(({ title, subtitle, value, tone = 'default', style, onPress, icon }) => {
  const toneStyles = useMemo(() => {
    switch (tone) {
      case 'success': return { valueColor: colors.success, accentBg: colors.successSurface, accentBorder: colors.success };
      case 'warning': return { valueColor: colors.warning, accentBg: colors.warningSurface, accentBorder: colors.warning };
      case 'info':    return { valueColor: colors.info,    accentBg: colors.infoSurface,    accentBorder: colors.info };
      case 'error':   return { valueColor: colors.error,   accentBg: colors.errorSurface,   accentBorder: colors.error };
      default:        return { valueColor: colors.primary,  accentBg: colors.primarySurface, accentBorder: colors.primary };
    }
  }, [tone]);

  const content = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon && <View style={[styles.iconBadge, { backgroundColor: toneStyles.accentBg }]}>{icon}</View>}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <Text style={[styles.value, { color: toneStyles.valueColor }]}>{value}</Text>
      <View style={[styles.accentBar, { backgroundColor: toneStyles.accentBorder }]} />
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
        onPress={onPress}
        android_ripple={{ color: `${colors.primary}10`, borderless: false }}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{content}</View>;
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    fontWeight: '400',
    color: colors.textSecondary,
    flex: 1,
    letterSpacing: 0.1,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
  },
  value: {
    marginTop: spacing.sm,
    fontSize: 26,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 3,
  },
});

export default StatCard;
