import { AdminToastProvider } from '@/contexts/AdminToastContext';
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <AdminToastProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="users" />
        <Stack.Screen name="map" />
        <Stack.Screen name="municipalities" />
      </Stack>
    </AdminToastProvider>
  );
}
