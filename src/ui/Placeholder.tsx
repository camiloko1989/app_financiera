import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from './theme';

/** Marcador temporal mientras la pantalla no está construida. */
export function Placeholder({ phase }: { phase: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>Pantalla en construcción · {phase}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.lg,
  },
  text: { ...typography.body, color: colors.textMuted },
});
