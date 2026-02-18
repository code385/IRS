import React, { memo } from 'react';
import { Pressable, Text, StyleSheet, Alert, Platform } from 'react-native';
import { spacing } from '../theme/spacing';

type Props = {
  userName?: string;
  onLogout: () => void;
};

const ProfileIcon: React.FC<Props> = memo(({ userName, onLogout }) => {
  const handlePress = () => {
    console.log('PROFILE CLICKED:', Platform.OS);

    if (Platform.OS === 'web') {
      const ok = window.confirm('Are you sure you want to logout?');
      if (ok) onLogout();
      return;
    }

    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: onLogout, style: 'destructive' },
    ]);
  };

  return (
    <Pressable
      // ✅ Web pe sometimes onPress miss hota, onClick always works
      onPress={handlePress}
      // @ts-ignore - RN Web supports onClick
      onClick={handlePress}
      // @ts-ignore
      onPointerDown={handlePress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      hitSlop={10}
      pointerEvents="auto"
    >
      <Text style={styles.icon}>👤</Text>
      {userName ? (
        <Text style={styles.name} numberOfLines={1}>
          {userName}
        </Text>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',

    // ✅ make sure it stays clickable on top
    zIndex: 999999,
    elevation: 999999,

    // ✅ web UX
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null),
  },
  pressed: { opacity: 0.85 },
  icon: { fontSize: 18 },
  name: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    maxWidth: 120,
  },
});

export default ProfileIcon;
