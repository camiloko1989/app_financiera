import { Link } from 'expo-router';

import { Placeholder } from '@/ui/Placeholder';
import { Screen } from '@/ui/Screen';

export default function ResumenScreen() {
  return (
    <Screen title="Resumen del cierre">
      <Placeholder phase="fase 3" />
      <Link href="/" dismissTo>
        Listo, ir al inicio
      </Link>
    </Screen>
  );
}
