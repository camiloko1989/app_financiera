import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Placeholder } from '@/ui/Placeholder';
import { Screen } from '@/ui/Screen';
import { colors, typography } from '@/ui/theme';

export default function InicioScreen() {
  return (
    <Screen title="Inicio">
      <Placeholder phase="fase 4" />
      <Link href="/cierre" style={styles.link}>
        Hacer cierre
      </Link>
      <Link href="/lo-compro" style={styles.link}>
        ¿Lo compro?
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { ...typography.cardTitle, color: colors.accent, paddingVertical: 12 },
});
