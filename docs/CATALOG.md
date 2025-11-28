# Sistema de Catálogo

El catálogo muestra todos los premios disponibles que los usuarios pueden ganar a través del sistema de ruleta.

## Descripción General

El catálogo proporciona una vista navegable de todas las recompensas, permitiendo a los usuarios ver qué premios están disponibles antes de gastar sus tickets en la ruleta.

## Características

- **Vista Filtrada**: Filtrar premios por tipo (monedas, tickets, consumibles, cosméticos)
- **Grid Responsivo**: 2 columnas en móvil, 3 en tablet, 4 en escritorio
- **Paginación**: Navegar por todos los premios disponibles
- **Animaciones Suaves**: Animaciones escalonadas de fade-in para las tarjetas

## Endpoint de API

### Obtener Catálogo

```
GET /api/rewards?populate=image&pagination[page]=1&pagination[pageSize]=8&sort=name:asc
```

**Filtros Opcionales:**

- `filters[typeReward][$eq]=currency` - Filtrar por tipo de recompensa

**Respuesta:**

```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123",
      "uuid": "R04uSATn5BN9YLGiMUUBMYkM",
      "name": "100 Coins",
      "description": "Una pequeña cantidad de monedas",
      "typeReward": "currency",
      "quantity": 50,
      "value": 100,
      "probability": 40,
      "image": {
        "id": 1,
        "url": "/uploads/coins.jpg",
        "name": "coins.jpg"
      },
      "createdAt": "2025-11-28T14:59:41.121Z",
      "updatedAt": "2025-11-28T14:59:41.618Z",
      "publishedAt": "2025-11-28T14:59:41.632Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 8,
      "pageCount": 2,
      "total": 9
    }
  }
}
```

## Tipos de Recompensa

| Tipo         | Descripción                | Ejemplos         |
| ------------ | -------------------------- | ---------------- |
| `currency`   | Moneda del juego           | Monedas, Tickets |
| `consumable` | Items de un solo uso       | Gift Cards       |
| `cosmetic`   | Personalizaciones visuales | Avatares, Temas  |

## Filtrado en Frontend

Como el backend usa `currency` tanto para monedas como para tickets, el frontend aplica filtrado adicional basado en el nombre de la recompensa:

- **Monedas**: `reward.name.toLowerCase().includes("coin")`
- **Tickets**: `reward.name.toLowerCase().includes("ticket")`

## Componentes

### CatalogFilters

Botones de filtro para seleccionar el tipo de recompensa.

```tsx
<CatalogFilters activeFilter={filter} onFilterChange={setFilter} />
```

### CatalogCard

Tarjeta individual de recompensa con imagen, badge de tipo y descripción.

```tsx
<CatalogCard reward={reward} />
```

### CatalogGrid

Grid responsivo con animaciones escalonadas.

```tsx
<CatalogGrid rewards={rewards} isLoading={isLoading} />
```

## Gestión de Estado

El catálogo usa un store de Zustand (`useCatalogStore`) para gestionar el estado de los filtros entre el layout y los componentes de la página.

```typescript
interface CatalogState {
  filter: CatalogFilterType;
  setFilter: (filter: CatalogFilterType) => void;
}
```

## Imágenes de Fallback

Las imágenes de fallback están centralizadas en `/src/constants/images.ts`:

```typescript
export const FALLBACK_IMAGES = {
  reward: "/images/fallbacks/reward.jpg",
  rewardSmall: "/images/fallbacks/reward-small.jpg",
  // ...
};
```

Las imágenes locales se almacenan en `/public/images/fallbacks/`.

## Detalles de UI/UX

- Las tarjetas tienen efecto de sombra al hover
- Los badges de tipo están codificados por color:
  - Monedas: Ámbar
  - Tickets: Azul
  - Consumibles: Verde
  - Cosméticos: Púrpura
- La paginación se mantiene en la parte inferior del contenedor
- Los botones de filtro están integrados en el header de la página
