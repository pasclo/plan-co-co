import { INGREDIENT_BY_ID } from '../data/ingredients';
import type { Allergen, Recipe, Settings } from '../types';

export function recipeAllergens(r: Recipe): Set<Allergen> {
  const s = new Set<Allergen>();
  for (const ri of r.ingredients) INGREDIENT_BY_ID[ri.id]?.allergens?.forEach((a) => s.add(a));
  return s;
}

export function isVegetarian(r: Recipe): boolean {
  return r.ingredients.every((ri) => {
    const a = INGREDIENT_BY_ID[ri.id]?.animal;
    return a !== 'carne' && a !== 'pescado';
  });
}

export function isVegan(r: Recipe): boolean {
  return r.ingredients.every((ri) => !INGREDIENT_BY_ID[ri.id]?.animal);
}

export function fitsDiet(r: Recipe, s: Pick<Settings, 'diets' | 'allergies'>): boolean {
  if (s.diets.includes('vegano') && !isVegan(r)) return false;
  if (s.diets.includes('vegetariano') && !isVegetarian(r)) return false;
  const al = recipeAllergens(r);
  return !s.allergies.some((a) => al.has(a));
}

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  gluten: 'Gluten',
  huevo: 'Huevo',
  lactosa: 'Lactosa',
  pescado: 'Pescado',
  marisco: 'Marisco',
  soja: 'Soja',
  frutos_secos: 'Frutos secos',
};
