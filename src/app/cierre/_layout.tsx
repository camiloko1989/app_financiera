import { Stack } from 'expo-router';

import { colors } from '@/ui/theme';

export default function CierreLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
