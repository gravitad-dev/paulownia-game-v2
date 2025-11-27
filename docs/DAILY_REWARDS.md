# Guía de Integración Frontend: Recompensas Diarias

Esta guía detalla cómo funciona el sistema de recompensas diarias implementado en el frontend, incluyendo la gestión de estado y las mejores prácticas para mantener y extender esta funcionalidad.

## Tabla de Contenidos

- [Resumen de Endpoints](#resumen-de-endpoints)
- [Arquitectura Frontend](#arquitectura-frontend)
- [Gestión de Estado (Zustand Store)](#gestión-de-estado-zustand-store)
- [Flujo de Usuario](#flujo-de-usuario)
- [Componentes Clave](#componentes-clave)
- [Manejo de Casos Especiales](#manejo-de-casos-especiales)
- [Ejemplos de Respuestas del API](#ejemplos-de-respuestas-del-api)

---

## Resumen de Endpoints

### Recompensas Diarias (`Daily Rewards`)

| Método | Endpoint                       | Descripción                                                            |
| :----- | :----------------------------- | :--------------------------------------------------------------------- |
| `GET`  | `/api/daily-rewards/my-status` | Obtiene el estado actual, lista de recompensas y si se puede reclamar. |
| `POST` | `/api/daily-rewards/claim`     | Reclama la recompensa del día actual.                                  |

---

## Arquitectura Frontend

### Estructura de Archivos

```
src/
├── store/
│   └── useDailyRewardsStore.ts          # Estado global con Zustand
├── services/
│   └── daily-rewards.service.ts         # Servicio para llamadas al API
├── types/
│   └── daily-rewards.ts                 # TypeScript types/interfaces
├── components/game/rewards/
│   ├── DailyRewardCard.tsx             # Carta individual de día
│   ├── CountdownTimer.tsx              # Timer hasta próxima recompensa
│   └── index.ts                        # Exports
├── app/game/
│   ├── layout.tsx                      # Layout que carga fetchStatus al login
│   ├── events/page.tsx                 # Página de eventos (incluye daily rewards)
│   └── rewards/page.tsx                # Página completa de recompensas
└── hooks/
    └── useToast.ts                     # Notificaciones toast
```

---

## Gestión de Estado (Zustand Store)

### `useDailyRewardsStore.ts`

**Estado global** usando Zustand.

#### Estados principales:

```typescript
interface DailyRewardsState {
  // Datos del servidor
  rewards: DailyReward[]; // Array de 7 días con status
  canClaim: boolean; // Si puede reclamar ahora
  nextDay: number; // Próximo día a reclamar (1-7)
  nextClaimDate: string | null; // Fecha ISO del próximo claim
  lastClaimedDate: string | null; // Última fecha de claim

  // Estado de UI
  isLoading: boolean;
  isClaiming: boolean;
  error: string | null;
  lastClaimedReward: ClaimedRewardInfo | null; // Para toast notification

  // Acciones
  fetchStatus: () => Promise<void>;
  claimReward: () => Promise<boolean>;
  reset: () => void;
}
```

#### Funciones clave:

**`fetchStatus()`**

- Obtiene el estado actual de las recompensas diarias desde el servidor
- Actualiza `playerStats` en el store global

**`claimReward()`**

- Llama a `/api/daily-rewards/claim`
- Actualiza automáticamente: `rewards`, `playerStats`, `canClaim`, `nextDay`, `nextClaimDate`
- Guarda `lastClaimedReward` para mostrar toast
- Retorna `true` si tuvo éxito, `false` si falló

---

## Flujo de Usuario

### 1. Inicio de Sesión

```
Usuario hace login
  → Layout ejecuta fetchStatus()
  → API responde con estado de recompensas
  → Si canClaim = true, el indicador de Eventos parpadea
  → Usuario navega a Eventos para reclamar
```

### 2. Reclamar Recompensa (en página de Eventos)

```
Usuario hace clic en "Reclamar Día X"
  → claimReward() se ejecuta
  → API actualiza datos y devuelve playerStats actualizados
  → Store se actualiza con nuevos valores
  → Toast muestra "¡Recompensa reclamada! Has recibido X monedas/tickets"
  → UI actualiza:
     - Carta cambia de "available" a "claimed"
     - Botón desaparece
     - Aparece countdown para mañana
```

### 3. Countdown Llega a Cero

```
Timer llega a 00:00:00
  → CountdownTimer ejecuta onComplete callback
  → handleCountdownComplete() llama fetchStatus()
  → API responde con canClaim = true y nueva carta available
  → UI se actualiza automáticamente
```

### 4. Racha Completada (7 días)

```
Usuario reclama el Día 7
  → nextClaimDate = null
  → canClaim = false
  → UI muestra mensaje especial:
     "¡Completaste la racha de 7 días!"
```

---

## Componentes Clave

### `DailyRewardCard.tsx`

Representa una carta individual de día con tres estados visuales:

#### Estados de Carta

```typescript
type RewardStatus = "locked" | "available" | "claimed";
```

**Estilos por estado**:

- `locked`: Fondo gris, opacidad 50%, borde tenue, ícono de candado
- `available`: Fondo gradiente primary, borde destacado
- `claimed`: Fondo verde, borde verde, ícono de check, badge "✓ Reclamado"

**Carta especial (Día 7)**:

- Más ancha que las demás
- Colores amber en lugar de primary cuando está available
- Decoración con sparkles

### `CountdownTimer.tsx`

Timer reactivo que cuenta regresivo hasta `nextClaimDate`.

**Características**:

- Actualización cada segundo
- Formato: `HH:mm:ss`
- Llama `onComplete()` cuando llega a cero
- Se oculta automáticamente cuando `total <= 0`

---

## Manejo de Casos Especiales

### 1. Usuario sin recompensa disponible

```typescript
if (!canClaim && nextClaimDate) {
  // Mostrar countdown
} else if (!canClaim && !nextClaimDate) {
  // Racha completada - mensaje de felicitación
}
```

### 2. Error al reclamar

```json
// Respuesta 400 del servidor
{
  "error": {
    "message": "Daily reward already claimed today",
    "details": {
      "reason": "already_claimed_today",
      "nextClaimDate": "2025-11-27T08:00:00.000Z"
    }
  }
}
```

El frontend muestra un toast de error con el mensaje del servidor.

### 3. Cambio de usuario

```typescript
// En logout (useAuthStore.ts)
logout: () => {
  Cookies.remove("auth_token");
  useDailyRewardsStore.getState().reset(); // Limpia todo el estado
  set({ user: null, token: null, isAuthenticated: false });
};
```

### 4. Sincronización de `playerStats`

Tanto `fetchStatus` como `claimReward` devuelven `playerStats` actualizados.
El store se actualiza automáticamente, y cualquier componente que lea `playerStats` se re-renderiza.

---

## Ejemplos de Respuestas del API

#### `GET /api/daily-rewards/my-status`

```json
{
  "nextDay": 2,
  "canClaim": true,
  "lastClaimedDate": "2025-11-25T13:00:00.000Z",
  "nextClaimDate": "2025-11-26T18:18:16.712Z",
  "rewards": [
    {
      "id": 468,
      "day": 1,
      "rewardType": "coins",
      "rewardAmount": 100,
      "status": "claimed",
      "claimedAt": "2025-11-25T13:00:00.000Z"
    },
    {
      "id": 470,
      "day": 2,
      "rewardType": "coins",
      "rewardAmount": 200,
      "status": "available",
      "claimedAt": null
    }
    // ... más días
  ],
  "playerStats": {
    "coins": 3740,
    "tickets": 4
  }
}
```

#### `POST /api/daily-rewards/claim`

```json
{
  "claimedReward": {
    "day": 2,
    "type": "coins",
    "amount": 200,
    "claimedAt": "2025-11-26T18:19:28.166Z"
  },
  "rewards": [
    // ... array actualizado
  ],
  "playerStats": {
    "coins": 3940,
    "tickets": 4
  },
  "status": {
    "nextDay": 3,
    "canClaim": false,
    "nextClaimDate": "2025-11-27T08:00:00.000Z"
  }
}
```

#### Error al reclamar

```json
{
  "error": {
    "status": 400,
    "message": "Daily reward already claimed today",
    "details": {
      "reason": "already_claimed_today",
      "nextClaimDate": "2025-11-27T08:00:00.000Z"
    }
  }
}
```

---

## Consideraciones Adicionales

1. **Manejo de Errores:**

   - Si intentas reclamar y recibes un error (ej. 400), muestra el mensaje al usuario.
   - El backend valida todo, así que confía en los códigos de error.

2. **Sincronización:**

   - Dado que reclamar recompensas cambia el saldo de monedas/tickets, asegúrate de que cualquier componente que muestre el saldo esté suscrito a los cambios de `playerStats`.

3. **Timezones:**
   - El backend maneja la lógica de "días" (reset a las 5 AM Madrid). En el frontend, guíate por `canClaim` y `nextClaimDate`. No intentes calcular tú mismo si "ya es mañana", usa la fecha que te da el servidor.
