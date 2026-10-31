import type { PlannedDinner, Recipe } from '../types';
import type { PricedIngredient } from './pricing';

export interface ShoppingLine {
  ing: PricedIngredient;
  need: number;
  have: number;
  toBuy: number;
  packs: number;
  cost: number;
  recipes: string[];
}

/** Total quantities needed for the given dinners, scaled to `people`. */
export function requiredQuantities(
  dinners: PlannedDinner[],
  recipes: Record<string, Recipe>,
  people: number,
): Map<string, { qty: number; recipes: string[] }> {
  const need = new Map<string, { qty: number; recipes: string[] }>();
  for (const d of dinners) {
    if (d.cooked) continue;
    const r = recipes[d.recipeId];
    if (!r) continue;
    const k = people / r.servings;
    for (const ri of r.ingredients) {
      const cur = need.get(ri.id) ?? { qty: 0, recipes: [] };
      cur.qty += ri.qty * k;
      if (!cur.recipes.includes(r.name)) cur.recipes.push(r.name);
      need.set(ri.id, cur);
    }
  }
  return need;
}

/** Shopping list: needs minus pantry, rounded up to whole packs. */
export function buildShoppingList(
  dinners: PlannedDinner[],
  recipes: Record<string, Recipe>,
  people: number,
  pantry: Record<string, number>,
  catalog: Record<string, PricedIngredient>,
): ShoppingLine[] {
  const lines: ShoppingLine[] = [];
  for (const [id, { qty, recipes: rs }] of requiredQuantities(dinners, recipes, people)) {
    const ing = catalog[id];
    if (!ing) continue;
    const have = pantry[id] ?? 0;
    // Staples are assumed at home unless the pantry says otherwise.
    const toBuy = ing.staple && pantry[id] === undefined ? 0 : Math.max(0, qty - have);
    const packs = toBuy > 0 ? Math.ceil(toBuy / ing.pack - 1e-9) : 0;
    lines.push({ ing, need: qty, have, toBuy, packs, cost: packs * ing.price, recipes: rs });
  }
  return lines;
}

export const totalCost = (lines: ShoppingLine[]) => lines.reduce((s, l) => s + l.cost, 0);
