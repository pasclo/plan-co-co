import { useMemo } from 'react';
import { RECIPES } from './data/recipes';
import { classifyDay } from './lib/schoolMenu';
import { priceCatalog } from './lib/pricing';
import { useStore } from './store';
import type { FoodGroup, Recipe } from './types';

export function useRecipes(): { list: Recipe[]; byId: Record<string, Recipe> } {
  const custom = useStore((s) => s.customRecipes);
  return useMemo(() => {
    const list = [...RECIPES, ...custom];
    return { list, byId: Object.fromEntries(list.map((r) => [r.id, r])) };
  }, [custom]);
}

export function useCatalog() {
  const prices = useStore((s) => s.prices);
  const overrides = useStore((s) => s.priceOverrides);
  return useMemo(() => priceCatalog(prices, overrides), [prices, overrides]);
}

/** ISO date -> food groups any kid eats at school that day. */
export function useSchoolGroups(): Record<string, FoodGroup[]> {
  const kids = useStore((s) => s.kids);
  return useMemo(() => {
    const out: Record<string, Set<FoodGroup>> = {};
    for (const k of kids)
      for (const [d, dishes] of Object.entries(k.menu)) {
        out[d] = out[d] ?? new Set();
        classifyDay(dishes).forEach((g) => out[d].add(g));
      }
    return Object.fromEntries(Object.entries(out).map(([d, s]) => [d, [...s]]));
  }, [kids]);
}
