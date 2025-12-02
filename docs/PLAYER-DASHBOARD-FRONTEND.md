# Player Dashboard - Implementacion Frontend

Este documento resume los cambios realizados en el frontend para integrarse con el nuevo backend del **Player Dashboard** y detalla la informacion que el juego debe reportar para mantener actualizadas las estadisticas.

## 1. Que quedo implementado

- **Nuevo servicio de estadisticas** (`src/services/player-stats.service.ts`)
  - Consume `GET /api/player-dashboard/summary`.
  - Normaliza la respuesta plana del backend en la estructura usada por la UI (`PlayerStatsSummary`).
  - Calcula porcentajes auxiliares (progreso de niveles, logros, win rate, percentil de ranking) cuando el backend no los envia.
  - Entrega valores por defecto cuando no existen datos para el jugador.
- **Actualizacion de la pagina de perfil** (`src/app/game/profile/page.tsx`)
  - Muestra los datos del nuevo endpoint (tiempos formateados, economia, ranking, streaks...).
  - Anade banner, responsividad y backgrounds suaves para cada card.
  - Presenta duraciones y metricas con formatos consistentes.
- **Gestion automatica de sesiones**
  - `PlayerSessionService` (`src/services/player-session.service.ts`): encapsula `start`, `heartbeat` y `end` contra `/api/player-dashboard/session/*`.
  - `usePlayerSessionStore` (`src/store/usePlayerSessionStore.ts`): acumula las metricas que se envian en los heartbeats.
  - `usePlayerSessionManager` (`src/hooks/usePlayerSessionManager.ts`): inicia una sesion `idle` al entrar a `/game`, envia heartbeats cada 30s, pausa al ocultar la pestana y finaliza (con `keepalive`) al salir.
  - `src/app/game/layout.tsx` usa el hook anterior, por lo que cualquier pagina dentro de `/game` queda cubierta.
- **Activos**
  - Nuevo banner ligero (`public/images/profile-banner.jpg`).
  - Documentacion de referencia del backend (`docs/PLAYER-DASHBOARD.md`) y esta guia complementaria.

## 2. Que debe registrar el juego durante las partidas

Para que las estadisticas se acumulen correctamente, el equipo que implementa el juego debe alimentar el store de sesion antes de cada heartbeat o al finalizar una partida.

### Store disponible

```ts
import { usePlayerSessionStore } from "@/store/usePlayerSessionStore";

// Ejemplo: registrar una partida completada
usePlayerSessionStore.getState().recordGame({
  gamesPlayed: 1,
  score: scoreObtenido,
  coinsEarned: monedasGanadas,
});
```

Tambien se puede usar `setStats` si ya se tienen totales calculados para la sesion actual:

```ts
usePlayerSessionStore.getState().setStats({
  gamesPlayed: partidasEnSesion,
  score: puntajeAcumulado,
  coinsEarned: monedasAcumuladas,
});
```

### Payload esperado por el backend

- `gamesPlayed`: numero de partidas jugadas durante la sesion en curso.
- `score`: puntuacion total acumulada en la sesion.
- `coinsEarned`: monedas obtenidas en la sesion.

> **Importante:** el hook `usePlayerSessionManager` toma estos valores del store cada 30 segundos para enviar el heartbeat y los manda nuevamente al cerrar la sesion (`/session/end`). Si el juego no actualiza el store, los heartbeats enviaran ceros.

### Cuando registrar la informacion

1. **Inicio de sesion de juego:** el hook ya llama internamente a `session/start` con tipo `idle`. Si el juego necesita cambiar a `game`, puede invocar manualmente `PlayerSessionService.start("game")` y pausar o reanudar el manager segun corresponda.
2. **Cada partida terminada:** incrementar los datos en `usePlayerSessionStore` (gamesPlayed, score, coinsEarned).
3. **Ajustes intermedios:** si se quieren reportar avances parciales (por ejemplo cada nivel dentro de la misma partida), actualizar el store antes del siguiente heartbeat.
4. **Salida del juego:** el hook envia automaticamente `session/end` con `keepalive`, pero es recomendable llamar a `usePlayerSessionStore.getState().reset()` cuando se limpie el estado del gameplay.

## 3. Verificacion rapida

1. **Resumen:** visitar `/game/profile` y comprobar que las metricas se muestran sin errores.
2. **Sesion activa:** revisar en la consola del navegador los logs del manager; deberian verse heartbeats cada ~30s.
3. **API:** ejecutar manualmente `GET /api/player-dashboard/summary` y `GET /api/player-dashboard/session/current` para confirmar que los datos recibidos coinciden con lo mostrado en la UI.

Con esto el frontend queda alineado con el nuevo backend; solo falta que el modulo del juego actualice el store de sesion con las metricas reales a medida que se desarrollen las partidas.
