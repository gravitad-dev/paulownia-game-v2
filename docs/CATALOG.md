# Catalog System

The catalog displays all available prizes that users can win through the roulette system.

## Overview

The catalog provides a browsable view of all rewards, allowing users to see what prizes are available before spending their tickets on the roulette.

## Features

- **Filtered View**: Filter rewards by type (coins, tickets, consumables, cosmetics)
- **Responsive Grid**: 2 columns on mobile, 3 on tablet, 4 on desktop
- **Pagination**: Navigate through all available rewards
- **Smooth Animations**: Staggered fade-in animations for cards

## API Endpoint

### Get Catalog

```
GET /api/rewards?populate=image&pagination[page]=1&pagination[pageSize]=8&sort=name:asc
```

**Optional Filters:**

- `filters[typeReward][$eq]=currency` - Filter by reward type

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123",
      "uuid": "R04uSATn5BN9YLGiMUUBMYkM",
      "name": "100 Coins",
      "description": "A small amount of coins",
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

## Reward Types

| Type         | Description           | Examples        |
| ------------ | --------------------- | --------------- |
| `currency`   | In-game currency      | Coins, Tickets  |
| `consumable` | One-time use items    | Gift Cards      |
| `cosmetic`   | Visual customizations | Avatars, Themes |

## Frontend Filtering

Since the backend uses `currency` for both coins and tickets, the frontend applies additional filtering based on the reward name:

- **Coins**: `reward.name.toLowerCase().includes("coin")`
- **Tickets**: `reward.name.toLowerCase().includes("ticket")`

## Components

### CatalogFilters

Filter buttons for selecting reward type.

```tsx
<CatalogFilters activeFilter={filter} onFilterChange={setFilter} />
```

### CatalogCard

Individual reward card with image, type badge, and description.

```tsx
<CatalogCard reward={reward} />
```

### CatalogGrid

Responsive grid with staggered animations.

```tsx
<CatalogGrid rewards={rewards} isLoading={isLoading} />
```

## State Management

The catalog uses a Zustand store (`useCatalogStore`) to manage filter state across the layout and page components.

```typescript
interface CatalogState {
  filter: CatalogFilterType;
  setFilter: (filter: CatalogFilterType) => void;
}
```

## Fallback Images

Fallback images are centralized in `/src/constants/images.ts`:

```typescript
export const FALLBACK_IMAGES = {
  reward: "/images/fallbacks/reward.jpg",
  rewardSmall: "/images/fallbacks/reward-small.jpg",
  // ...
};
```

Local images are stored in `/public/images/fallbacks/`.

## UI/UX Details

- Cards have hover shadow effect
- Type badges are color-coded:
  - Coins: Amber
  - Tickets: Blue
  - Consumables: Green
  - Cosmetics: Purple
- Pagination stays at the bottom of the container
- Filter buttons are integrated into the page header
