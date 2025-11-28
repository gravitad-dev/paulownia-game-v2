# Sistema de Premios - Paulownia Game

Este documento detalla la arquitectura, flujos y especificaciones del sistema de Premios del juego.

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Estructura de Tabs](#estructura-de-tabs)
- [Tab 1: Descubrir Premio (Ruleta)](#tab-1-descubrir-premio-ruleta)
- [Tab 2: Premios Disponibles](#tab-2-premios-disponibles)
- [Tab 3: Canje de Monedas por Tickets](#tab-3-canje-de-monedas-por-tickets)
- [Arquitectura Frontend](#arquitectura-frontend)
- [API Endpoints](#api-endpoints)
- [Estado Global (Zustand)](#estado-global-zustand)

---

## Visión General

El sistema de Premios permite a los usuarios:

1. **Descubrir premios** usando tickets (mecánica tipo ruleta/sorteo)
2. **Ver premios disponibles** que pueden ganar
3. **Canjear monedas por tickets** para participar en el sistema de premios

### Economía del Juego

```
Monedas (Coins) → Se obtienen jugando niveles, recompensas diarias
     ↓
  Tickets → Se obtienen canjeando monedas o como premio especial (Día 7)
     ↓
  Premios → Se obtienen usando tickets en la ruleta de descubrimiento
```

---

## Estructura de Tabs

La página de Premios (`/game/rewards`) utiliza un `TabLayout` similar a Eventos, con 3 tabs:

| Tab | Nombre    | Ruta                      | Icono            | Descripción                                      |
| --- | --------- | ------------------------- | ---------------- | ------------------------------------------------ |
| 1   | Canjear   | `/game/rewards`           | `ArrowLeftRight` | Canje de monedas por tickets (tab por defecto)   |
| 2   | Descubrir | `/game/rewards/discover`  | `Sparkles`       | Ruleta/sorteo para descubrir premios con tickets |
| 3   | Catálogo  | `/game/rewards/catalog`   | `Gift`           | Lista de premios disponibles que se pueden ganar |

> **Nota:** El orden de las tabs se controla desde el array `rewardTabs` en `layout.tsx`. La primera tab del array siempre corresponde a la ruta raíz (`/game/rewards`).

---

## Tab 1: Descubrir Premio (Ruleta)

> 🎯 **Estado:** Pendiente de implementación

### Concepto

El usuario entrega uno o más tickets para "descubrir" un premio aleatorio mediante una animación tipo ruleta o scratch card.

### Flujo de Usuario

```
1. Usuario ve cuántos tickets tiene disponibles
2. Selecciona cantidad de tickets a usar (1, 5, 10...)
3. Presiona "Descubrir Premio"
4. Animación de ruleta/revelación
5. Se muestra el premio ganado
6. Premio se añade al inventario del usuario
```

### Componentes Necesarios

- `DiscoverRewardCard.tsx` - Contenedor principal
- `RewardRoulette.tsx` - Animación de la ruleta
- `RewardReveal.tsx` - Modal de revelación del premio

---

## Tab 2: Premios Disponibles

> 🚧 **Estado:** Pendiente de implementación

### Concepto

Catálogo visual de todos los premios que el usuario puede ganar a través del sistema de descubrimiento.

### Información a Mostrar

- Imagen del premio
- Nombre del premio
- Descripción
- Rareza (común, raro, épico, legendario)
- Probabilidad de obtención (opcional)

---

## Tab 3: Canje de Monedas por Tickets

> ✅ **Estado:** Implementado

### Concepto

Permite al usuario convertir sus monedas en tickets. El sistema usa una **tasa fija** configurable desde el backend (ej: 100 monedas = 1 ticket). El usuario selecciona cuántos tickets desea obtener y el sistema calcula automáticamente las monedas necesarias.

### Sistema de Tasa de Cambio

| Configuración        | Descripción                                       |
| -------------------- | ------------------------------------------------- |
| `rate`               | Monedas requeridas por cada ticket (ej: 100)      |
| `limitTickets`       | Límite máximo de tickets canjeables por período   |
| `period`             | Período del límite (`daily`, `monthly`, `yearly`) |
| `ticketsUsed`        | Tickets ya canjeados en el período actual         |
| `ticketsRemaining`   | Tickets disponibles para canjear                  |
| `maxTicketsPossible` | Máximo que puede canjear (según saldo y límite)   |

> ⚠️ **Nota:** La tasa y límites son configurables desde el backend vía `Settings` o variables de entorno.

### Flujo de Usuario

```
1. Al entrar a la página, se obtiene el estado vía GET /status
2. Usuario ve:
   - Su saldo actual (monedas y tickets)
   - La tasa de cambio vigente
   - El límite mensual y cuántos tickets le quedan
3. Usa un selector/input para elegir cuántos tickets quiere
4. Ve en tiempo real cuántas monedas costará
5. Presiona "Canjear"
6. Modal de confirmación: "¿Canjear X monedas por Y tickets?"
7. Confirmación exitosa: toast de éxito + actualización de stats
8. Se muestra el historial de canjes recientes
```

### Componentes Implementados

```
src/components/game/rewards/
├── exchange/
│   ├── TicketSelector.tsx         # Selector de cantidad con +/- y hold
│   ├── ExchangeConfirmModal.tsx   # Modal de confirmación con validaciones
│   ├── ExchangeHistory.tsx        # Listado de canjes recientes
│   ├── ExchangeLimitInfo.tsx      # Info sobre límites + countdown
│   ├── ExchangeRateInfo.tsx       # Información de tasa de cambio
│   └── index.ts                   # Barrel export
├── CountdownTimer.tsx             # Timer reutilizable (soporta días)
└── DailyRewardCard.tsx            # (existente - daily rewards)
```

### UI del Canje

```
┌─────────────────────────────────────────────────────────┐
│  💰 Tu saldo: 3,500 monedas  |  🎫 23 tickets           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tasa de cambio: 100 monedas = 1 ticket                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ¿Cuántos tickets quieres?                      │   │
│  │                                                 │   │
│  │     [ - ]    5 tickets    [ + ]                 │   │
│  │                                                 │   │
│  │     Costo: 500 monedas                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ⚠️ Límite mensual: 5/10 tickets usados (5 restantes)  │
│                                                         │
│  [          Canjear 5 tickets          ]               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  📜 Historial reciente                                  │
│  • 28/11 - 5 tickets (500 monedas)                     │
│  • 27/11 - 2 tickets (200 monedas)                     │
└─────────────────────────────────────────────────────────┘
```

**Estados visuales:**

- **Disponible:** Colores vibrantes, botón activo
- **Sin saldo suficiente:** Botón deshabilitado, mensaje "Te faltan X monedas"
- **Límite alcanzado:** Botón deshabilitado, mensaje con fecha de reset
- **Procesando:** Spinner en botón, disabled

### Validaciones

1. **Frontend:**

   - Verificar `canExchange` del status
   - Limitar selector a `maxTicketsPossible`
   - Deshabilitar durante la transacción para evitar doble clic

2. **Backend:**
   - Validar balance de monedas
   - Validar límite de período
   - Transacción atómica
   - Retornar nuevo `playerStats`

---

## Arquitectura Frontend

### Estructura de Archivos

```
src/
├── app/game/rewards/
│   ├── layout.tsx              # Layout con tabs (configurable via array)
│   ├── page.tsx                # Tab: Canje monedas → tickets (default)
│   ├── discover/
│   │   └── page.tsx            # Tab: Descubrir (Ruleta)
│   └── catalog/
│       └── page.tsx            # Tab: Catálogo de premios
│
├── components/game/rewards/
│   ├── discover/               # Componentes de ruleta (pendiente)
│   ├── catalog/                # Componentes de catálogo (pendiente)
│   ├── exchange/               # Componentes de canje ✅
│   ├── CountdownTimer.tsx      # Timer reutilizable
│   └── DailyRewardCard.tsx     # (existente - daily rewards)
│
├── services/
│   └── exchange.service.ts     # Servicio para API de canje
│
├── store/
│   └── useExchangeStore.ts     # Estado global de canje
│
└── types/
    └── exchange.ts             # TypeScript interfaces
```

---

## API Endpoints

### Canje de Monedas por Tickets

| Método | Endpoint                             | Descripción                               |
| ------ | ------------------------------------ | ----------------------------------------- |
| `GET`  | `/api/exchangeCoinsToTickets/status` | Obtiene estado, tasa, límites e historial |
| `POST` | `/api/exchangeCoinsToTickets`        | Ejecuta un canje de monedas por tickets   |

#### `GET /api/exchangeCoinsToTickets/status`

**Response:**

```json
{
  "status": {
    "canExchange": true,
    "maxTicketsPossible": 3
  },
  "rate": 100,
  "playerStats": {
    "coins": 350,
    "tickets": 23
  },
  "limit": {
    "limitTickets": 10,
    "period": "monthly",
    "ticketsUsed": 5,
    "ticketsRemaining": 5,
    "nextResetDate": "2025-12-01T00:00:00.000Z"
  },
  "history": [
    {
      "executedAt": "2025-11-28T11:33:30.961Z",
      "coinsExchanged": 500,
      "amountDelivered": 5,
      "statusTransaction": "completed"
    }
  ]
}
```

#### `POST /api/exchangeCoinsToTickets`

**Request:**

```json
{
  "data": {
    "ticketsRequested": 3
  }
}
```

**Response Success:**

```json
{
  "ticketsExchanged": 3,
  "coinsSpent": 300,
  "playerStats": {
    "coins": 3700,
    "tickets": 26
  },
  "limit": {
    "limitTickets": 10,
    "period": "monthly",
    "ticketsUsed": 8,
    "ticketsRemaining": 2,
    "nextResetDate": "2025-12-01T00:00:00.000Z"
  },
  "stats": {
    "week": { "ticketsExchanged": 3, "coinsSpent": 300 },
    "month": { "ticketsExchanged": 8, "coinsSpent": 800 },
    "year": { "ticketsExchanged": 8, "coinsSpent": 800 },
    "total": { "ticketsExchanged": 8, "coinsSpent": 800 }
  },
  "history": [...]
}
```

**Response Error - Monedas insuficientes:**

```json
{
  "data": null,
  "error": {
    "status": 400,
    "name": "BadRequestError",
    "message": "Insufficient coins",
    "details": {
      "reason": "insufficient_coins",
      "maxTicketsPossible": 2
    }
  }
}
```

**Response Error - Límite alcanzado:**

```json
{
  "data": null,
  "error": {
    "status": 400,
    "name": "BadRequestError",
    "message": "Exchange limit reached",
    "details": {
      "reason": "exchange_limit_reached",
      "limitTickets": 10,
      "period": "monthly",
      "ticketsUsed": 10,
      "ticketsRemaining": 0,
      "nextResetDate": "2025-12-01T00:00:00.000Z"
    }
  }
}
```

---

## Estado Global (Zustand)

### `useExchangeStore.ts`

```typescript
interface ExchangeLimit {
  limitTickets: number;
  period: "daily" | "monthly" | "yearly";
  ticketsUsed: number;
  ticketsRemaining: number;
  nextResetDate: string;
}

interface ExchangeHistoryItem {
  executedAt: string;
  coinsExchanged: number;
  amountDelivered: number;
  statusTransaction: string;
}

interface ExchangeState {
  // Estado del canje
  canExchange: boolean;
  maxTicketsPossible: number;
  rate: number;
  limit: ExchangeLimit | null;
  history: ExchangeHistoryItem[];

  // Estados de carga
  isLoading: boolean;
  isExchanging: boolean;

  // Último canje exitoso (para feedback)
  lastExchange: {
    ticketsExchanged: number;
    coinsSpent: number;
  } | null;

  // Errores
  error: string | null;

  // Acciones
  fetchStatus: () => Promise<void>;
  exchangeCoinsForTickets: (ticketsRequested: number) => Promise<boolean>;
  reset: () => void;
}
```

## Historial de Cambios

| Fecha      | Cambio                                                   | Autor |
| ---------- | -------------------------------------------------------- | ----- |
| 2025-11-28 | Creación inicial del documento                           | -     |
| 2025-11-28 | Actualización con API real del backend (exchange status) | -     |
| 2025-11-28 | Implementación completa del sistema de canje             | -     |
| 2025-11-28 | Reorganización de tabs (Canjear como tab por defecto)    | -     |
