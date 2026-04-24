import React, { memo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  count?: number;
  onPress: () => void;
};

const NotificationBell: React.FC<Props> = memo(({ count = 0, onPress }) => {
  return (
    <TouchableOpacity style={styles.bell} onPress={onPress} activeOpacity={0.75}>
      <BellIcon />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const BellIcon: React.FC = () => (
  <View style={styles.bellIcon}>
    <View style={styles.bellTop} />
    <View style={styles.bellBody} />
    <View style={styles.bellBottom} />
  </View>
);

const styles = StyleSheet.create({
  bell: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  bellIcon: {
    width: 16,
    height: 17,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bellTop: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    position: 'absolute',
    top: 0,
  },
  bellBody: {
    width: 14,
    height: 11,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.9)',
    position: 'absolute',
    top: 4,
  },
  bellBottom: {
    width: 16,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 1,
    position: 'absolute',
    bottom: 2,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
  },
});

export default NotificationBell;
