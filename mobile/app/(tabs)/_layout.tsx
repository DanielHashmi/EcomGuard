import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, Text, View, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import StateSync from '../../components/StateSync';

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <View style={s.iconWrap}>
      <Text style={[s.icon, { color }]}>{icon}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  iconWrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 16, lineHeight: 24 },
});

export default function TabLayout() {
  return (
    <>
      <StateSync />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '700', fontSize: 17, letterSpacing: -0.3 },
          headerShadowVisible: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            height: Platform.OS === 'web' ? 58 : 82,
            paddingBottom: Platform.OS === 'web' ? 8 : 24,
            paddingTop: 8,
            ...theme.shadow.sm,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.3,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: 'Feed',
            tabBarIcon: ({ color }) => <TabIcon icon="📋" color={color} />,
          }}
        />
        <Tabs.Screen
          name="reasoning"
          options={{
            title: 'Reasoning',
            tabBarIcon: ({ color }) => <TabIcon icon="🧠" color={color} />,
          }}
        />
        <Tabs.Screen
          name="actions"
          options={{
            title: 'Actions',
            tabBarIcon: ({ color }) => <TabIcon icon="✅" color={color} />,
          }}
        />
        <Tabs.Screen
          name="report"
          options={{
            title: 'Report',
            tabBarIcon: ({ color }) => <TabIcon icon="📊" color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
