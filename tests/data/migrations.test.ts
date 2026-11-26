import { getTableConfig, SQLiteTable } from 'drizzle-orm/sqlite-core';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import * as schema from '@/data/schema';

// Protege contra olvidar `npm run db:generate` después de cambiar el esquema.
const dir = join(__dirname, '../../src/data/migrations');
const allSql = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => readFileSync(join(dir, f), 'utf8'))
  .join('\n');

const tables = (Object.values(schema) as unknown[]).filter(
  (v): v is SQLiteTable => v instanceof SQLiteTable,
);

describe('migraciones', () => {
  test('el esquema tiene tablas', () => {
    expect(tables.length).toBe(15);
  });

  test.each(tables.map((t) => [getTableConfig(t).name, t] as const))(
    'la tabla %s y sus columnas están en las migraciones',
    (name, table) => {
      expect(allSql).toContain(`CREATE TABLE \`${name}\``);
      for (const col of getTableConfig(table).columns) {
        expect(allSql).toContain(`\`${col.name}\``);
      }
    },
  );
});
