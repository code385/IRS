import { TextStyle } from 'react-native';
import { colors } from './colors';

const bold   = { fontFamily: 'Lato_700Bold'    as const };
const regular= { fontFamily: 'Lato_400Regular' as const };

export const typography: { [key: string]: TextStyle } = {
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    ...bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    ...bold,
    color: colors.textPrimary,
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    ...bold,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    ...regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    ...regular,
    color: colors.textMuted,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    ...bold,
    color: colors.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 11,
    fontWeight: '400',
    ...regular,
    color: colors.textMuted,
  },
};
