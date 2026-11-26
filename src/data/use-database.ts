import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { db } from './db';
import migrations from './migrations/migrations';

/** Aplica las migraciones pendientes al abrir la app. */
export function useDatabase() {
  return useMigrations(db, migrations);
}
