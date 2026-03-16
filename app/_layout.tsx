// app/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/utils/theme';
import { GalleryProvider } from '../src/context/GalleryContext';

export default function RootLayout() {
  return (
    <GalleryProvider>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingBottom: 4,
          },
          tabBarActiveTintColor: colors.green,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Timeline',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: 'Categories',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="storage"
          options={{
            title: 'Storage',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pie-chart-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </GalleryProvider>
  );
}
