import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDatabase } from '@/data/use-database';
import { colors, space } from '@/ui/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const { success: dbReady, error: dbError } = useDatabase();

  const ready = (fontsLoaded || fontError) && (dbReady || dbError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  if (dbError) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>No se pudo abrir la base de datos: {dbError.message}</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cierre" />
        <Stack.Screen name="lo-compro" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, justifyContent: 'center', padding: space.xl, backgroundColor: colors.bg },
  errorText: { color: colors.danger.fg, fontSize: 14 },
});
