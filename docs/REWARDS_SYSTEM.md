# Sistema de Premios (Rewards)

## Descripción General

El sistema de premios permite a los usuarios:

1. **Canjear monedas por tickets** con límites diarios configurables
2. **Girar la ruleta** usando tickets para ganar premios
3. **Ver historial** de premios ganados

## Estructura de Tabs

El módulo de Premios (`/game/rewards`) tiene 3 tabs:

- **Canje** (`/game/rewards`) - Convertir monedas a tickets
- **Descubrir** (`/game/rewards/discover`) - Ruleta de premios
- **Catálogo** (`/game/rewards/catalog`) - _Por implementar_

## 1. Canje de Monedas por Tickets

### Endpoint

```
POST /api/rewards/exchange
```

### Request Body

```json
{
  "tickets": 5
}
```

### Response

```json
{
  "playerStats": {
    "coins": 450,
    "tickets": 8
  },
  "exchangeLimit": {
    "limitPerDay": 10,
    "exchangedToday": 5,
    "remaining": 5,
    "resetAt": "2025-11-29T00:00:00.000Z"
  }
}
```

### Estados del Límite

**Endpoint:** `GET /api/rewards/exchange-status`

**Response:**

```json
{
  "exchangeLimit": {
    "limitPerDay": 10,
    "exchangedToday": 3,
    "remaining": 7,
    "resetAt": "2025-11-29T00:00:00.000Z"
  },
  "playerStats": {
    "coins": 500,
    "tickets": 3
  }
}
```

### Errores Comunes

- `insufficient_coins`: No hay suficientes monedas
- `exchange_limit_reached`: Límite diario alcanzado
- `settings_not_configured`: Configuración no establecida (contactar admin)
- `unauthorized`: Sesión expirada

### Características UI

- Selector interactivo con botones +/- (soporte hold-to-repeat)
- Botones rápidos: 1, 5, 10, Máx
- Validación en tiempo real
- Contador de tiempo para reinicio del límite
- Historial de canjes
- Modal de confirmación con validación

## 2. Ruleta de Premios

### Endpoint

```
POST /api/rewards/spin
```

### Response

```json
{
  "reward": {
    "uuid": "abc123",
    "name": "100 Coins",
    "description": "Paquete de monedas",
    "image": {
      "id": 1,
      "url": "/uploads/coin.png",
      "name": "coin.png"
    },
    "typeReward": "currency",
    "value": 100,
    "quantity": 50
  },
  "userReward": {
    "uuid": "def456",
    "rewardStatus": "claimed",
    "claimed": true,
    "obtainedAt": "2025-11-28T15:00:00.000Z",
    "claimedAt": "2025-11-28T15:00:00.000Z",
    "quantity": 50
  },
  "playerStats": {
    "coins": 150,
    "tickets": 2
  }
}
```

### Tipos de Premios

- `currency`: Monedas o tickets
- `consumable`: Ítems consumibles
- `cosmetic`: Cosméticos (avatar, frames, etc.)

### Estados de Premios

- `available`: Premio puede ser reclamado
- `claimed`: Premio ya reclamado automáticamente
- `pending`: Premio requiere reclamación manual

### Errores Comunes

- `insufficient_tickets`: No hay tickets suficientes
- `no_rewards_available`: No hay premios disponibles
- `all_unique_rewards_obtained`: Ya se obtuvieron todos los premios únicos
- `probability_selection_failed`: Error al seleccionar premio
- `cosmetic_not_implemented`: Premios cosméticos no disponibles aún

### Características UI

- Animación de ruleta (placeholder simple, será reemplazado por diseño final)
- Duración de animación: 3000ms + 500ms reveal delay
- Descuento optimista de tickets (feedback visual inmediato)
- Modal de revelación del premio
- Actualización de badges solo al revelar premio (mantiene suspense)

## 3. Historial de Premios

### Endpoint

```
GET /api/roulette-histories?populate=*&pagination[pageSize]=100&sort=timestamp:desc&publicationState=live
```

### Response

