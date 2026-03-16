import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { GalleryProvider } from './src/context/GalleryContext';
import { TimelineScreen } from './src/screens/TimelineScreen';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { StorageScreen } from './src/screens/StorageScreen';
import { colors } from './src/utils/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <GalleryProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
            },
            tabBarActiveTintColor: colors.green,
            tabBarInactiveTintColor: colors.muted,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          }}
        >
          <Tab.Screen
            name="Timeline"
            component={TimelineScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="time-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Categories"
            component={CategoriesScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="grid-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Storage"
            component={StorageScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="pie-chart-outline" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </GalleryProvider>
  );
}
