# App Financiera

App móvil (Android primero) de asesoría financiera personal y del hogar. Local-first: los datos viven en SQLite en el dispositivo.

- Diseño funcional: [`docs/diseno-funcional.md`](docs/diseno-funcional.md)
- Arquitectura: [`docs/arquitectura.md`](docs/arquitectura.md)
- Pantallas: [`docs/pantallas.md`](docs/pantallas.md)

## Desarrollo

```bash
npm install
npm start            # servidor de desarrollo (Expo)
npm run android      # abrir en Android
npm run ci           # typecheck + lint + tests
npm run db:generate  # nueva migración tras cambiar src/data/schema.ts
```

La app usa `expo-sqlite` y fuentes propias; para probarla en un dispositivo hace falta un *development build* (`npx eas-cli@latest build --profile development`) o `npx expo run:android`.

## Estructura

- `src/app/` — rutas (Expo Router)
- `src/domain/` — lógica pura (fase 1)
- `src/data/` — esquema Drizzle, migraciones y repositorios
- `src/ui/` — tema y componentes
- `tests/` — Jest
