# App de Asesoría Financiera — Diseño Funcional v0.6

_Última actualización: 24 nov 2026 · Estado: borrador para iterar · v0.6: el "check-in" pasa a llamarse **Cierre de mes**. v0.5: configuración desde cero y todos los parámetros configurables (sección 5.0); los datos de Camilo pasan a datos de prueba (Anexo A)_

---

## 1. Objetivo y alcance

**Objetivo v1:** reemplazar el Excel "Cuentas 2026" de Camilo con una app móvil (Android primero, iOS después) que:

1. Muestre el estado financiero del hogar (patrimonio, liquidez, deudas, obligaciones) con mínima digitación.
2. Dé **consejos automáticos** a partir de los datos (fondo de emergencia, tarjetas, metas, provisiones).
3. Funcione como **consejero de compras** ("¿lo compro?") con base en el contexto real.
4. Maneje el **presupuesto compartido con Cata** y el reparto proporcional al ingreso.

**Usuario v1:** Camilo es el único que usa la app; él registra también el ingreso de Cata y los gastos compartidos (hogar de 2 personas, 1 dispositivo, sin sincronización). La generalización a otros usuarios es posterior, pero el modelo de datos se diseña desde ya pensando en un *hogar con miembros*.

---

## 2. Principios de diseño

| # | Principio | Implicación |
|---|---|---|
| P1 | **Fotos, no transacciones** | El registro base es un *cierre de mes* periódico de saldos, no cada gasto. El gasto se infiere. |
| P2 | **Fricción mínima** | Cierre de mes ≤ 2 min. Registrar un gasto es opcional y solo para lo grande o fuera de lo normal. |
| P3 | **Números deterministas** | Todo cálculo lo hace código con reglas fijas. El LLM solo redacta y explica, nunca calcula. |
| P4 | **Pocos consejos, accionables** | Máx. 3 consejos por cierre de mes, cada uno con diagnóstico, número y acción. |
| P5 | **Contexto Colombia** | COP/USD nativos con TRM, perfil de contratista, provisión de renta y planilla. |
| P6 | **Privacidad primero** | Datos locales en el dispositivo y backup opcional a Google Drive. Sin servidor propio en v1. |

---

## 3. Modelo de datos

```
Hogar
 ├─ Miembro (nombre, perfil_ingreso: empleado | contratista | independiente)
 │   └─ Ingreso (monto, moneda, tipo: fijo | variable, frecuencia)
 ├─ Cuenta (nombre, entidad, moneda, liquidez, dueño: miembro | compartida, es_inversion)
 ├─ Snapshot (fecha, TRM)
 │   └─ SaldoCuenta (cuenta, saldo, aporte_periodo?)
 │   └─ SaldoDeuda (deuda, saldo)
 ├─ Deuda (nombre, tipo, dirección, tasa?, unidad_tasa: EM | EA?, cuota?, plazo?)
 ├─ Obligacion (concepto, monto, frecuencia, quién_paga, medio_pago, compartida: bool)
 ├─ GastoProrrateado (concepto, costo, duración_meses, dueño)  → mensual = costo / duración
 ├─ Provision (concepto, monto_anual, fecha_pago, apartado_actual)
 ├─ Meta (nombre, monto_objetivo, fecha_objetivo, prioridad, aporte_mensual, cuentas_asociadas)
 ├─ Consejo (regla_id, severidad, mensaje, fecha, estado: nuevo | visto | descartado | resuelto)
 └─ ConsultaCompra (descripción, precio, medio_pago, cuotas?, tipo: necesidad | gusto, resultado)
```

**Enumeraciones clave**

- `Cuenta.liquidez`: `inmediata` (Nequi, Davivienda, Wise, efectivo) · `con_fecha` (CDT; guarda la fecha de vencimiento) · `volatil` (Trii, acciones, cripto).
- `Deuda.tipo`: `tarjeta_credito` · `hipoteca` · `credito_consumo` · `informal` (familia o amigos).
- `Deuda.dirección`: `debo` · `me_deben` (Acreedores).

> **Decisión vs. Excel:** hoy la hoja "Proyecciones" mezcla deudas (Deuda Madre, Tarjeta Nu) con pagos del mes (Cuota, Admon, Servicios) dentro de "Pasivos". En la app, el **patrimonio neto solo descuenta deudas**. Las obligaciones mensuales son flujo y se usan para la liquidez de corto plazo y el presupuesto.

---

## 4. Métricas (definiciones)

