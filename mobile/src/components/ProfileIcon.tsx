import React, { memo } from 'react';
import { Pressable, Text, View, StyleSheet, Alert, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = {
  userName?: string;
  onLogout: () => void;
};

const ProfileIcon: React.FC<Props> = memo(({ userName, onLogout }) => {
  const initials = userName
    ? userName.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const handlePress = () => {
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
      onPress={handlePress}
      // @ts-ignore
      onClick={handlePress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      hitSlop={10}
      pointerEvents="auto"
    >
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      {userName ? (
        <Text style={styles.name} numberOfLines={1}>{userName.split(' ')[0]}</Text>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    zIndex: 999999,
    elevation: 999999,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null),
  },
  pressed: { opacity: 0.8 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  initials: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    maxWidth: 100,
  },
});

export default ProfileIcon;
