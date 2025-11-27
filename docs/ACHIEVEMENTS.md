# Guía de Integración Frontend: Sistema de Logros (Achievements)

Esta guía detalla cómo integrar el sistema de logros/objetivos en el frontend de la aplicación.

## Tabla de Contenidos

- [Resumen de Endpoints](#resumen-de-endpoints)
- [Tipos de Logros](#tipos-de-logros)
- [Estados de Logros](#estados-de-logros)
- [Ejemplos de Respuestas del API](#ejemplos-de-respuestas-del-api)
- [Próximos Pasos](#próximos-pasos)

---

## Resumen de Endpoints

### Objetivos (`Achievements`)

| Método | Endpoint                            | Descripción                                                                  |
| :----- | :---------------------------------- | :--------------------------------------------------------------------------- |
| `GET`  | `/api/achievements/my-achievements` | Obtiene la lista de logros, progreso y estado. Soporta filtros y paginación. |
| `POST` | `/api/achievements/claim`           | Reclama la recompensa de un logro completado. Requiere `uuid` en el body.    |

---

## Tipos de Logros

Los logros pueden basarse en diferentes métricas (`targetType`):

- `score`: Puntuación total acumulada
- `games_played`: Número total de partidas jugadas
- `wins`: Número de victorias
- `level_completion`: Completar niveles específicos
- Otros tipos personalizados según necesidad del juego

---

## Estados de Logros

Los logros pueden tener tres estados principales:

### `locked` (Bloqueado)

- El usuario aún no ha alcanzado el objetivo
- `currentProgress < goalAmount`
- `obtainedAt: null`
- `claimedAt: null`

### `available` (Disponible para reclamar)

- El usuario alcanzó el objetivo pero aún no reclamó la recompensa
- `currentProgress >= goalAmount`
- `obtainedAt: fecha ISO`
- `claimedAt: null`

### `claimed` (Reclamado)

- El usuario ya reclamó la recompensa
- `currentProgress >= goalAmount`
- `obtainedAt: fecha ISO`
- `claimedAt: fecha ISO`

---

## Ejemplos de Respuestas del API

### `GET /api/achievements/my-achievements`

Obtiene todos los logros del usuario con su progreso actual.

**Query parameters opcionales:**

- `page`: Número de página (default: 1)
- `pageSize`: Resultados por página (default: 25)
- `status`: Filtrar por estado (`locked`, `available`, `claimed`)

**Respuesta:**

```json
{
  "achievements": [
    {
      "id": 301,
      "documentId": "di2hhqim0enlvdhxqkshx4e4",
      "uuid": "pI7eHeV31PZXwIjmYNuuKWZ1",
      "title": "Logro 1",
      "description": "Desbloquea este logro haciendo X cosa 1",
      "quantity": "0",
      "goalAmount": 1000,
      "targetType": "score",
      "rewardAmount": 500,
      "visibleToUser": true,
      "isActive": true,
      "rewardType": "coins",
      "createdAt": "2025-11-26T17:01:39.367Z",
      "updatedAt": "2025-11-26T17:01:39.367Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "locked",
      "currentProgress": 0,
      "obtainedAt": null,
      "claimedAt": null
    },
    {
      "id": 303,
      "documentId": "j4b1pny4g4t5xqr93k2bvxzr",
      "uuid": "SPoVjxqOsaQK3fbljTPjiZk4",
      "title": "Logro 2",
      "description": "Desbloquea este logro haciendo X cosa 2",
      "quantity": "0",
      "goalAmount": 2000,
      "targetType": "score",
      "rewardAmount": 500,
      "visibleToUser": true,
      "isActive": true,
      "rewardType": "coins",
      "createdAt": "2025-11-26T17:01:39.391Z",
      "updatedAt": "2025-11-26T17:01:39.391Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "locked",
      "currentProgress": 27,
      "obtainedAt": null,
      "claimedAt": null
    },
    {
      "id": 305,
      "documentId": "bu0ne4y1wnva7krt8b7aivs4",
      "uuid": "1TlDpdxJk7eJVAiYup95GrwM",
      "title": "Logro 3",
      "description": "Desbloquea este logro haciendo X cosa 3",
      "quantity": "0",
      "goalAmount": 3000,
      "targetType": "score",
      "rewardAmount": 500,
      "visibleToUser": true,
      "isActive": true,
      "rewardType": "coins",
      "createdAt": "2025-11-26T17:01:39.412Z",
      "updatedAt": "2025-11-26T17:01:39.412Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "locked",
      "currentProgress": 0,
      "obtainedAt": null,
      "claimedAt": null
    },
    {
      "id": 307,
      "documentId": "kgre7enruwbr4sp8d6wl6n34",
      "uuid": "UbCQhbquBZSSUwd83Nr5UkMw",
      "title": "Logro 4",
      "description": "Desbloquea este logro haciendo X cosa 4",
      "quantity": "0",
      "goalAmount": 4000,
      "targetType": "score",
      "rewardAmount": 500,
      "visibleToUser": true,
      "isActive": true,
      "rewardType": "coins",
      "createdAt": "2025-11-26T17:01:39.433Z",
      "updatedAt": "2025-11-26T17:01:39.433Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "locked",
      "currentProgress": 1213,
      "obtainedAt": null,
      "claimedAt": null
    },
    {
      "id": 309,
      "documentId": "z45bak0nap8byh8256d2rz3g",
      "uuid": "B6n9goIHrtbqz4jVWEeG7C26",
      "title": "Logro 5",
      "description": "Desbloquea este logro haciendo X cosa 5",
      "quantity": "0",
      "goalAmount": 5000,
      "targetType": "score",
      "rewardAmount": 500,
      "visibleToUser": true,
      "isActive": true,
      "rewardType": "coins",
      "createdAt": "2025-11-26T17:01:39.454Z",
      "updatedAt": "2025-11-26T17:01:39.454Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "locked",
      "currentProgress": 0,
      "obtainedAt": null,
      "claimedAt": null
    }
  ],
  "playerStats": {
    "coins": 3740,
    "tickets": 4
  },
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 5
    }
  }
}
```

### `POST /api/achievements/claim`

Reclama la recompensa de un logro completado.

**Body:**

```json
{
  "uuid": "pI7eHeV31PZXwIjmYNuuKWZ1"
}
```

**Respuesta exitosa:**

```json
{
  "achievement": {
    "id": 301,
    "uuid": "pI7eHeV31PZXwIjmYNuuKWZ1",
    "title": "Logro 1",
    "description": "Desbloquea este logro haciendo X cosa 1",
    "status": "claimed",
    "currentProgress": 1000,
    "goalAmount": 1000,
    "rewardType": "coins",
    "rewardAmount": 500,
    "claimedAt": "2025-11-27T10:30:00.000Z"
  },
  "playerStats": {
    "coins": 4240,
    "tickets": 4
  }
}
```

**Errores comunes:**

```json
// Logro no completado
{
  "error": {
    "status": 400,
    "message": "Achievement not completed yet",
    "details": {
      // tener en cuenta que el progreso no sea mayor a 100, hacer un fallback si los datos vienen mal del backend
      "currentProgress": 50,
      "goalAmount": 1000
    }
  }
}
```

```json
// Logro ya reclamado
{
  "error": {
    "status": 400,
    "message": "Achievement already claimed",
    "details": {
      "claimedAt": "2025-11-26T15:20:00.000Z"
    }
  }
}
```

---

## Próximos Pasos

### Tareas Pendientes para Implementación Frontend

1. **Crear tipos TypeScript**

   - Definir interfaces para `Achievement`, `AchievementStatus`, etc.
   - Archivo: `src/types/achievements.ts`

2. **Crear servicio de API**

   - Implementar `AchievementsService` con métodos `getMyAchievements()` y `claimAchievement(uuid)`
   - Archivo: `src/services/achievements.service.ts`

3. **Crear store de Zustand**

   - Estado global para achievements
   - Acciones: `fetchAchievements`, `claimAchievement`, filtros por estado
   - Archivo: `src/store/useAchievementsStore.ts`

4. **Componentes UI**

   - `AchievementCard`: Carta individual de logro con progreso
   - `AchievementsList`: Lista con filtros (todos/disponibles/reclamados)
   - `AchievementProgressBar`: Barra de progreso visual
   - Directorio: `src/components/game/achievements/`

5. **Página de Logros**

   - Ruta: `/game/achievements`
   - Grid responsive de cartas de logros
   - Filtros y paginación
   - Archivo: `src/app/game/achievements/page.tsx`

6. **Integración con playerStats**

   - Sincronizar monedas/tickets al reclamar logros
   - Actualizar header y otros componentes que muestren el balance

7. **Notificaciones**
   - Toast cuando se completa un logro
   - Toast cuando se reclama exitosamente
   - Indicador visual de logros disponibles en el header/menú

---

## Consideraciones de Diseño

### Visual

- **Locked**: Aspecto grisáceo, candado, mostrar progreso actual
- **Available**: Destacado con color brillante, botón "Reclamar" visible
- **Claimed**: Check mark verde, aspecto desaturado

### UX

- Mostrar progreso en tiempo real (ej: "850 / 1000 puntos")
- Ordenar por: disponibles primero, luego por progreso descendente
- Animación de celebración al reclamar
- Indicador numérico de logros disponibles para reclamar

### Performance

- Paginación para no cargar todos los logros a la vez
- Caché de datos en Zustand store
- Actualización optimista al reclamar
