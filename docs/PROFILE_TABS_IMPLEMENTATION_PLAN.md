# Plan de Implementación: Tabs del Perfil de Usuario

**Fecha:** 1 de diciembre de 2025  
**Estado:** Planificación  
**Prioridad:** Media-Alta

---

## 📋 Tabla de Contenidos

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Estado Actual](#estado-actual)
- [Tabs Pendientes](#tabs-pendientes)
  - [1. Logros (Achievements)](#1-logros-achievements)
  - [2. Premios (Awards)](#2-premios-awards)
  - [3. Cambios (Changes)](#3-cambios-changes)
  - [4. Notificaciones](#4-notificaciones)
- [Componentes Reutilizables](#componentes-reutilizables)
- [Necesidades del Backend](#necesidades-del-backend)
- [Plan de Ejecución](#plan-de-ejecución)
- [Estimaciones](#estimaciones)

---

## 📊 Resumen Ejecutivo

Actualmente, el perfil de usuario tiene **7 tabs**, de los cuales solo **2 están completamente implementados**:

| Tab            | Ruta                          | Estado       | Prioridad |
| -------------- | ----------------------------- | ------------ | --------- |
| Perfil         | `/game/profile`               | ✅ Completo  | -         |
| Puntajes       | `/game/profile/scores`        | ✅ Completo  | -         |
| Premios        | `/game/profile/awards`        | ⚠️ Pendiente | Alta      |
| Logros         | `/game/profile/achievements`  | ⚠️ Pendiente | Alta      |
| Cambios        | `/game/profile/changes`       | ⚠️ Pendiente | Media     |
| Notificaciones | `/game/profile/notifications` | ⚠️ Pendiente | Media     |
| Configuración  | `/game/profile/settings`      | ✅ Completo  | -         |

---

## 🎯 Estado Actual

### ✅ Tabs Implementados

#### 1. **Perfil** (`/game/profile`)

- Muestra avatar, username, nombre completo
- Sin funcionalidad adicional (vista de solo lectura)

#### 2. **Puntajes** (`/game/profile/scores`)

- **Completamente funcional**
- Componentes: `ScoresTable`, `ScoresSummary`, `TablePagination`
- Servicio: `UserGameHistoryService`
- Muestra historial de partidas con:
  - Nivel jugado
  - Puntaje
  - Duración
  - Completado (Sí/No)
  - Monedas ganadas
  - Fecha
- Paginación (6 registros por página)
- Estado de carga y error

#### 3. **Configuración** (`/game/profile/settings`)

- **Completamente funcional**
- Formularios: Datos personales, datos de contacto
- Upload de avatar
- Cambio de contraseña
- Gestión de tutores/guardianes

### ⚠️ Tabs Pendientes

Todos muestran actualmente un mensaje de "Próximamente".

---

## 🔧 Tabs Pendientes

### 1. Logros (Achievements)

#### **Objetivo**

Mostrar el historial de logros del usuario en formato tabla, similar a Puntajes, con información detallada de progreso y estado.

#### **Diseño Propuesto**

```
┌─────────────────────────────────────────────────────────┐
│  🏆 Logros                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Resumen: 12/25 completados | 8 reclamados | 4 pendientes │
│                                                         │
│  Filtros: [Todos] [Bloqueados] [Completados] [Reclamados] │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📊 Tabla de Logros                              │  │
│  ├─────────────┬─────────────┬──────────┬──────────┤  │
│  │ Logro       │ Progreso    │ Recompensa│ Estado  │  │
│  ├─────────────┼─────────────┼──────────┼──────────┤  │
│  │ 🎯 Logro 1  │ ████████ 80%│ 💰 500   │ Bloqueado│  │
│  │ Descripción │ 800/1000    │          │          │  │
│  ├─────────────┼─────────────┼──────────┼──────────┤  │
│  │ 🏆 Logro 2  │ ████████100%│ 🎫 2     │[Reclamar]│  │
│  │ Descripción │ 1000/1000   │          │          │  │
│  │             │ 30/11/2025  │          │          │  │
│  ├─────────────┼─────────────┼──────────┼──────────┤  │
│  │ ✨ Logro 3  │ ████████100%│ 💰 1000  │ Reclamado│  │
│  │ Descripción │ 1000/1000   │          │ 01/12/25 │  │
│  └─────────────┴─────────────┴──────────┴──────────┘  │
│                                                         │
│  Mostrando 1-10 de 25 logros     [Anterior] [Siguiente]│
└─────────────────────────────────────────────────────────┘
```

#### **Componentes a Reutilizar**

- ✅ `TablePagination`
- ✅ `CardHeaderSticky`
- ✅ Similar a `ScoresTable` pero para logros

#### **Componentes Nuevos**

- `AchievementsTable` - Tabla de logros con progreso
- `AchievementsFilterTabs` - Tabs para filtrar por estado
- `AchievementsStatsBar` - Barra de resumen (completados/reclamados)
- `ProgressCell` - Celda con barra de progreso y porcentaje

#### **API/Backend Necesario**

- ✅ **Ya existe**: `GET /api/achievements/my-achievements`
  - Parámetros: `page`, `pageSize`, `status` (locked/completed/claimed)
- ✅ **Ya existe**: `POST /api/achievements/claim`
  - Body: `{ uuid: string }`

#### **Store**

- ✅ **Ya existe**: `useAchievementsStore`
  - Ya tiene `fetchAchievements()`, `claimAchievement()`

#### **Implementación**

```typescript
// src/app/game/profile/achievements/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAchievementsStore } from "@/store/useAchievementsStore";
import { AchievementCard } from "@/components/game/achievements/AchievementCard";
import { TablePagination } from "@/components/ui/TablePagination";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";
import { AchievementStatus } from "@/types/achievements";

const PAGE_SIZE = 9;

export default function ProfileAchievementsPage() {
  const [filterStatus, setFilterStatus] = useState<AchievementStatus | "all">(
    "all",
  );
  const {
    achievements,
    pagination,
    isLoading,
    fetchAchievements,
    claimAchievement,
  } = useAchievementsStore();

  useEffect(() => {
    fetchAchievements({
      page: 1,
      pageSize: PAGE_SIZE,
      status: filterStatus === "all" ? undefined : filterStatus,
    });
  }, [filterStatus, fetchAchievements]);

  const handlePageChange = (page: number) => {
    fetchAchievements({
      page,
      pageSize: PAGE_SIZE,
      status: filterStatus === "all" ? undefined : filterStatus,
    });
  };

  const completedCount = achievements.filter(
    (a) => a.status === "completed" || a.status === "claimed",
  ).length;
  const totalCount = pagination.total;

  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky title={`Logros (${completedCount}/${totalCount})`} />

      <div className="flex-1 p-4 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {["all", "locked", "completed", "claimed"].map((status) => (
            <button
              key={status}
              onClick={() =>
                setFilterStatus(status as AchievementStatus | "all")
              }
              className={/* ... */}
            >
              {status === "all" ? "Todos" : status}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.uuid}
              achievement={achievement}
              onClaim={claimAchievement}
            />
          ))}
        </div>

        {/* Pagination */}
        <TablePagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={handlePageChange}
          label="logros"
        />
      </div>
    </div>
  );
}
```

#### **Esfuerzo Estimado**: 🟢 Bajo (2-3 horas)

- Patrón de tabla ya establecido con ScoresTable
- Store y servicios ya existen
- Solo crear AchievementsTable y conectar

---

### 2. Premios (Awards)

#### **Objetivo**

Mostrar el historial de premios ganados por el usuario en formato tabla, con estado de reclamación y fechas.

#### **Diseño Propuesto**

```
┌─────────────────────────────────────────────────────────┐
│  🎁 Mis Premios                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Resumen: 45 premios | 12 disponibles | 33 reclamados  │
│                                                         │
│  Filtros: [Todos] [Disponibles] [Reclamados]           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📊 Tabla de Premios                             │  │
│  ├─────────────┬────────────┬──────────┬──────────┤  │
│  │ Premio      │ Tipo/Valor │ Obtenido │ Estado   │  │
│  ├─────────────┼────────────┼──────────┼──────────┤  │
│  │ 💰 Monedas  │ Currency   │ 28/11/25 │[Reclamar]│  │
│  │ 100 coins   │ 100        │ 14:30    │          │  │
│  ├─────────────┼────────────┼──────────┼──────────┤  │
│  │ 🎫 Tickets  │ Currency   │ 29/11/25 │Reclamado │  │
│  │ 2 tickets   │ 2          │ 10:15    │ 29/11/25 │  │
│  ├─────────────┼────────────┼──────────┼──────────┤  │
│  │ 🎨 Avatar   │ Cosmetic   │ 30/11/25 │Disponible│  │
│  │ Premium     │ -          │ 18:45    │          │  │
│  └─────────────┴────────────┴──────────┴──────────┘  │
│                                                         │
│  Mostrando 1-10 de 45 premios    [Anterior] [Siguiente]│
└─────────────────────────────────────────────────────────┘
```

#### **Componentes a Reutilizar**

- ✅ `TablePagination`
- ✅ `CardHeaderSticky`
- ✅ Patrón de `ScoresTable`

#### **Componentes Nuevos**

- `UserRewardsTable` - Tabla de premios del usuario
- `RewardsStatsBar` - Barra con estadísticas (X disponibles, Y reclamados, Z total)
- `RewardTypeCell` - Celda que muestra tipo e icono del premio

#### **API/Backend Necesario**

⚠️ **NECESITA IMPLEMENTACIÓN EN BACKEND**

```typescript
// Endpoint para listar premios del usuario
GET /api/user-rewards/my-rewards
Query params:
  - page: number
  - pageSize: number
  - status: "pending" | "claimed" | "available" (opcional)
  - sort: string (ej: "obtainedAt:desc")

Response:
{
  data: [
    {
      uuid: string;
      reward: {
        uuid: string;
        name: string;
        description: string;
        image: { url: string } | null;
        typeReward: "currency" | "consumable" | "cosmetic";
        value: number;
        quantity: number;
      };
      rewardStatus: "pending" | "claimed" | "available";
      quantity: number;
      obtainedAt: string; // ISO date
      claimedAt: string | null; // ISO date
    }
  ],
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    }
  }
}
```

```typescript
// Endpoint para reclamar un premio
POST /api/user-rewards/claim
Body: { userRewardUuid: string }

Response:
{
  claimedReward: {
    uuid: string;
    name: string;
    typeReward: string;
    value: number;
    claimedAt: string;
  };
  playerStats: {
    coins: number;
    tickets: number;
  };
}

Errors:
- 400: "Reward already claimed"
- 404: "Reward not found"
- 403: "Not your reward"
```

#### **Store Necesario**

```typescript
// src/store/useUserRewardsStore.ts
interface UserRewardsState {
  rewards: UserReward[];
  pagination: Pagination;
  isLoading: boolean;
  isClaiming: boolean;
  error: string | null;

  fetchRewards: (filters?: RewardsFilters) => Promise<void>;
  claimReward: (uuid: string) => Promise<boolean>;
  reset: () => void;
}
```

#### **Servicio Necesario**

```typescript
// src/services/user-rewards.service.ts
export const UserRewardsService = {
  listMyRewards: async (params?: ListParams) => Promise<UserRewardsResponse>;
  claimReward: async (uuid: string) => Promise<ClaimResponse>;
}
```

#### **Tipos Necesarios**

Ya existen parcialmente en `types/reward.ts` y `types/user.ts`, pero necesitan extenderse.

#### **Estructura de Tabla**

**Columnas**:

1. **Premio** - Nombre, icono, cantidad
2. **Tipo/Valor** - Tipo de premio (currency/consumable/cosmetic), valor
3. **Obtenido** - Fecha y hora de obtención
4. **Estado** - Badge de estado + botón de reclamar si disponible

#### **Esfuerzo Estimado**: 🟡 Medio (4-5 horas)

- Requiere implementación completa del backend
- Necesita nuevo store y servicio
- Tabla similar a Scores y Achievements

---

### 3. Cambios (Changes)

#### **Objetivo**

Mostrar un historial de cambios/transacciones importantes del usuario: canjes de monedas, uso de tickets, reclamación de premios, etc.

#### **Diseño Propuesto**

```
┌─────────────────────────────────────────────────────────┐
│  🔄 Historial de Cambios                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Filtros: [Todo] [Monedas] [Tickets] [Premios]         │
│                                                         │
│  Rango de fechas: [Última semana ▼]                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📊 Tabla de Cambios                             │  │
│  ├──────────┬──────────┬────────────┬──────────────┤  │
│  │ Fecha    │ Tipo     │ Cantidad   │ Descripción  │  │
│  ├──────────┼──────────┼────────────┼──────────────┤  │
│  │ 01/12/25 │ 💰 Canje │ -500 coins │ Canje por 5  │  │
│  │ 10:30    │          │ +5 tickets │ tickets      │  │
│  ├──────────┼──────────┼────────────┼──────────────┤  │
│  │ 30/11/25 │ 🎁 Premio│ +100 coins │ Ruleta de    │  │
│  │ 15:20    │          │            │ premios      │  │
│  ├──────────┼──────────┼────────────┼──────────────┤  │
│  │ 29/11/25 │ 🎯 Logro │ +500 coins │ Reclamación  │  │
│  │ 08:15    │          │            │ Logro 1      │  │
│  └──────────┴──────────┴────────────┴──────────────┘  │
│                                                         │
│  Mostrando 1-10 de 127 cambios   [Anterior] [Siguiente]│
└─────────────────────────────────────────────────────────┘
```

#### **Componentes a Reutilizar**

- ✅ `TablePagination`
- ✅ `CardHeaderSticky`
- Similar a `ScoresTable` pero adaptado

#### **Componentes Nuevos**

- `ChangesTable` - Tabla específica para cambios
- `ChangesFilters` - Filtros por tipo y fecha
- `ChangeTypeIcon` - Icono según tipo de cambio

#### **API/Backend Necesario**

⚠️ **NECESITA IMPLEMENTACIÓN EN BACKEND**

```typescript
// Endpoint para historial de transacciones/cambios
GET /api/user-transactions/history
Query params:
  - page: number
  - pageSize: number
  - type: "coin_exchange" | "reward_claim" | "achievement_claim" | "game_reward" | "daily_reward" (opcional)
  - startDate: string (ISO date, opcional)
  - endDate: string (ISO date, opcional)
  - sort: string (default: "executedAt:desc")

Response:
{
  data: [
    {
      uuid: string;
      transactionType: "coin_exchange" | "reward_claim" | "achievement_claim" | "game_reward" | "daily_reward";
      description: string;
      changes: {
        coins?: number; // positivo = ganó, negativo = gastó
        tickets?: number;
      };
      metadata?: {
        // Info adicional según el tipo
        rewardName?: string;
        achievementTitle?: string;
        levelName?: string;
      };
      executedAt: string; // ISO date
      status: "completed" | "failed" | "pending";
    }
  ],
  meta: {
    pagination: {...};
    summary: {
      totalCoinsGained: number;
      totalCoinsSpent: number;
      totalTicketsGained: number;
      totalTicketsSpent: number;
    }
  }
}
```

#### **Store Necesario**

```typescript
// src/store/useTransactionsStore.ts
interface TransactionsState {
  transactions: Transaction[];
  pagination: Pagination;
  filters: TransactionFilters;
  summary: TransactionSummary | null;
  isLoading: boolean;

  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  setFilters: (filters: TransactionFilters) => void;
  reset: () => void;
}
```

#### **Tipos Necesarios**

```typescript
// src/types/transaction.ts
export type TransactionType =
  | "coin_exchange"
  | "reward_claim"
  | "achievement_claim"
  | "game_reward"
  | "daily_reward"
  | "ticket_spent";

export interface Transaction {
  uuid: string;
  transactionType: TransactionType;
  description: string;
  changes: {
    coins?: number;
    tickets?: number;
  };
  metadata?: Record<string, any>;
  executedAt: string;
  status: "completed" | "failed" | "pending";
}

export interface TransactionFilters {
  page?: number;
  pageSize?: number;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
}

export interface TransactionSummary {
  totalCoinsGained: number;
  totalCoinsSpent: number;
  totalTicketsGained: number;
  totalTicketsSpent: number;
}
```

#### **Esfuerzo Estimado**: 🟡 Medio-Alto (5-7 horas)

- Requiere implementación completa del backend
- Tabla compleja con múltiples tipos de datos
- Filtros de fecha y tipo
- Podría consolidar datos de varios endpoints existentes

---

### 4. Notificaciones

#### **Objetivo**

Centro de notificaciones del usuario donde puede ver todas sus alertas, avisos y mensajes del sistema.

#### **Diseño Propuesto**

```
┌─────────────────────────────────────────────────────────┐
│  🔔 Notificaciones (3 nuevas)                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Todas] [No leídas] [Leídas]     [Marcar todo leído]  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 🎁 ¡Nuevo premio disponible!            [NUEVA] │  │
│  │ Has ganado 100 monedas en la ruleta             │  │
│  │ Hace 2 horas                                    │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 🏆 ¡Logro desbloqueado!                 [NUEVA] │  │
│  │ Completaste "Primeros Pasos"                    │  │
│  │ Hace 5 horas                                    │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ℹ️ Perfil incompleto                            │  │
│  │ Completa tus datos para desbloquear funciones   │  │
│  │ Hace 1 día                              [Leída] │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Mostrando 1-10 de 45 notificaciones [Anterior] [Siguiente] │
└─────────────────────────────────────────────────────────┘
```

#### **Componentes a Reutilizar**

- ✅ `TablePagination`
- ✅ `CardHeaderSticky`

#### **Componentes Nuevos**

- `NotificationsList` - Lista de notificaciones
- `NotificationItem` - Tarjeta individual de notificación
- `NotificationsFilters` - Filtros (todas/no leídas/leídas)
- `NotificationIcon` - Icono según tipo de notificación

#### **API/Backend Necesario**

⚠️ **NECESITA IMPLEMENTACIÓN COMPLETA EN BACKEND**

Actualmente existe un servicio MOCK en `notification.service.ts` que debe conectarse a un endpoint real.

```typescript
// Endpoints necesarios para notificaciones
GET /api/notifications/my-notifications
Query params:
  - page: number
  - pageSize: number
  - isRead: boolean (opcional - true/false para filtrar)
  - sort: string (default: "createdAt:desc")

Response:
{
  data: [
    {
      documentId: string;
      uuid: string;
      title: string;
      description: string;
      type: "info" | "success" | "warning" | "achievement" | "reward" | "system";
      isRead: boolean;
      priority: "low" | "normal" | "high";
      actionUrl?: string; // URL opcional para acción (ej: ir a logros)
      metadata?: Record<string, any>; // Info adicional
      createdAt: string; // ISO date
      readAt?: string | null; // ISO date
    }
  ],
  meta: {
    pagination: {...};
    unreadCount: number;
  }
}
```

```typescript
// Marcar notificación como leída
PUT /api/notifications/:uuid/mark-read

Response:
{
  notification: {...}; // notificación actualizada
  unreadCount: number; // nuevo contador de no leídas
}
```

```typescript
// Marcar todas como leídas
POST / api / notifications / mark - all - read;

Response: {
  markedCount: number;
  unreadCount: number; // debería ser 0
}
```

```typescript
// Eliminar notificación (opcional)
DELETE /api/notifications/:uuid

Response:
{
  success: boolean;
}
```

#### **Store Necesario**

```typescript
// src/store/useNotificationsStore.ts (extender el existente)
interface NotificationsState {
  notifications: NotificationItem[];
  pagination: Pagination;
  unreadCount: number;
  filters: NotificationFilters;
  isLoading: boolean;

  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (uuid: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (uuid: string) => Promise<void>;
  setFilters: (filters: NotificationFilters) => void;
  reset: () => void;
}
```

#### **Tipos Necesarios**

Extender `types/notification.ts`:

```typescript
export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "achievement"
  | "reward"
  | "system";

export type NotificationPriority = "low" | "normal" | "high";

export interface NotificationItem {
  documentId: string;
  uuid: string;
  title: string;
  description: string;
  type: NotificationType;
  isRead: boolean;
  priority: NotificationPriority;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationFilters {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
  type?: NotificationType;
}

export interface NotificationsPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface NotificationsResponse {
  data: NotificationItem[];
  meta: {
    pagination: NotificationsPagination;
    unreadCount: number;
  };
}
```

#### **Estructura de Tabla**

**Columnas**:

1. **Notificación** - Icono según tipo, título, descripción
2. **Tipo** - Badge de tipo (info/success/warning/achievement/reward)
3. **Fecha** - Fecha y hora de creación, "hace X tiempo"
4. **Estado** - Badge de leído/no leído + acción

**Comportamiento**:

- Click en fila marca como leída (si no leída)
- Botón "Marcar todas como leídas" en header
- Contador de no leídas en título
- Opción de eliminar notificación (icono en fila)

#### **Esfuerzo Estimado**: 🟡 Medio (4-5 horas)

- Backend necesita implementación completa
- Tabla con interacciones (marcar leído, eliminar)
- Integración con store de notificaciones existente

---

## 🧩 Componentes Reutilizables

### ✅ Ya Existentes

| Componente         | Ubicación                      | Uso                      |
| ------------------ | ------------------------------ | ------------------------ |
| `TablePagination`  | `components/ui`                | Paginación universal     |
| `CardHeaderSticky` | `components/ui`                | Header sticky para cards |
| `IconTabs`         | `components/ui`                | Tabs con iconos          |
| `GridContainer`    | `components/ui`                | Grid responsivo          |
| `RewardCard`       | `components/ui`                | Tarjetas de premios      |
| `AchievementCard`  | `components/game/achievements` | Tarjetas de logros       |
| `ScoresTable`      | `components/scores`            | Referencia para tablas   |

### 🆕 Por Crear (Componentes Genéricos)

#### 1. `DataTable` (Genérico) - **ALTA PRIORIDAD**

Componente base reutilizable para todas las tablas del perfil:

**Características**:

- Columnas configurables
- Sorting opcional
- Estados: loading, error, empty
- Filas vacías para altura fija (como ScoresTable)
- Responsive con scroll horizontal en móvil
- Hover states
- Variantes de estilos consistentes

```typescript
// src/components/ui/DataTable.tsx
interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  error?: string;
  emptyMessage?: string;
  minRows?: number; // Filas mínimas para altura consistente
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  className?: string;
}
```

**Beneficio**:

- Evita duplicar código entre todas las tablas
- Consistencia visual en todo el perfil
- Una sola fuente de verdad para estilos de tablas
- Facilita mantener responsive design

#### 2. `FilterTabs`

Tabs horizontales para filtros rápidos (reutilizable para Logros, Premios, Notificaciones):

```typescript
// src/components/ui/FilterTabs.tsx
interface FilterTab {
  value: string;
  label: string;
  count?: number; // Opcional: mostrar cantidad
  icon?: React.ComponentType;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}
```

#### 3. `EmptyState`

Componente para estados vacíos consistentes:

```typescript
// src/components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon?: React.ComponentType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Esfuerzo**: 🟢 3-4 horas totales

**Nota importante**: El componente `DataTable` debería crearse **primero** ya que será la base para todas las demás tablas. Esto evitará refactorizar después.

---

## 🔌 Necesidades del Backend

### Prioridad Alta

#### 1. **User Rewards** (Premios del usuario)

```
GET  /api/user-rewards/my-rewards
POST /api/user-rewards/claim
```

**Razón**: Tab de Premios es de alta prioridad y alta visibilidad

#### 2. **Notificaciones**

```
GET    /api/notifications/my-notifications
PUT    /api/notifications/:uuid/mark-read
POST   /api/notifications/mark-all-read
DELETE /api/notifications/:uuid (opcional)
```

**Razón**: Fundamental para UX y comunicación con el usuario

### Prioridad Media

#### 3. **Historial de Transacciones**

```
GET /api/user-transactions/history
```

**Razón**: Útil para transparencia, pero no crítico para gameplay

### Ya Implementados ✅

- ✅ Achievements (`/api/achievements/*`)
- ✅ User Game History (`/api/user-game-histories/*`)
- ✅ Exchange Coins/Tickets (`/api/exchangeCoinsToTickets/*`)
- ✅ Rewards Catalog (`/api/rewards/*`)
- ✅ Daily Rewards (`/api/daily-rewards/*`)

---

## 📅 Plan de Ejecución

### Fase 1: Fundamentos (Medio día)

**Objetivo**: Crear componentes reutilizables base para tablas

1. ✅ Crear `DataTable` genérico (componente base para todas las tablas)
2. ✅ Crear `FilterTabs` reutilizable
3. ✅ Crear `EmptyState`
4. ✅ Refactorizar `ScoresTable` para usar `DataTable` (validación)

**Entregable**: Componente `DataTable` probado y funcionando

**Por qué primero**: Todas las demás tablas dependerán de este componente

---

### Fase 2: Logros en Perfil (Medio día)

**Objetivo**: Tab de Logros completamente funcional con tabla

**Backend**: ✅ Ya existe

**Tareas**:

1. ✅ Crear `AchievementsTable` usando `DataTable`
2. ✅ Crear `ProgressCell` component (barra de progreso)
3. ✅ Crear `AchievementsStatsBar` (resumen)
4. ✅ Crear `/game/profile/achievements/page.tsx`
5. ✅ Implementar filtros de estado (locked/completed/claimed)
6. ✅ Conectar a `useAchievementsStore`
7. ✅ Testing

**Entregable**: Tab de Logros funcional con tabla, filtros y paginación

---

### Fase 3: Backend para Premios y Notificaciones (Tiempo del Backend)

**Objetivo**: Implementar endpoints necesarios en el backend

**Tareas Backend**:

1. ⚠️ Implementar endpoints de User Rewards
2. ⚠️ Implementar endpoints de Notificaciones
3. ⚠️ Testing y documentación

**Bloqueante para**: Fase 4 y 5

---

### Fase 4: Premios en Perfil (1 día)

**Objetivo**: Tab de Premios completamente funcional con tabla

**Requiere**: Endpoints de User Rewards

**Tareas**:

1. ⚠️ Crear tipos en `types/user-reward.ts`
2. ⚠️ Crear servicio `user-rewards.service.ts`
3. ⚠️ Crear store `useUserRewardsStore.ts`
4. ⚠️ Crear `UserRewardsTable` usando `DataTable`
5. ⚠️ Crear `RewardTypeCell` component
6. ⚠️ Crear `RewardsStatsBar` (resumen)
7. ⚠️ Crear `/game/profile/awards/page.tsx`
8. ⚠️ Implementar filtros (disponibles/reclamados)
9. ⚠️ Testing

**Entregable**: Tab de Premios con tabla, reclamación y filtros

---

### Fase 5: Notificaciones en Perfil (1 día)

**Objetivo**: Tab de Notificaciones completamente funcional con tabla

**Requiere**: Endpoints de Notificaciones

**Tareas**:

1. ⚠️ Extender tipos en `types/notification.ts`
2. ⚠️ Actualizar servicio `notification.service.ts` (quitar mock)
3. ⚠️ Extender store `useNotificationStore.ts`
4. ⚠️ Crear `NotificationsTable` usando `DataTable`
5. ⚠️ Crear `NotificationTypeCell` component
6. ⚠️ Crear `/game/profile/notifications/page.tsx`
7. ⚠️ Implementar filtros (todas/no leídas/leídas)
8. ⚠️ Funcionalidad "Marcar como leído" en fila
9. ⚠️ Botón "Marcar todas como leídas" en header
10. ⚠️ Testing

**Entregable**: Tab de Notificaciones con tabla interactiva y gestión de lectura

---

### Fase 6: Historial de Cambios (1 día)

**Objetivo**: Tab de Cambios/Transacciones completamente funcional con tabla

**Requiere**: Endpoint de Transactions History (o consolidación)

**Tareas**:

1. ⚠️ Crear tipos en `types/transaction.ts`
2. ⚠️ Crear servicio `transaction.service.ts`
3. ⚠️ Crear store `useTransactionsStore.ts`
4. ⚠️ Crear `TransactionsTable` usando `DataTable`
5. ⚠️ Crear `TransactionTypeCell` component
6. ⚠️ Crear `TransactionSummaryBar` (resumen de stats)
7. ⚠️ Crear `/game/profile/changes/page.tsx`
8. ⚠️ Implementar filtros (tipo, rango de fechas)
9. ⚠️ Testing

**Entregable**: Tab de Cambios con tabla, filtros y estadísticas

---

### Fase 7: Polish y Optimización (Medio día)

**Objetivo**: Refinamiento y optimización

**Tareas**:

1. ⚠️ Review de UX en todos los tabs
2. ⚠️ Optimización de performance (React.memo, lazy loading)
3. ⚠️ Manejo de errores consistente
4. ⚠️ Loading states consistentes
5. ⚠️ Responsive design final
6. ⚠️ Accessibility (a11y)
7. ⚠️ Documentación final

**Entregable**: Perfil de usuario completo y pulido

---

## ⏱️ Estimaciones

### Por Tab

| Tab              | Backend | Frontend | Testing | Total   |
| ---------------- | ------- | -------- | ------- | ------- |
| Logros           | 0h ✅   | 2h       | 1h      | **3h**  |
| Premios          | 4h      | 3h       | 1h      | **8h**  |
| Notificaciones   | 3h      | 3h       | 1h      | **7h**  |
| Cambios          | 4h      | 4h       | 1h      | **9h**  |
| Componentes Base | 0h      | 3h       | 0h      | **3h**  |
| Polish           | 0h      | 2h       | 1h      | **3h**  |
| **TOTAL**        | **11h** | **17h**  | **5h**  | **33h** |

### Por Persona

**Backend Developer**: ~11 horas (1.5 días)  
**Frontend Developer**: ~22 horas (3 días)

### Timeline Completo

**Con backend en paralelo**: 3-4 días laborales  
**Con backend secuencial**: 5-6 días laborales

---

## 🎯 Decisiones Pendientes

### A Definir

1. **Priorización de Tabs**
   - ¿Cuál implementamos primero? (Recomendado: Logros → Premios → Notificaciones → Cambios)
2. **Alcance de Notificaciones**

   - ¿Las notificaciones son solo informativas o pueden tener acciones?
   - ¿Necesitan sistema de prioridades?
   - ¿Push notifications en el futuro?

3. **Historial de Cambios**

   - ¿Consolidamos todas las transacciones en un endpoint o usamos múltiples?
   - ¿Cuánto historial guardamos? (último mes, año, todo)

4. **Performance**

   - ¿Implementamos virtual scrolling para listas largas?
   - ¿Cache en frontend con React Query/SWR?

5. **Diseño Visual**
   - ¿Los tabs deben seguir el mismo diseño que `/game/rewards` o más simple?
   - ¿Necesitamos animaciones especiales?

---

## 📝 Notas Adicionales

### Consideraciones Técnicas

- **Estado Global**: Usar Zustand para consistencia
- **Caché**: Considerar React Query para optimizar llamadas
- **Optimistic Updates**: Para mejor UX en reclamaciones
- **Error Boundaries**: Para manejo robusto de errores
- **Skeleton Loaders**: Para estados de carga

### Mejoras Futuras (Post-MVP)

- Exportar historial a CSV/PDF
- Filtros avanzados con date ranges
- Búsqueda en notificaciones
- Badges/logros especiales en perfil
- Comparación con otros jugadores
- Gráficos de progreso histórico

---

## ✅ Checklist de Inicio

Antes de comenzar la implementación:

- [ ] Revisar y aprobar este plan
- [ ] Definir priorización de tabs
- [ ] Backend confirma disponibilidad para endpoints
- [ ] Diseñador confirma diseños (si aplica)
- [ ] Crear issues/tickets en el sistema de gestión
- [ ] Setup de branches (feature/profile-achievements, etc.)

---

**Última actualización**: 1 de diciembre de 2025  
**Autor**: GitHub Copilot  
**Estado**: Pendiente de Aprobación
