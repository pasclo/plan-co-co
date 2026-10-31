import { describe, expect, it } from 'vitest';
import { RECIPES } from '../data/recipes';
import { INGREDIENT_BY_ID } from '../data/ingredients';
import { weekDays } from './dates';
import { generatePlan, schoolClash } from './planner';
import { priceCatalog } from './pricing';
import { buildShoppingList } from './shopping';
import type { Settings } from '../types';

const catalog = priceCatalog(null, {});
const settings: Settings = { people: 4, budget: 80, diets: [], allergies: [], postalCode: '08024' };
const days = weekDays('2026-11-02');
const byId = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

describe('recipes', () => {
  it('only use known ingredients', () => {
    for (const r of RECIPES) for (const i of r.ingredients) expect(INGREDIENT_BY_ID[i.id], `${r.id}: ${i.id}`).toBeDefined();
  });
  it('have unique ids', () => {
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
  });
});

describe('generatePlan', () => {
  it('plans 7 different dinners', () => {
    const res = generatePlan({ days, recipes: RECIPES, settings, pantry: {}, catalog, schoolGroups: {}, seed: 1 });
    const ids = Object.values(res.plan.days).map((d) => d.recipeId);
    expect(ids).toHaveLength(7);
    expect(new Set(ids).size).toBe(7);
  });

  it('avoids what the kids eat at school', () => {
    const schoolGroups = Object.fromEntries(days.slice(0, 5).map((d, i) => [d, i % 2 ? ['pescado', 'arroz'] : ['legumbre', 'carne']] as const));
    for (let seed = 1; seed < 20; seed++) {
      const res = generatePlan({ days, recipes: RECIPES, settings, pantry: {}, catalog, schoolGroups: schoolGroups as never, seed });
      for (const d of days.slice(0, 5)) {
        const r = byId[res.plan.days[d].recipeId];
        expect(schoolClash(r, (schoolGroups as Record<string, never[]>)[d]), `${seed} ${d} ${r.id}`).toBeNull();
      }
    }
  });

  it('respects allergies and vegetarian diet', () => {
    const res = generatePlan({ days, recipes: RECIPES, settings: { ...settings, diets: ['vegetariano'], allergies: ['gluten'] }, pantry: {}, catalog, schoolGroups: {}, seed: 3 });
    for (const d of Object.values(res.plan.days)) {
      const r = byId[d.recipeId];
      for (const i of r.ingredients) {
        expect(INGREDIENT_BY_ID[i.id].allergens ?? []).not.toContain('gluten');
        expect(['carne', 'pescado']).not.toContain(INGREDIENT_BY_ID[i.id].animal);
      }
    }
  });

  it('keeps locked dinners and lowers cost when the budget is tight', () => {
    const current = { generatedAt: '', days: { [days[0]]: { recipeId: 'salmon-verduras', locked: true } } };
    const loose = generatePlan({ days, recipes: RECIPES, settings: { ...settings, budget: 200 }, pantry: {}, catalog, schoolGroups: {}, current, seed: 5 });
    const tight = generatePlan({ days, recipes: RECIPES, settings: { ...settings, budget: 35 }, pantry: {}, catalog, schoolGroups: {}, current, seed: 5 });
    expect(tight.plan.days[days[0]].recipeId).toBe('salmon-verduras');
    expect(tight.cost).toBeLessThanOrEqual(loose.cost);
  });
});

describe('buildShoppingList', () => {
  it('rounds to whole packs and subtracts the pantry', () => {
    const dinners = [{ recipeId: 'merluza-horno' }];
    const lines = buildShoppingList(dinners, byId, 4, { patata: 500 }, catalog);
    const merluza = lines.find((l) => l.ing.id === 'merluza')!;
    expect(merluza.packs).toBe(2); // 600 g with 500 g packs
    const patata = lines.find((l) => l.ing.id === 'patata')!;
    expect(patata.toBuy).toBe(100);
    const aceite = lines.find((l) => l.ing.id === 'aceite')!;
    expect(aceite.packs).toBe(0); // staple, assumed at home
  });
});
