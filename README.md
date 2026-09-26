# Hay Pie Truco 🃏

**Tu mesa. Tu truco. Tu partida en vivo.**

App móvil (iOS + Android) para llevar el marcador de partidas de Truco Argentino, conservar el historial de cada mesa y convertirlo en estadísticas. Diseñada para jugar alrededor de una mesa real: sin cuentas, sin email, sin password. Solo un código y un PIN.

> **Porque cada partida cuenta.**

## Funcionalidades

- **Crear una mesa** — hasta 6 jugadores, se arman automáticamente en 2 equipos (primera mitad vs segunda) con separador visual `VS`.
- **Unirse con código + PIN** — la mesa genera un código único (`TRUCO-XXXXXX`) verificando colisiones; cualquiera se une con el código y el PIN.
- **Modo espectador** — unirse solo con el código permite ver la partida en vivo, el historial y las estadísticas; el PIN solo es necesario para sumar puntos, deshacer y finalizar. Ideal para ver cómo va otra mesa sin poder modificarla.
- **Marcador en vivo** — `+1/+2/+3/+4`, deshacer, y objetivo configurable **15 o 30 puntos**.
- **Partida en vivo entre dispositivos** — si hay conexión, los puntos se replican en tiempo real (Realtime) y cualquier persona de la mesa ve cómo va la partida.
- **Historial** — cada partido queda guardado con equipos, resultado, ganador, objetivo y fecha.
- **Estadísticas** — victorias, derrotas y winrate por jugador.
- **Modo offline / local-first** — funciona sin internet: los datos se guardan localmente y se sincronizan cuando hay conexión.

## Stack

| Capa | Tecnología |
|---|---|
| App | [Expo SDK 57](https://docs.expo.dev) (React Native) + TypeScript |
| Navegación | Expo Router (`src/app/`) |
| Persistencia local | AsyncStorage |
| Backend / sync | [Supabase](https://supabase.com) (Postgres + RLS + Realtime) |

### Acceso sin cuentas

No hay registro ni login personal. La "autenticación" es el **código de mesa + PIN**:

- El PIN se hashea del lado del servidor (`pgcrypto` / `crypt`).
- Cada request REST viaja con el header `request.pin`, que Postgres convierte en el GUC `request.pin`.
- Las políticas de Row Level Security (RLS) validan ese PIN en cada operación.
- El marcador en vivo usa Realtime **Broadcast** en un canal por mesa (`mesa-{id}`).

## Estructura del proyecto

```
src/
  app/                    # Pantallas (Expo Router)
    _layout.tsx
    index.tsx             # Inicio (logo + crear/unirse)
    mesa/
      nueva.tsx           # Crear mesa
      unir.tsx            # Unirse con código
      [id]/
        index.tsx         # Detalle de mesa (+ partida en vivo)
        historial.tsx     # Historial de partidos
        estadisticas.tsx  # Estadísticas por jugador
    partida/[id].tsx      # Marcador + sync en vivo
  components/ui.tsx       # Button, Input, BackButton
  lib/
    storage.ts            # Persistencia local (AsyncStorage)
    mesa.ts               # Lógica de mesa (local-first) 
    sync.ts               # Sync con Supabase + Realtime
    supabase.ts           # Cliente Supabase (por PIN)
  theme.ts                # Paleta de colores
  types/database.ts       # Tipos: Mesa, Player, Match, MatchEvent
supabase/
  migrations/0001_init.sql  # Schema + RLS + funciones (aplicar en Supabase)
.env                        # NO se sube (credenciales)
```

## Requisitos

- Node.js >= 20
- npm (o bun/yarn)
- Cuenta gratuita en [Supabase](https://supabase.com) (solo para el modo multidispositivo)

## Instalación y arranque

```bash
npm install
npx expo start          # dev server (Metro) — escaneá el QR con Expo Go
npx expo start --web    # app en el navegador (http://localhost:8081)
```

En la máquina existe `.npmrc` con `legacy-peer-deps=true`, necesario por un conflicto de peer dependencies de `react-dom` opcional.

### Variables de entorno

Creá un archivo `.env` en la raíz:

```
EXPO_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

> El `.env` está en `.gitignore`: nunca se sube el archivo real.

## Activar el modo multidispositivo (Supabase)

1. Creá un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pegá y ejecutá el contenido de `supabase/migrations/0001_init.sql`.
3. En **Project Settings → API**, copiá:
   - `Project URL`
   - la **anon / publishable key** (nunca la `service_role`).
4. Pega los valores en `.env`.
5. Reiniciá el server: `Ctrl+C` y `npx expo start`.
6. Probalo con dos dispositivos (Expo Go). Si están en redes distintas: `npx expo start --tunnel`.

Sin credenciales reales la app sigue funcionando **100% local**: el código lo detecta (`isSupabaseConfigured`) y cae al modo offline.

## Modelo de datos

```
mesa          -> player          -> match          -> match_event
(id, name,     (id, mesa_id,      (id, mesa_id,     (id, match_id,
 join_code,     name,              target_points,    team, points,
 pin_hash,      created_at)        team_a/b_players, player_id,
 settings,                          team_a/b_score,  created_at)
 created_at)                       winner,
                                   started/finished)
```

Los `match_event` son el timeline de la partida (`+1`, `+2`, `+4`, ...), lo que permite reconstruir cada partido punto a punto.

## Seguridad y privacidad

- No se piden datos personales: nombre, código y PIN alcanzan.
- El PIN se almacena hasheado en la base (nunca en claro en el servidor).
- **Lectura libre por código** (espectador), **escritura solo con PIN**: RLS permite ver equipos, marcador e historial a cualquiera que conozca el código, pero exige el PIN correcto para insertar/actualizar/borrar.
- Broadcast de Realtime solo en canal propio de cada mesa.

## Roadmap (fuera del MVP)

- Resumen de la noche y tarjetas para compartir en WhatsApp.
- Rachas y enfrentamientos (cara a cara).
- Ranking por mesa y logros.
- QR/enlace de invitación para unirse.
- Alertas de red: cola local + resincronización automática.

## Licencia

Ver `LICENSE`.