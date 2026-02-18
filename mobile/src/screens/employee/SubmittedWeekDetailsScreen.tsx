import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SubmittedWeekDetailsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submitted Week</Text>
      <Text>Status: Submitted</Text>
      <Text style={styles.sectionTitle}>Manager Comments</Text>
      <Text>- No comments yet.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 4,
    fontWeight: '600',
  },
});

export default SubmittedWeekDetailsScreen;