| Métrica | Fórmula |
|---|---|
| Activos (COP) | Σ saldo_cuenta × (TRM si es USD) + Σ deudas `me_deben` |
| Pasivos | Σ deudas `debo` |
| **Patrimonio neto (PN)** | Activos − Pasivos |
| **Liquidez disponible** | Σ cuentas `inmediata` − tarjetas de crédito − obligaciones pendientes del mes |
| Gastos fijos mensuales (GFM) | Σ obligaciones mensuales que me corresponden + Σ gastos prorrateados + Σ provisiones / 12 |
| Gasto total del hogar (GTH) | Σ gastos compartidos + Σ gastos personales de todos los miembros (excluye líneas de ahorro: vacaciones, inversiones) |
| **Meses de colchón** | Liquidez disponible / GTH |
| Carga de deuda | Σ cuotas de deuda / ingreso mensual del miembro |
| Tasa de ahorro real | Ahorro real del periodo / ingreso del periodo |

### 4.1 Gasto inferido (núcleo de P1)

Entre dos snapshots _t−1_ y _t_:

```
ΔPN               = PN_t − PN_{t−1}
efecto_cambiario  = Σ saldo_USD_{t−1} × (TRM_t − TRM_{t−1})
rend_inversiones  = Σ (saldo_t − saldo_{t−1} − aporte_periodo)   [solo cuentas volátiles]
ahorro_real       = ΔPN − efecto_cambiario − rend_inversiones
gasto_inferido    = ingresos_del_periodo − ahorro_real
desviación        = gasto_inferido − gasto_presupuestado
```

> Lo que cambia por la TRM o por la valorización de Trii **no es gasto ni ahorro**. Por eso, para las cuentas volátiles el cierre de mes pregunta "¿aportaste este mes?".

---

## 5. Módulos del MVP

### 5.0 Parámetros configurables
Todos se editan en **Ajustes** y tienen un valor por defecto. Ningún valor personal queda fijo en el código.

| Parámetro | Default | Opciones / rango | Lo usan |
|---|---|---|---|
| Meses mínimos de fondo de emergencia | 4 | 1–12 | C01, M8 |
| Base del fondo | Gasto total del hogar | Gasto total del hogar · Mi parte (mi % de compartidos + mis personales) | Meses de colchón, C01, M8 |
| Cuentas que cuentan como liquidez | Todas las de liquidez `inmediata` | Interruptor por cuenta | Liquidez disponible |
| Nivel alto de C01 | < 2 meses | 0–mínimo | C01 |
| Día del cierre de mes | 8 | 1–28 | M5 |
| Reintento del recordatorio | 2 días | 1–7 | M5 |
| Proporción de reparto | Automática por ingreso | Automática · Manual (%) | M4 |
| Tasa por tarjeta o crédito | — (se pide al usarla) | % EM o % EA | M8, C04 |
| Umbral TC vs. ingreso (C02) | 30% | 0–100% | C02 |
| Ahorro real mínimo vs. plan (C03) | 70% | 0–100% | C03 |
| Carga de deuda máxima (C04) | 40% | 0–100% | C04 |
| Aviso de provisión (C05) | 60 días | 0–180 | C05 |
| Plata quieta (C06) | > 2 × GFM | múltiplo | C06 |
| Aviso de CDT (C07) | 15 días | 1–60 | C07 |
| Deuda informal sin movimiento (C09) | 3 snapshots | 1–12 | C09 |
| Máx. consejos visibles | 3 | 1–5 | M7 |
| Enfriamiento de consejo descartado | 60 días | 7–180 | M7 |
| Rojo por intereses en un *gusto* | > 10% del precio | % | M8 |
| Amarillo por retraso de meta | > 4 semanas | semanas | M8 |
| Ventana de provisión cercana | 30 días | días | M8 |
| Meta contra la que se mide el retraso | Auto: la de mayor prioridad sin cumplir | Auto · Meta específica | M8, regla de prioridad |

### M1 — Configuración inicial (desde cero)
- **RF-1.1** Asistente manual por pasos: miembros e ingresos → cuentas con saldo inicial (crea el primer snapshot) → deudas → obligaciones, gastos prorrateados y provisiones → metas → parámetros (con defaults precargados).
- **RF-1.2** Todos los pasos excepto ingresos y al menos una cuenta se pueden saltar y completar después desde Ajustes.
- **RF-1.3** La app funciona con datos parciales: un consejo que necesita un dato que falta no se dispara; en su lugar aparece "Completa {dato} para activar este análisis".
- **CA:** configuración mínima (1 ingreso, 1 cuenta, 1 obligación) en ≤ 5 min; con datos parciales la app no muestra errores ni consejos con números vacíos.

