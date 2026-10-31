export type Unit = 'g' | 'ml' | 'ud';

export type Allergen = 'gluten' | 'huevo' | 'lactosa' | 'pescado' | 'marisco' | 'soja' | 'frutos_secos';

/** Animal origin, used to work out vegetarian / vegan. */
export type Animal = 'carne' | 'pescado' | 'huevo' | 'lacteo';

/** Food groups used to avoid repeating the school lunch at dinner. */
export type FoodGroup =
  | 'pescado'
  | 'ave'
  | 'carne'
  | 'huevo'
  | 'legumbre'
  | 'pasta'
  | 'arroz'
  | 'patata'
  | 'pan'
  | 'verdura';

export const MAIN_GROUPS: FoodGroup[] = ['pescado', 'ave', 'carne', 'huevo', 'legumbre'];

export interface Ingredient {
  id: string;
  name: string;
  /** Mercadona section, used to sort the shopping list. */
  aisle: string;
  unit: Unit;
  /** Default pack size (in `unit`) and estimated price in euros. */
  pack: number;
  price: number;
  /** Words that must all appear in the Mercadona product name. */
  q: string[];
  allergens?: Allergen[];
  animal?: Animal;
  /** Oil, salt, spices: assumed to be at home, not counted in the budget. */
  staple?: boolean;
}

export interface RecipeIngredient {
  id: string;
  /** Quantity for the recipe's base servings, in the ingredient unit. */
  qty: number;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  servings: number;
  minutes: number;
  /** First group is the main protein. */
  groups: FoodGroup[];
  ingredients: RecipeIngredient[];
  steps: string[];
  /** Per serving. */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  custom?: boolean;
}

export type Diet = 'vegetariano' | 'vegano';

export interface Settings {
  people: number;
  budget: number;
  diets: Diet[];
  allergies: Allergen[];
  postalCode: string;
}

export interface Kid {
  id: string;
  name: string;
  school: string;
  /** ISO date -> dishes eaten at school that day. */
  menu: Record<string, string[]>;
}

export interface PlannedDinner {
  recipeId: string;
  locked?: boolean;
  cooked?: boolean;
}

export interface WeekPlan {
  /** ISO date -> dinner. */
  days: Record<string, PlannedDinner>;
  generatedAt: string;
}

export interface MercadonaProduct {
  id: string;
  name: string;
  price: number;
  /** Size in the ingredient unit (g, ml or ud). */
  size: number;
  url?: string;
  thumb?: string;
  category?: string;
}

export interface PricesFile {
  updatedAt: string | null;
  postalCode: string;
  warehouse: string | null;
  products: Record<string, MercadonaProduct & { alternatives?: MercadonaProduct[] }>;
}

export interface PriceOverride {
  productId?: string;
  price?: number;
  pack?: number;
}
