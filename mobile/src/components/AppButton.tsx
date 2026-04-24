import React, { memo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
};

const AppButton: React.FC<Props> = memo(({ label, onPress, variant = 'primary', disabled, style, fullWidth }) => {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.label, styles[`${variant}Label` as keyof typeof styles] as any]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowOpacity: 0.04,
    elevation: 1,
  },
  danger: {
    backgroundColor: colors.error,
  },
  ghost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
    color: colors.textOnPrimary,
  },
  primaryLabel: {
    color: colors.textOnPrimary,
  },
  secondaryLabel: {
    color: colors.textPrimary,
  },
  dangerLabel: {
    color: colors.textOnPrimary,
  },
  ghostLabel: {
    color: colors.primary,
  },
});

export default AppButton;
