import { create } from "zustand";

// Filtros extendidos: coins y tickets son subtipos de currency
export type CatalogFilterType =
  | "all"
  | "coins"
  | "tickets"
  | "consumable"
  | "cosmetic";

interface CatalogState {
  filter: CatalogFilterType;
  setFilter: (filter: CatalogFilterType) => void;
}

export const useCatalogStore = create<CatalogState>((set) => ({
  filter: "all",
  setFilter: (filter) => set({ filter }),
}));
