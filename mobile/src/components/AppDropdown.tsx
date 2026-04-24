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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <View style={{
      width: 16, height: 16,
      justifyContent: 'center', alignItems: 'center',
      transform: [{ rotate: open ? '180deg' : '0deg' }],
    }}>
      <View style={{ width: 8, height: 8, borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.textMuted, transform: [{ rotate: '45deg' }, { translateY: -2 }] }} />
    </View>
  );
}

const AppDropdown: React.FC<Props> = memo(({ label, value, options, onSelect, placeholder, fullWidth }) => {
  const [isOpen, setIsOpen] = useState(false);

  const displayValue = value || placeholder || 'Select';

  return (
    <View style={[styles.wrapper, fullWidth && styles.fullWidth]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.box, isOpen && styles.boxOpen]}
        onPress={() => setIsOpen((p) => !p)}
        activeOpacity={0.8}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>{displayValue}</Text>
        <ChevronIcon open={isOpen} />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.list}>
          <ScrollView nestedScrollEnabled style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {options.map((opt, index) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.item,
                  opt === value && styles.itemSelected,
                  index === options.length - 1 && styles.itemLast,
                ]}
                onPress={() => {
                  onSelect(opt);
                  setIsOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.itemText, opt === value && styles.itemTextSelected]}>
                  {opt}
                </Text>
                {opt === value && (
                  <View style={styles.checkmark}>
                    <View style={styles.checkmarkLine1} />
                    <View style={styles.checkmarkLine2} />
                  </View>
                )}
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
    marginBottom: 6,
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  box: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boxOpen: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 2,
  },
  value: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: colors.textPrimary,
    flex: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
  list: {
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    maxHeight: 180,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    zIndex: 999,
  },
  scroll: {
    maxHeight: 180,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemSelected: {
    backgroundColor: colors.primarySurface,
  },
  itemText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: colors.textPrimary,
    flex: 1,
  },
  itemTextSelected: {
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  checkmark: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkLine1: {
    position: 'absolute',
    width: 5,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }, { translateX: -2 }, { translateY: 1 }],
  },
  checkmarkLine2: {
    position: 'absolute',
    width: 9,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }, { translateX: 2 }],
  },
});

export default AppDropdown;
