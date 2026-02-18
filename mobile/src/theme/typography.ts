import { TextStyle } from 'react-native';
import { colors } from './colors';

const latoBold = { fontFamily: 'Lato_700Bold' as const };
const latoRegular = { fontFamily: 'Lato_400Regular' as const };

export const typography: { [key: string]: TextStyle } = {
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    ...latoBold,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    ...latoBold,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    ...latoRegular,
    color: colors.textSecondary,
  },
};