```json
{
  "data": [
    {
      "id": 360,
      "uuid": "UDor9FCTx3eR0jiK6wMqDUhS",
      "timestamp": "2025-11-28T15:49:52.571Z",
      "reward": {
        "uuid": "abc123",
        "name": "100 Coins",
        "description": "Paquete de monedas",
        "typeReward": "currency",
        "value": 100,
        "quantity": 50,
        "image": {
          "url": "/uploads/coin.png"
        }
      },
      "createdAt": "2025-11-28T15:49:52.598Z"
    }
  ]
}
```

### Características UI

- Muestra hasta 100 registros (sin límite)
- Scroll vertical con altura máxima 500px
- Formato de fecha inteligente:
  - "Hoy • 13:00" para premios del día
  - "Ayer • 12:59" para premios de ayer
  - "27 nov • 10:30" para días anteriores
- Contador de premios en header
- Filtrado automático (solo muestra registros con `reward !== null`)
- Actualización automática después de cada giro

## Arquitectura Frontend

### Stores (Zustand)

**`useExchangeStore`**

```typescript
{
  status: ExchangeStatusResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchStatus: () => Promise<void>;
  exchange: (tickets: number) => Promise<boolean>;
  reset: () => void;
}
```

**`useRewardStore`**

```typescript
{
  phase: 'idle' | 'spinning' | 'revealing' | 'revealed';
  currentReward: Reward | null;
  currentUserReward: UserReward | null;
  pendingPlayerStats: { coins: number; tickets: number } | null;
  error: string | null;
  spin: () => Promise<boolean>;
  setPhase: (phase: SpinPhase) => void;
  clearCurrentReward: () => void;
  reset: () => void;
}
```

### Servicios

**`ExchangeService`**

- `getStatus()`: Obtener estado del límite de canje
- `exchange(tickets)`: Realizar canje de monedas por tickets

**`RewardService`**

- `spin()`: Girar la ruleta
- `getHistory(limit?)`: Obtener historial de premios

### Componentes Principales

#### Exchange

- `TicketSelector`: Selector de cantidad con +/- y hold
- `ExchangeConfirmModal`: Modal de confirmación con validación
- `ExchangeLimitInfo`: Info del límite con countdown
- `ExchangeHistory`: Tabla de historial de canjes
- `ExchangeRateInfo`: Información de la tasa de cambio

#### Discover (Ruleta)

- `SpinnerAnimation`: Animación de la ruleta (placeholder)
- `SpinButton`: Botón para girar con estado
- `RewardRevealModal`: Modal de revelación del premio
- `SessionRewardsList`: Historial de premios ganados

### Flujo de Actualización de PlayerStats

1. **Al presionar girar:**

   - Se descuenta 1 ticket optimistamente (feedback visual inmediato)
   - Se inicia la animación de la ruleta

2. **Durante la animación:**

   - Backend procesa el giro y devuelve el premio
   - Stats se guardan en `pendingPlayerStats` (no se muestran aún)

3. **Al revelar el premio:**

   - Se actualiza `phase` a `"revealed"`
   - Se actualizan los badges con `pendingPlayerStats`
   - Se muestra el modal con el premio ganado

4. **En caso de error:**
   - Se restauran los tickets originales
   - Se muestra mensaje de error

## Validación y Seguridad

### Frontend

- Validación de input (Math.floor para enteros, clamp para límites)
- Validación en múltiples niveles: componente, página, modal
- Prevención de manipulación DOM
- Validación de límites antes de abrir modal de confirmación

### Backend

- El backend es la fuente de verdad para límites y stats
- Frontend siempre sincroniza con respuesta del backend
- Límites diarios configurables desde Strapi
- Validación de sesión y permisos

## Configuración Requerida (Strapi)

### Exchange Settings

- `ticketsCostInCoins`: Costo en monedas de 1 ticket
- `limitTicketsPerDay`: Límite diario de tickets que se pueden canjear

### Rewards Configuration

- Lista de premios disponibles con probabilidades
- Tipos de premios (currency, consumable, cosmetic)
- Imágenes asociadas a cada premio

## Pendientes / Mejoras Futuras

- [ ] Implementar tab "Catálogo"
- [ ] Reemplazar animación placeholder de ruleta con diseño final
- [ ] Sistema de reclamación para premios con estado "pending"
- [ ] Historial de canjes paginado
- [ ] Notificaciones de límite próximo a alcanzarse
- [ ] Animaciones de transición entre tabs
- [ ] Sonidos para spin y premio ganado
