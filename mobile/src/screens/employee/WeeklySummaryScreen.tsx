import React from 'react';
import { View, Text, Button, FlatList, StyleSheet, Alert } from 'react-native';

const mockWeek = [
  { id: '1', day: 'Mon', date: '18/08/2025', hours: 9.25 },
  { id: '2', day: 'Tue', date: '19/08/2025', hours: 7.75 },
];

const WeeklySummaryScreen: React.FC = () => {
  const totalHours = mockWeek.reduce((sum, d) => sum + d.hours, 0);

  const handleSubmitWeek = () => {
    // TODO: Call POST /timesheets/week/submit
    Alert.alert('Submitted', 'Your weekly timesheet has been submitted to your manager.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Summary</Text>
      <FlatList
        data={mockWeek}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text>{item.day}</Text>
            <Text>{item.date}</Text>
            <Text>{item.hours.toFixed(2)} h</Text>
          </View>
        )}
      />
      <Text style={styles.total}>Total: {totalHours.toFixed(2)} h</Text>
      <Button title="Send report to Manager" onPress={handleSubmitWeek} />
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  total: {
    marginTop: 16,
    marginBottom: 16,
    fontWeight: '600',
  },
});

export default WeeklySummaryScreen;