### M2 — Cuentas y patrimonio
- **RF-2.1** CRUD de cuentas con moneda y liquidez.
- **RF-2.2** TRM automática del día (API pública), editable a mano.
- **RF-2.3** Pantalla Inicio: PN, liquidez disponible, meses de colchón, variación frente al snapshot anterior y la tendencia de los últimos 12 snapshots.
- **RF-2.4** Alertar cuando un CDT esté por vencer, según el parámetro "Aviso de CDT" (default 15 días, sección 5.0).

### M3 — Deudas, obligaciones, provisiones y gastos prorrateados
- **RF-3.1** CRUD de deudas en ambas direcciones, incluidas las informales (Deuda Madre, Acreedores).
- **RF-3.2** CRUD de obligaciones con quién paga, medio de pago y si es compartida.
- **RF-3.3** Gastos prorrateados: se ingresa costo y duración, y la app calcula el valor mensual (ej. Piloskin 90.000 / 4 meses = 22.500/mes).
- **RF-3.4** Provisiones (impuesto de renta, planilla, impuesto del apto, SOAT): monto anual, fecha y cuánto va apartado.

### M4 — Hogar y reparto proporcional
- **RF-4.1** Proporción de cada miembro = ingreso_miembro / ingreso_total del hogar (recalculada cuando cambia un ingreso; se puede fijar a mano).
- **RF-4.2** Le corresponde = Σ gastos compartidos × proporción.
- **RF-4.3** Balance de reparto = lo que el miembro paga directamente en gastos compartidos − lo que le corresponde. La app muestra "Cata le debe X a Camilo" o al revés.
- **RF-4.4** Presupuesto personal de cada miembro = lo que le corresponde + sus gastos personales.
- **CA (datos de prueba, Anexo A):** gastos compartidos 7.160.000, proporción 61/39 → Camilo 4.367.600, Cata 2.792.400.
- **v1:** Camilo registra el ingreso de Cata, los gastos compartidos que ella paga y su presupuesto personal (opcional). La privacidad entre miembros pasa a v2, cuando Cata tenga su propio usuario. Por defecto la liquidez solo cuenta las cuentas del usuario principal.

### M5 — Cierre de mes
- **RF-5.1** Recordatorio en el día del mes configurado (default 8). Si ese día no se hace el cierre de mes, la app vuelve a recordar según el reintento configurado.
- **RF-5.1b** Cada snapshot queda con la fecha en que se hizo; los periodos van de un cierre de mes al siguiente (≈ mensuales).
- **RF-5.2** Lista de cuentas y deudas con el saldo anterior precargado. El usuario solo corrige los números.
- **RF-5.3** Para las cuentas volátiles, pregunta "¿aportaste este periodo?".
- **RF-5.4** Al guardar, la app calcula el gasto inferido y la desviación, y corre el motor de consejos (M7).
- **CA:** un cierre de mes de 10 cuentas sin cambios toma ≤ 30 s; con cambios, ≤ 2 min.

### M6 — Metas
- **RF-6.1** CRUD de metas con monto, fecha, prioridad y aporte mensual.
- **RF-6.2** Avance = Σ saldo de las cuentas asociadas (o un apartado manual).
- **RF-6.3** Proyección: fecha estimada en que se llega a la meta al ritmo actual de aporte.
- **RF-6.4** Las metas tienen dos tipos: `acumular` (llegar a un monto en una fecha) y `aporte_recurrente` (cumplir un aporte mensual; el avance se mide como % de meses cumplidos).

**Regla de prioridad:** el consejero recomienda dirigir el excedente del mes a la meta de mayor prioridad que no esté cumplida. En "¿Lo compro?" el retraso se mide contra esa meta (configurable en 5.0).

### M7 — Motor de consejos automáticos
Se ejecuta al terminar cada cierre de mes y una vez por semana para lo que depende de fechas.

