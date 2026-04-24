import React from 'react';
import { StatusBar, StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  safeAreaEdges?: Edge[];
};

const DEFAULT_MOBILE_EDGES: Edge[] = ['left', 'right'];

const AppLayout: React.FC<Props> = ({ children, style, safeAreaEdges = DEFAULT_MOBILE_EDGES }) => {
  // ✅ Web par SafeAreaView issues avoid karne ke liye
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webOuter}>
        <View style={[styles.inner, style]}>{children}</View>
      </View>
    );
  }

  // ✅ Mobile (Android / iOS)
  return (
    <SafeAreaView style={styles.outer} edges={safeAreaEdges}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={[styles.inner, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Mobile wrapper
  outer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Web wrapper (no SafeAreaView / StatusBar)
  webOuter: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
  },

  // Shared inner container
  inner: {
    flex: 1,
    paddingHorizontal: Platform.OS === 'web' ? spacing.lg : spacing.md,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    overflow: 'visible',
  },
});

export default AppLayout;
