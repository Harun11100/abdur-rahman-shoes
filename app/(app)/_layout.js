import { Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

function CustomHeader() {
  return (
    // Replaced ImageBackground with View for a clean, solid color header
    <View style={styles.headerContainer}>
      {/* Optional: add a title text if needed */}
      <Text style={styles.headerText}></Text>
    </View>
  );
}

export default function RootLayout({ children }) {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        header: () => <CustomHeader />,
        animation: 'slide_from_right',
      }}
    >
      {children}
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 40, // Adjust this value or add padding if handling safe area constraints
    backgroundColor: '#739afa', // Change this hex value to your preferred branding color
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});