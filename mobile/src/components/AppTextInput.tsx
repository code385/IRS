import React, { memo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = TextInputProps & {
  label: string;
  showPasswordToggle?: boolean;
  error?: string;
};

function EyeIcon({ hidden, size = 20, color = colors.textMuted }: {
  hidden: boolean;
  size?: number;
  color?: string;
}) {
  const pupil = size * 0.28;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: size * 0.92,
        height: size * 0.58,
        borderRadius: size * 0.3,
        borderWidth: 1.6,
        borderColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          width: pupil,
          height: pupil,
          borderRadius: pupil / 2,
          backgroundColor: color,
        }} />
      </View>
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

const AppTextInput: React.FC<Props> = memo(({ label, style, showPasswordToggle, secureTextEntry, error, ...rest }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const effectiveSecure = showPasswordToggle ? !passwordVisible : secureTextEntry;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputContainer,
        !!error && styles.inputContainerError,
        showPasswordToggle && styles.inputRow,
      ]}>
        <TextInput
          style={[styles.input, showPasswordToggle && styles.inputWithIcon, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={effectiveSecure}
          underlineColorAndroid="transparent"
          selectionColor={colors.primary}
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
            <EyeIcon hidden={!passwordVisible} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 6,
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  inputContainer: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
  inputWithIcon: {
    paddingRight: 44,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.sm,
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.error,
  },
});

export default AppTextInput;
