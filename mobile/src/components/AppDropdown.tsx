import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
};

const AppDropdown: React.FC<Props> = memo(({ label, value, options, onSelect, placeholder, fullWidth }) => {
  const [isOpen, setIsOpen] = useState(false);

  const displayValue = value || placeholder || 'Select';

  return (
    <View style={[styles.wrapper, fullWidth && styles.fullWidth]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.box}
        onPress={() => setIsOpen((p) => !p)}
        activeOpacity={0.8}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>{displayValue}</Text>
        <Text style={styles.arrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.list}>
          <ScrollView nestedScrollEnabled style={styles.scroll} keyboardShouldPersistTaps="handled">
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.item, opt === value && styles.itemSelected]}
                onPress={() => {
                  onSelect(opt);
                  setIsOpen(false);
                }}
              >
                <Text style={[styles.itemText, opt === value && styles.itemTextSelected]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
    flexBasis: '48%',
  },
  fullWidth: {
    flexBasis: '100%',
  },
  label: {
    marginBottom: spacing.xs,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  box: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  arrow: {
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  list: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    maxHeight: 160,
  },
  scroll: {
    maxHeight: 160,
  },
  item: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemSelected: {
    backgroundColor: `${colors.primary}15`,
  },
  itemText: {
    color: colors.textPrimary,
  },
  itemTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
});

export default AppDropdown;
