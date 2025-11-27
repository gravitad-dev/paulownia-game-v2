# Guía de Integración Frontend: Recompensas Diarias

Esta guía detalla cómo funciona el sistema de recompensas diarias implementado en el frontend, incluyendo el flujo del modal, gestión de estado, y las mejores prácticas para mantener y extender esta funcionalidad.

## Tabla de Contenidos

- [Resumen de Endpoints](#resumen-de-endpoints)
- [Arquitectura Frontend](#arquitectura-frontend)
- [Gestión de Estado (Zustand Store)](#gestión-de-estado-zustand-store)
- [Modal de Recompensas Diarias](#modal-de-recompensas-diarias)
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
│   ├── DailyRewardsModal.tsx           # Modal principal
│   ├── DailyRewardCard.tsx             # Carta individual de día
│   ├── CountdownTimer.tsx              # Timer hasta próxima recompensa
│   └── index.ts                        # Exports
├── app/game/
│   ├── layout.tsx                      # Layout que carga fetchStatus al login
│   └── rewards/page.tsx                # Página completa de recompensas
└── hooks/
    └── useToast.ts                     # Notificaciones toast
```

---

## Gestión de Estado (Zustand Store)

### `useDailyRewardsStore.ts`

**Estado global persistente** usando Zustand con persistencia en localStorage.

#### Estados principales:

```typescript
interface DailyRewardsState {
  // Datos del servidor
  rewards: DailyReward[]; // Array de 7 días con status
  playerStats: PlayerStats | null; // { coins, tickets }
  canClaim: boolean; // Si puede reclamar ahora
  nextDay: number; // Próximo día a reclamar (1-7)
  nextClaimDate: string | null; // Fecha ISO del próximo claim
  lastClaimedDate: string | null; // Última fecha de claim

  // Estado de UI
  isLoading: boolean;
  isClaiming: boolean;
  error: string | null;
  isModalOpen: boolean;
  modalDismissedData: { date: string; userId: number } | null;
  lastClaimedReward: ClaimedRewardInfo | null; // Para toast notification

  // Acciones
  fetchStatus: (userId?, options?) => Promise<void>;
  claimReward: () => Promise<boolean>;
  openModal: () => void;
  closeModal: () => void;
  dismissModalForToday: (userId) => void;
  reset: () => void;
}
```

#### Funciones clave:

**`fetchStatus(userId?, options?)`**

Parámetros opcionales:

- `userId`: ID del usuario (para tracking de dismiss)
- `options`:
  - `preserveModalState?: boolean` - Mantiene el estado actual del modal (evita parpadeos al actualizar)
  - `openReason?: 'login' | 'navigation'` - Controla comportamiento de auto-apertura:
    - `'login'`: Abre el modal si `canClaim === true` (ignora dismiss previo)
    - `'navigation'` o sin especificar: **NUNCA** abre automáticamente (menos invasivo)

**`claimReward()`**

- Llama a `/api/daily-rewards/claim`
- Actualiza automáticamente: `rewards`, `playerStats`, `canClaim`, `nextDay`, `nextClaimDate`
- Guarda `lastClaimedReward` para mostrar toast
- **NO** cierra el modal automáticamente
- Retorna `true` si tuvo éxito, `false` si falló

**`dismissModalForToday(userId)`**

- Cierra el modal y guarda en localStorage que el usuario lo descartó hoy
- Evita que se reabra durante el día si el usuario decidió "Reclamar más tarde"
- Se resetea automáticamente al día siguiente

---

## Modal de Recompensas Diarias

### `DailyRewardsModal.tsx`

#### Comportamiento de Auto-Apertura

**Regla principal**: El modal **solo** se abre automáticamente al iniciar sesión si hay recompensa disponible.

```typescript
// En app/game/layout.tsx o components/game/layout.tsx
useEffect(() => {
  if (mounted && isAuthenticated && user?.id) {
    fetchStatus(user.id, { openReason: "login" }); // Fuerza apertura si canClaim
  }
}, [mounted, isAuthenticated, user?.id]);
```

Durante la navegación normal, el modal **nunca** se abrirá solo, evitando ser invasivo.

#### Gestión del Cierre

El modal maneja tres formas de cerrar:

1. **Botón "Reclamar más tarde"** (cuando `canClaim === true`):

   - Ejecuta `dismissModalForToday(userId)`
   - No volverá a abrirse automáticamente hoy

2. **Botón "Cerrar"** (cuando `canClaim === false`):

   - Solo cierra el modal con `closeModal()`
   - No marca como dismissed

3. **Clic fuera / ESC**:
   - Si `canClaim === true`: Ejecuta `dismissModalForToday(userId)`
   - Si `canClaim === false`: Solo `closeModal()`

#### Texto del Botón Footer

```typescript
{
  canClaim ? "Reclamar más tarde" : "Cerrar";
}
```

Esto hace que el botón sea contextual según el estado.

#### Layout Responsive

- **Desktop/Tablet**: Flex wrap con cartas de 130px-150px
- **Carta especial (Día 7)**: Más ancha (160px-200px)
- **Gap vertical aumentado**: `gap-y-5 sm:gap-y-6` para mejor separación
- **Sin scroll horizontal**: `overflow-x-hidden`
- **Centrado**: `justify-center` en el flex container

---

## Flujo de Usuario

### 1. Inicio de Sesión

```
Usuario hace login
  → Layout ejecuta fetchStatus(userId, { openReason: 'login' })
  → API responde con canClaim = true
  → Modal se abre automáticamente
  → Usuario ve su racha y puede reclamar
```

### 2. Reclamar Recompensa (con modal abierto)

```
Usuario hace clic en "Reclamar Día X"
  → claimReward() se ejecuta
  → API actualiza datos y devuelve playerStats actualizados
  → Store se actualiza con nuevos valores
  → Toast muestra "¡Recompensa reclamada! Has recibido X monedas/tickets"
  → Modal PERMANECE ABIERTO (no se cierra automáticamente)
  → UI actualiza:
     - Carta cambia de "available" a "claimed"
     - Botón desaparece
     - Aparece countdown para mañana
     - Botón footer cambia a "Cerrar"
```

**Importante**: El modal **NO** se cierra al reclamar para que el usuario vea la transición visual de las cartas.

### 3. Countdown Llega a Cero

```
Timer llega a 00:00:00
  → CountdownTimer ejecuta onComplete callback
  → handleCountdownComplete() llama fetchStatus()
  → API responde con canClaim = true y nueva carta available
  → UI se actualiza automáticamente:
     - Aparece botón "Reclamar Día X"
     - Carta correspondiente cambia a "available"
     - Countdown desaparece
```

### 4. Racha Completada (7 días)

```
Usuario reclama el Día 7
  → nextClaimDate = null
  → canClaim = false
  → UI muestra mensaje especial:
     "¡Completaste la racha de 7 días!"
     "Has reclamado todas las recompensas. ¡Felicitaciones!"
  → NO se muestra countdown
  → Botón footer dice "Cerrar"
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

- `locked`: Fondo gris, opacidad 50%, borde tenue (`border-muted/30`), ícono de candado
- `available`: Fondo gradiente primary, borde destacado, sin sombra excesiva (optimizado para no ser invasivo)
- `claimed`: Fondo verde, borde verde, ícono de check, badge "✓ Reclamado"

**Carta especial (Día 7)**:

- Más ancha que las demás
- Colores amber en lugar de primary cuando está available
- Decoración con sparkles

**Nota**: Las animaciones GSAP infinitas están **deshabilitadas** para evitar renders constantes y cambios de estilo que afectan performance.

### `CountdownTimer.tsx`

Timer reactivo que cuenta regresivo hasta `nextClaimDate`.

**Características**:

- Actualización cada segundo
- Formato: `HH:mm:ss`
- Llama `onComplete()` cuando llega a cero
- Se oculta automáticamente cuando `total <= 0`
- Manejo de hydration con `mounted` state

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

Tanto `fetchStatus` como `claimReward` devuelven `playerStats` actualizados:

```typescript
{
  "playerStats": {
    "coins": 3940,
    "tickets": 4
  }
}
```

El store se actualiza automáticamente, y cualquier componente que lea `playerStats` del store se re-renderiza (ej: Header con badges de monedas/tickets).

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
      "documentId": "b4ptn5uyq9gaywx52lanwb4o",
      "uuid": "l2HvNrc9Zw38qgK6IQcuzhaM",
      "name": "Day 1 Reward",
      "day": 1,
      "rewardType": "coins",
      "rewardAmount": 100,
      "isActive": true,
      "createdAt": "2025-11-26T17:01:38.497Z",
      "updatedAt": "2025-11-26T17:01:38.497Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "claimed",
      "claimedAt": "2025-11-25T13:00:00.000Z"
    },
    {
      "id": 470,
      "documentId": "lsvdbvg2bz2hk1fjym4vaafr",
      "uuid": "gf2oK5MvW3ErEBgH9H5cjiff",
      "name": "Day 2 Reward",
      "day": 2,
      "rewardType": "coins",
      "rewardAmount": 200,
      "isActive": true,
      "createdAt": "2025-11-26T17:01:38.530Z",
      "updatedAt": "2025-11-26T17:01:38.530Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "available",
      "claimedAt": null
    },
    {
      "id": 472,
      "documentId": "cm7epgfpp5rpjbl9pdzjy8ja",
      "uuid": "YKJhIvOQyeIkEGOwoJ364Z8l",
      "name": "Day 3 Reward",
      "day": 3,
      "rewardType": "coins",
      "rewardAmount": 300,
      "isActive": true,
      "createdAt": "2025-11-26T17:01:38.558Z",
      "updatedAt": "2025-11-26T17:01:38.558Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "locked",
      "claimedAt": null
    },
    {
      "id": 474,
      "documentId": "a97cragpp84acuzucuyb4fkb",
      "uuid": "WdbY2mZkUzo40JR5ir8iJt4Z",
      "name": "Day 4 Reward",
      "day": 4,
      "rewardType": "coins",
      "rewardAmount": 400,
      "isActive": true,
      "createdAt": "2025-11-26T17:01:38.580Z",
      "updatedAt": "2025-11-26T17:01:38.580Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "locked",
      "claimedAt": null
    },
    {
      "id": 476,
      "documentId": "wewd1t6tjo4rk0sxl0uwpec7",
      "uuid": "taly1WxXwAg24DpHEYWyEO52",
      "name": "Day 5 Reward",
      "day": 5,
      "rewardType": "coins",
      "rewardAmount": 500,
      "isActive": true,
      "createdAt": "2025-11-26T17:01:38.601Z",
      "updatedAt": "2025-11-26T17:01:38.601Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "locked",
      "claimedAt": null
    },
    {
      "id": 478,
      "documentId": "nx63yecfrx1qr7mt20j8b20f",
      "uuid": "cJBSEFRMd9JdmTQ9m9roMxYU",
      "name": "Day 6 Reward",
      "day": 6,
      "rewardType": "coins",
      "rewardAmount": 600,
      "isActive": true,
      "createdAt": "2025-11-26T17:01:38.623Z",
      "updatedAt": "2025-11-26T17:01:38.623Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "locked",
      "claimedAt": null
    },
    {
      "id": 480,
      "documentId": "f9y9kui74py5t053xwcotbxw",
      "uuid": "FgSpb0cnqwlaEcbuREJ6siOl",
      "name": "Day 7 Big Reward",
      "day": 7,
      "rewardType": "tickets",
      "rewardAmount": 1,
      "isActive": true,
      "createdAt": "2025-11-26T17:01:38.644Z",
      "updatedAt": "2025-11-26T17:01:38.644Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "locked",
      "claimedAt": null
    }
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
    "name": "Day 2 Reward",
    "image": null,
    "claimedAt": "2025-11-26T18:19:28.166Z"
  },
  "rewards": [
    {
      "id": 468,
      "documentId": "b4ptn5uyq9gaywx52lanwb4o",
      "uuid": "l2HvNrc9Zw38qgK6IQcuzhaM",
      "name": "Day 1 Reward",
      "day": 1,
      "rewardType": "coins",
      "rewardAmount": 100,
      "isActive": true,
      "createdAt": "2025-11-26T17:01:38.497Z",
      "updatedAt": "2025-11-26T17:01:38.497Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "claimed",
      "claimedAt": null
    },
    {
      "id": 470,
      "documentId": "lsvdbvg2bz2hk1fjym4vaafr",
      "uuid": "gf2oK5MvW3ErEBgH9H5cjiff",
      "name": "Day 2 Reward",
      "day": 2,
      "rewardType": "coins",
      "rewardAmount": 200,
      "isActive": true,
      "createdAt": "2025-11-26T17:01:38.530Z",
      "updatedAt": "2025-11-26T17:01:38.530Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "claimed",
      "claimedAt": "2025-11-26T18:19:28.166Z"
    },
    {
      "id": 472,
      "documentId": "cm7epgfpp5rpjbl9pdzjy8ja",
      "uuid": "YKJhIvOQyeIkEGOwoJ364Z8l",
      "name": "Day 3 Reward",
      "day": 3,
      "rewardType": "coins",
      "rewardAmount": 300,
      "isActive": true,
      "createdAt": "2025-11-26T17:01:38.558Z",
      "updatedAt": "2025-11-26T17:01:38.558Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "locked",
      "claimedAt": null
    },
    {
      "id": 474,
      "documentId": "a97cragpp84acuzucuyb4fkb",
      "uuid": "WdbY2mZkUzo40JR5ir8iJt4Z",
      "name": "Day 4 Reward",
      "day": 4,
      "rewardType": "coins",
      "rewardAmount": 400,
      "isActive": true,
      "createdAt": "2025-11-26T17:01:38.580Z",
      "updatedAt": "2025-11-26T17:01:38.580Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "locked",
      "claimedAt": null
    },
    {
      "id": 476,
      "documentId": "wewd1t6tjo4rk0sxl0uwpec7",
      "uuid": "taly1WxXwAg24DpHEYWyEO52",
      "name": "Day 5 Reward",
      "day": 5,
      "rewardType": "coins",
      "rewardAmount": 500,
      "isActive": true,
      "createdAt": "2025-11-26T17:01:38.601Z",
      "updatedAt": "2025-11-26T17:01:38.601Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "locked",
      "claimedAt": null
    },
    {
      "id": 478,
      "documentId": "nx63yecfrx1qr7mt20j8b20f",
      "uuid": "cJBSEFRMd9JdmTQ9m9roMxYU",
      "name": "Day 6 Reward",
      "day": 6,
      "rewardType": "coins",
      "rewardAmount": 600,
      "isActive": true,
      "createdAt": "2025-11-26T17:01:38.623Z",
      "updatedAt": "2025-11-26T17:01:38.623Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "locked",
      "claimedAt": null
    },
    {
      "id": 480,
      "documentId": "f9y9kui74py5t053xwcotbxw",
      "uuid": "FgSpb0cnqwlaEcbuREJ6siOl",
      "name": "Day 7 Big Reward",
      "day": 7,
      "rewardType": "tickets",
      "rewardAmount": 1,
      "isActive": true,
      "createdAt": "2025-11-26T17:01:38.644Z",
      "updatedAt": "2025-11-26T17:01:38.644Z",
      "publishedAt": null,
      "locale": null,
      "image": null,
      "status": "locked",
      "claimedAt": null
    }
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

#### `POST /api/daily-rewards/claim` Cuando da error

```json
{
  "data": null,
  "error": {
    "status": 400,
    "name": "BadRequestError",
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

1.  **Manejo de Errores:**

    - Si intentas reclamar y recibes un error (ej. 400), muestra el mensaje al usuario (ej. "Ya reclamaste hoy").
    - El backend valida todo, así que confía en los códigos de error.

2.  **Sincronización:**

    - Dado que reclamar recompensas cambia el saldo de monedas/tickets, asegúrate de que cualquier componente que muestre el saldo (header, tienda) esté suscrito a los cambios de `playerStats` que devuelven estos endpoints.

3.  **Timezones:**
    - El backend maneja la lógica de "días" (reset a las 5 AM Madrid). En el frontend, guíate por `canClaim` y `nextClaimDate`. No intentes calcular tú mismo si "ya es mañana", usa la fecha que te da el servidor.
