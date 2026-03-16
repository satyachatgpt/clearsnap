import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { GalleryProvider } from './src/context/GalleryContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { TimelineScreen } from './src/screens/TimelineScreen';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { DuplicatesScreen } from './src/screens/DuplicatesScreen';
import { StorageScreen } from './src/screens/StorageScreen';
import { ToolsScreen } from './src/screens/ToolsScreen';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  const { colors, theme } = useTheme();
  return (
    <>
      <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 },
            tabBarActiveTintColor: colors.green,
            tabBarInactiveTintColor: colors.muted,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          }}
        >
          <Tab.Screen name="Timeline" component={TimelineScreen}
            options={{ tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} /> }} />
          <Tab.Screen name="Organise" component={CategoriesScreen}
            options={{ tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }} />
          <Tab.Screen name="Clean" component={DuplicatesScreen}
            options={{ tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} /> }} />
          <Tab.Screen name="Storage" component={StorageScreen}
            options={{ tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart-outline" size={size} color={color} /> }} />
          <Tab.Screen name="Tools" component={ToolsScreen}
            options={{ tabBarIcon: ({ color, size }) => <Ionicons name="construct-outline" size={size} color={color} /> }} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <GalleryProvider>
        <AppNavigator />
      </GalleryProvider>
    </ThemeProvider>
  );
}
