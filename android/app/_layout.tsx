// app/_layout.js

import { Stack } from 'expo-router';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="adminDashboard" options={{ title: 'Admin Dashboard' }} />
        <Stack.Screen name="ashaDashboard" options={{ headerShown: false }} />
      </Stack>
      <Toast />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}