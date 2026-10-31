import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Kid, PriceOverride, PricesFile, Recipe, Settings, WeekPlan } from './types';

export interface State {
  settings: Settings;
  customRecipes: Recipe[];
  disabledRecipes: string[];
  pantry: Record<string, number>;
  kids: Kid[];
  plans: Record<string, WeekPlan>;
  checked: Record<string, Record<string, boolean>>;
  priceOverrides: Record<string, PriceOverride>;
  prices: PricesFile | null;
}

interface Actions {
  set: (p: Partial<State>) => void;
  setSettings: (p: Partial<Settings>) => void;
  setPantry: (id: string, qty: number | null) => void;
  addToPantry: (items: Record<string, number>) => void;
  upsertKid: (k: Kid) => void;
  removeKid: (id: string) => void;
  setPlan: (week: string, plan: WeekPlan) => void;
  toggleChecked: (week: string, ingId: string) => void;
  saveRecipe: (r: Recipe) => void;
  deleteRecipe: (id: string) => void;
  importBackup: (data: Partial<State>) => void;
}

export const initialState: State = {
  settings: { people: 4, budget: 60, diets: [], allergies: [], postalCode: '08024' },
  customRecipes: [],
  disabledRecipes: [],
  pantry: {},
  kids: [
    { id: 'nino-1', name: 'Niño 1', school: 'Colegio 1', menu: {} },
    { id: 'nino-2', name: 'Niño 2', school: 'Colegio 2', menu: {} },
  ],
  plans: {},
  checked: {},
  priceOverrides: {},
  prices: null,
};

export const useStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initialState,
      set: (p) => set(p),
      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      setPantry: (id, qty) =>
        set((s) => {
          const pantry = { ...s.pantry };
          if (qty === null) delete pantry[id];
          else pantry[id] = Math.max(0, qty);
          return { pantry };
        }),
      addToPantry: (items) =>
        set((s) => {
          const pantry = { ...s.pantry };
          for (const [id, q] of Object.entries(items)) pantry[id] = (pantry[id] ?? 0) + q;
          return { pantry };
        }),
      upsertKid: (k) =>
        set((s) => ({ kids: s.kids.some((x) => x.id === k.id) ? s.kids.map((x) => (x.id === k.id ? k : x)) : [...s.kids, k] })),
      removeKid: (id) => set((s) => ({ kids: s.kids.filter((k) => k.id !== id) })),
      setPlan: (week, plan) => set((s) => ({ plans: { ...s.plans, [week]: plan } })),
      toggleChecked: (week, ingId) =>
        set((s) => {
          const w = { ...(s.checked[week] ?? {}) };
          w[ingId] = !w[ingId];
          return { checked: { ...s.checked, [week]: w } };
        }),
      saveRecipe: (r) =>
        set((s) => ({
          customRecipes: s.customRecipes.some((x) => x.id === r.id)
            ? s.customRecipes.map((x) => (x.id === r.id ? r : x))
            : [...s.customRecipes, { ...r, custom: true }],
        })),
      deleteRecipe: (id) => set((s) => ({ customRecipes: s.customRecipes.filter((r) => r.id !== id) })),
      importBackup: (data) => set(() => ({ ...initialState, ...data, prices: null })),
    }),
    {
      name: 'plan-co-co',
      version: 1,
      // Prices are downloaded each time, not stored.
      partialize: ({ prices: _p, ...rest }) => rest as unknown as State & Actions,
    },
  ),
);

export function exportBackup(s: State): string {
  const { prices: _p, ...rest } = s;
  return JSON.stringify({ app: 'plan-co-co', version: 1, exportedAt: new Date().toISOString(), data: rest }, null, 2);
}
