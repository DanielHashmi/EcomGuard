import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useSSE } from '../hooks/useSSE';
import { useApi } from '../hooks/useApi';
import { theme } from '../constants/theme';
import { API_URL } from '../config/api';
import StateSync from '../components/StateSync';

export default function RootLayout() {
  // Initialize SSE globally at the root
  useSSE(API_URL);

  const { fetchState } = useApi();
  useEffect(() => {
    fetchState();
  }, []);

  return (
    <>
      {/* Polling reconciler — keeps state correct if SSE drops (FR-038). */}
      <StateSync />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
