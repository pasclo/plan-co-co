import type { FoodGroup, PlannedDinner, Recipe, Settings, WeekPlan } from '../types';
import { fitsDiet } from './diet';
import type { PricedIngredient } from './pricing';
import { buildShoppingList, totalCost } from './shopping';

export interface PlanInput {
  days: string[];
  recipes: Recipe[];
  settings: Settings;
  pantry: Record<string, number>;
  catalog: Record<string, PricedIngredient>;
  /** ISO date -> food groups the kids eat at school that day. */
  schoolGroups: Record<string, FoodGroup[]>;
  /** Existing plan; locked and cooked dinners are kept. */
  current?: WeekPlan;
  disabled?: string[];
  seed?: number;
}

export interface PlanResult {
  plan: WeekPlan;
  cost: number;
  overBudget: boolean;
  notes: Record<string, string>;
}

const STARCH: FoodGroup[] = ['pasta', 'arroz', 'legumbre', 'patata'];
const MEATY: FoodGroup[] = ['carne', 'ave'];

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

/** Cost of one dinner (non-staple ingredients, proportional to amount used). */
export function dinnerCost(r: Recipe, people: number, catalog: Record<string, PricedIngredient>): number {
  const k = people / r.servings;
  let c = 0;
  for (const ri of r.ingredients) {
    const ing = catalog[ri.id];
    if (ing && !ing.staple) c += (ri.qty * k * ing.price) / ing.pack;
  }
  return c;
}

/** Why a recipe clashes with the school lunch, or null if it does not. */
export function schoolClash(r: Recipe, groups: FoodGroup[]): string | null {
  if (!groups.length) return null;
  const main = r.groups[0];
  if (groups.includes(main)) return `En el cole ya comen ${main}`;
  const starch = r.groups.find((g) => STARCH.includes(g) && groups.includes(g));
  if (starch) return `En el cole ya comen ${starch}`;
  return null;
}

function score(
  r: Recipe,
  day: string,
  idx: number,
  chosen: (Recipe | null)[],
  inp: PlanInput,
  rand: () => number,
): number {
  const sg = inp.schoolGroups[day] ?? [];
  const main = r.groups[0];
  let s = rand() * 3;

  if (chosen.some((c) => c?.id === r.id)) s -= 100;
  if (sg.includes(main)) s -= 60;
  for (const g of r.groups.slice(1)) if (STARCH.includes(g) && sg.includes(g)) s -= 20;
  if (STARCH.includes(main) && sg.includes(main)) s -= 20;
  // Complement the school lunch: after meat at school, prefer fish, egg or veg.
  if (sg.some((g) => MEATY.includes(g)) && !MEATY.includes(main)) s += 4;

  const prev = chosen[idx - 1];
  const next = chosen[idx + 1];
  if (prev?.groups[0] === main) s -= 15;
  if (next?.groups[0] === main) s -= 15;

  // Weekly balance: about 2 fish dinners, not too much meat.
  const count = (g: FoodGroup[]) => chosen.filter((c) => c && g.includes(c.groups[0])).length;
  if (main === 'pescado' && count(['pescado']) < 2) s += 5;
  if (MEATY.includes(main) && count(MEATY) >= 2) s -= 8;

  // Use what is already in the pantry.
  const nonStaple = r.ingredients.filter((ri) => !inp.catalog[ri.id]?.staple);
  if (nonStaple.length) {
    const covered = nonStaple.filter((ri) => (inp.pantry[ri.id] ?? 0) > 0).length;
    s += (8 * covered) / nonStaple.length;
  }

  // Budget: penalise dinners above the daily share of the weekly budget.
  const target = inp.settings.budget / Math.max(1, inp.days.length);
  const c = dinnerCost(r, inp.settings.people, inp.catalog);
  if (c > target) s -= (c - target) * 3;
  return s;
}

export function generatePlan(inp: PlanInput): PlanResult {
  const rand = rng(inp.seed ?? Date.now());
  const pool = inp.recipes.filter((r) => fitsDiet(r, inp.settings) && !inp.disabled?.includes(r.id));
  const byId = Object.fromEntries(inp.recipes.map((r) => [r.id, r]));
  const fixed: Record<string, PlannedDinner> = {};
  for (const d of inp.days) {
    const cur = inp.current?.days[d];
    if (cur && (cur.locked || cur.cooked) && byId[cur.recipeId]) fixed[d] = cur;
  }

  const chosen: (Recipe | null)[] = inp.days.map((d) => (fixed[d] ? byId[fixed[d].recipeId] : null));
  inp.days.forEach((day, i) => {
    if (chosen[i] || !pool.length) return;
    let best = pool[0];
    let bestS = -Infinity;
    for (const r of pool) {
      const s = score(r, day, i, chosen, inp, rand);
      if (s > bestS) {
        bestS = s;
        best = r;
      }
    }
    chosen[i] = best;
  });

  const toPlan = (list: (Recipe | null)[]): WeekPlan => ({
    generatedAt: new Date().toISOString(),
    days: Object.fromEntries(
      inp.days.flatMap((d, i) => (list[i] ? [[d, fixed[d] ?? { recipeId: list[i]!.id }]] : [])),
    ),
  });
  const costOf = (list: (Recipe | null)[]) =>
    totalCost(buildShoppingList(Object.values(toPlan(list).days), byId, inp.settings.people, inp.pantry, inp.catalog));

  // Budget repair: swap the dinner that saves the most money while staying acceptable.
  let cost = costOf(chosen);
  for (let iter = 0; iter < 30 && cost > inp.settings.budget; iter++) {
    let bestGain = 0;
    let bestSwap: { i: number; r: Recipe } | null = null;
    inp.days.forEach((day, i) => {
      if (fixed[day]) return;
      for (const r of pool) {
        if (chosen.some((c) => c?.id === r.id)) continue;
        if (schoolClash(r, inp.schoolGroups[day] ?? [])) continue;
        const trial = [...chosen];
        trial[i] = r;
        const gain = cost - costOf(trial);
        if (gain > bestGain + 0.01) {
          bestGain = gain;
          bestSwap = { i, r };
        }
      }
    });
    if (!bestSwap) break;
    const { i, r } = bestSwap as { i: number; r: Recipe };
    chosen[i] = r;
    cost -= bestGain;
  }
  cost = costOf(chosen);

  const notes: Record<string, string> = {};
  inp.days.forEach((d, i) => {
    const r = chosen[i];
    const clash = r && schoolClash(r, inp.schoolGroups[d] ?? []);
    if (clash) notes[d] = clash;
  });

  return { plan: toPlan(chosen), cost, overBudget: cost > inp.settings.budget, notes };
}
