import React, { memo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = TextInputProps & {
  label: string;
  showPasswordToggle?: boolean;
};

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
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.eyeText}>{passwordVisible ? '🙈' : '👁'}</Text>
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
  },
  eyeText: {
    fontSize: 18,
  },
});

export default AppTextInput;