| ID | Regla | Disparador (configurable) | Severidad | Mensaje modelo |
|---|---|---|---|---|
| C01 | Fondo de emergencia | meses_colchón < mínimo configurado | Alta si < nivel alto, Media si no | "Tu liquidez cubre {n} meses. Tu mínimo es {min}: te faltan {faltante}." |
| C02 | Tarjeta creciendo | saldo TC sube en 2 snapshots seguidos, o supera el 30% del ingreso | Alta | "{tarjeta} pasó de {a} a {b}. ¿La estás pagando completa?" |
| C03 | Ahorro por debajo del plan | ahorro_real < 70% del planeado | Media | "Esperábamos +{plan} y fue +{real}. Hay {dif} sin explicar." |
| C04 | Carga de deuda | cuotas / ingreso > 40% | Media | "Tus cuotas se llevan el {pct}% del ingreso." |
| C05 | Provisión atrasada | apartado < (meses transcurridos / 12) × monto_anual | Alta si faltan ≤ 60 días | "Para {provisión} deberías llevar {esperado} y llevas {actual}." |
| C06 | Plata quieta | > 2 × GFM en una cuenta sin rendimiento durante 2+ snapshots | Baja | "Tienes {monto} en {cuenta} sin rendir." |
| C07 | CDT por vencer | vence en ≤ 15 días | Media | "Tu CDT de {monto} vence el {fecha}." |
| C08 | Meta atrasada | fecha proyectada > fecha objetivo | Media | "A este ritmo llegas a {meta} el {fecha_proy} ({n} meses tarde)." |
| C09 | Deuda informal sin movimiento | saldo igual en 3+ snapshots | Baja | "{deuda} no ha cambiado en 3 meses." |

**Reglas del motor**
- Máximo 3 consejos visibles, ordenados por severidad y luego por impacto en COP.
- **Enfriamiento:** un consejo descartado no vuelve a salir en 60 días, salvo que su severidad suba.
- Un consejo se resuelve solo cuando su disparador deja de cumplirse.
- El LLM recibe `{regla, datos calculados}` y devuelve una redacción natural. Si el LLM falla, se usa el mensaje modelo.

### M8 — "¿Lo compro?"
**Entrada:** descripción, precio (COP o USD), medio de pago (contado / TC / cuotas n), tipo (necesidad / gusto).

**Evaluación (determinista):**
```
liquidez_post      = liquidez_disponible − precio        [si es de contado]
liquidez_post      = liquidez_disponible                 [si es con tarjeta o a cuotas: solo aumenta la deuda]
colchón_post       = liquidez_post / GTH
intereses          = cuota × n − precio,   cuota = P·i / (1 − (1+i)^−n)   [i = tasa mensual de la TC]
retraso_meta(sem)  = precio / aporte_mensual_meta_prioritaria × 4,33
provisión_cercana  = ¿hay provisión u obligación grande en ≤ 30 días sin cubrir?
```

**Semáforo:**
- 🔴 **Rojo:** colchón_post < mínimo configurado, o hay una provisión cercana sin cubrir, o es un *gusto* a cuotas con intereses > 10% del precio.
- 🟡 **Amarillo:** colchón_post ≥ mínimo pero la compra retrasa la meta prioritaria más de 4 semanas, o hay intereses > 0.
- 🟢 **Verde:** ninguna de las anteriores.

**Salida:** semáforo + 1–2 frases con el costo de oportunidad ("Puedes, pero retrasa tu meta {meta} ~{n} semanas") + una alternativa si aplica ("De contado te ahorras {intereses}"). Se pueden hacer preguntas de seguimiento en chat sobre el resultado.

**Tasas:** se configuran por tarjeta o crédito; la app guarda la tasa en la unidad que da el usuario (EM o EA) y convierte.

**CA:**
- Misma entrada con los mismos datos → mismo semáforo (determinismo).
- (Anexo A) Compra de 2.200.000 en TC Rappi a 12 cuotas (i = 2,1%) → cuota ≈ 209.311, intereses ≈ 311.730 (14,2% del precio). Si es *gusto* → 🔴; si es *necesidad* → 🟡.
- 2,1% EM ingresado como EA debe mostrar 28,32% (± 0,01).

---

## 6. Flujos principales

1. **Primera vez:** asistente de configuración (M1) → Inicio con los primeros consejos (o con lo que falta por completar).
2. **Mensual:** notificación → cierre de mes → resumen (PN, gasto inferido, desviación) → consejos.
3. **Puntual:** botón "¿Lo compro?" en Inicio → formulario de 4 campos → semáforo.
4. **Ocasional:** registrar un gasto grande o fuera de lo normal (opcional), que explica parte de la desviación.

---

## 7. Fuera de alcance v1 (backlog v2+)

