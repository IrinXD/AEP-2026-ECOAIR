import { Tabs } from 'expo-router';
import { LayoutDashboard, Map as MapIcon, Leaf } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.cardBorder,
            borderTopWidth: 1,
            height: 88,
            paddingBottom: 28,
            paddingTop: 8,
            elevation: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          },
          tabBarActiveTintColor: COLORS.primaryLight,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.3,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color, size }) => (
              <LayoutDashboard size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Geospatial',
            tabBarIcon: ({ color, size }) => (
              <MapIcon size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="recommendation"
          options={{
            title: 'AI Intel',
            tabBarIcon: ({ color, size }) => (
              <Leaf size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
