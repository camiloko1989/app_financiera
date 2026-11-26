import { Link } from 'expo-router';

import { Placeholder } from '@/ui/Placeholder';
import { Screen } from '@/ui/Screen';

export default function CierreScreen() {
  return (
    <Screen title="Cierre de mes">
      <Placeholder phase="fase 3" />
      <Link href="/cierre/resumen">Guardar y ver resumen</Link>
    </Screen>
  );
}