- Captura automática de gastos leyendo las notificaciones bancarias (solo Android, NotificationListenerService).
- Cuentas de usuario, sincronización en la nube y uso multi-dispositivo entre miembros (Cata como usuaria propia).
- Importador del Excel / Google Sheets ("Cuentas 2026") con historial de snapshots.
- Integración con Open Finance o los bancos.
- Gastos de grupo y vacas (eso ya lo cubre Splitwise).
- Recomendación de productos de inversión específicos (riesgo regulatorio con la SFC; posicionar la app como educación y coaching financiero).

---

## 8. Decisiones técnicas preliminares

| Tema | Propuesta | Razón |
|---|---|---|
| Framework | React Native + Expo (TypeScript) | Un solo código para Android e iOS; aprovecha lo que Camilo ya sabe de TS |
| Almacenamiento | SQLite local (expo-sqlite) | Privacidad, sin servidor |
| Backup | Exportar/importar a Google Drive | Recuperación y migración entre dispositivos |
| TRM | API pública de datos abiertos | Automática y editable |
| LLM | API llamada solo para redactar consejos y el chat de "¿lo compro?" | P3: los números no dependen del LLM |
| Pruebas | Unitarias de fórmulas y reglas + E2E de flujos | Las reglas de M7 y M8 son ideales para pruebas parametrizadas |

---

## 9. Decisiones

| # | Tema | Decisión | Impacto |
|---|---|---|---|
| D1 | Uso de Cata | No usa la app en v1 | Sin sincronización; Camilo registra todo (M4) |
| D2 | Origen de los datos | Camilo configura todo desde cero; no hay importador en v1 | M1 = asistente manual; importador al backlog |
| D3 | Parametrización | Todo valor personal (fondo, base del fondo, tasas, metas, día de cierre de mes, umbrales) es configurable | Sección 5.0 |
| D4 | Liquidez | Por defecto solo cuentan las cuentas del usuario principal | Liquidez disponible, C01, M8 |
| D5 | Deudas informales | Se registran sin cuota ni plan de pagos | C09 |
| D6 | Compra en "¿Lo compro?" | De contado reduce la liquidez; con tarjeta o a cuotas no la cambia, solo aumenta la deuda | M8 (`liquidez_post`, `colchón_post`) |

**Preguntas abiertas** (ninguna bloquea el inicio del desarrollo):
- Aporte mensual del fondo de emergencia: sin él no se puede calcular `retraso_meta` cuando la meta prioritaria es el fondo (M8).

---

## Anexo A — Datos de prueba (configuración de referencia de Camilo, nov 2026)

Se usan como fixtures para pruebas y como ejemplo; no van fijos en la app.

| Parámetro / dato | Valor |
|---|---|
| Día de cierre de mes | 8 |
| Meses mínimos de fondo | 4 |
| Tasa TC Rappi | 2,1% EM (≈ 28,32% EA) |
| Tasa TC Nu | 2,12% EM (≈ 28,63% EA) |
| Ingresos del hogar | Camilo 8.790.000 · Cata 5.100.000 (+ bono 500.000) → reparto 61/39 |
| Gastos compartidos | 7.160.000/mes → Camilo 4.367.600 · Cata 2.792.400 |
| Gasto total del hogar | ≈ 9.900.000/mes (compartidos 7.160.000 + personales Camilo 2.255.000 + personales Cata 485.000; sin líneas de ahorro) |
| Fondo con base "hogar" | 4 × 9,9M ≈ 39,6M |
| Fondo con base "mi parte" | 4 × (4,37M + 2,26M) ≈ 26,5M |

**Metas de prueba (en orden de prioridad):**

| # | Meta | Tipo | Objetivo |
|---|---|---|---|
| 1 | Fondo de emergencia | acumular | Según la base elegida |
| 2 | Viaje a Japón | acumular | 30M · oct 2027 · aporte 500 mil/mes |
| 3 | Abonos extra a la hipoteca | aporte_recurrente | 400–450 mil/mes |
| 4 | Aporte a inversiones | aporte_recurrente | 500 mil/mes |

**Casos esperados:**
- Reparto: 7.160.000 a 61/39 → 4.367.600 / 2.792.400.
- M8: 2.200.000 en TC Rappi a 12 cuotas → cuota ≈ 209.311, intereses ≈ 311.730 (14,2%) → 🔴 si es *gusto*, 🟡 si es *necesidad*.
- Conversión: 2,1% EM → 28,32% EA (± 0,01).
- C08: meta Japón con saldo 0 y 500 mil/mes desde dic 2026 → ~5M a sep 2027; se dispara "meta atrasada" (se necesitan ~3M/mes).
