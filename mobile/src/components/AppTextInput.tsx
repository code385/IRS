import React, { memo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = TextInputProps & {
  label: string;
  showPasswordToggle?: boolean;
};

/** Eye icon drawn with pure React Native Views — no external package needed */
function EyeIcon({ hidden, size = 20, color = colors.textSecondary }: {
  hidden: boolean;
  size?: number;
  color?: string;
}) {
  const pupil = size * 0.28;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Eye oval outline */}
      <View style={{
        width: size * 0.92,
        height: size * 0.58,
        borderRadius: size * 0.3,
        borderWidth: 1.6,
        borderColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {/* Pupil */}
        <View style={{
          width: pupil,
          height: pupil,
          borderRadius: pupil / 2,
          backgroundColor: color,
        }} />
      </View>
      {/* Strike-through line when password is visible (eye-off state) */}
      {!hidden && (
        <View style={{
          position: 'absolute',
          width: size * 1.05,
          height: 1.8,
          backgroundColor: color,
          borderRadius: 1,
          transform: [{ rotate: '-32deg' }],
        }} />
      )}
    </View>
  );
}

const AppTextInput: React.FC<Props> = memo(({ label, style, showPasswordToggle, secureTextEntry, ...rest }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const effectiveSecure = showPasswordToggle ? !passwordVisible : secureTextEntry;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={showPasswordToggle ? styles.inputRow : undefined}>
        <TextInput
          style={[styles.input, showPasswordToggle && styles.inputWithIcon, style]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={effectiveSecure}
          {...rest}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setPasswordVisible((v) => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
          >
            <EyeIcon hidden={!passwordVisible} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputWithIcon: {
    flex: 1,
    paddingRight: 44,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.sm,
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppTextInput;
