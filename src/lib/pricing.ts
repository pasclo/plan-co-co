import { INGREDIENTS } from '../data/ingredients';
import type { Ingredient, PriceOverride, PricesFile } from '../types';

export interface PricedIngredient extends Ingredient {
  source: 'mercadona' | 'estimado' | 'manual';
  productName?: string;
  url?: string;
  thumb?: string;
}

/** Merge the static catalog with Mercadona data and the user's own corrections. */
export function priceCatalog(
  prices: PricesFile | null,
  overrides: Record<string, PriceOverride>,
): Record<string, PricedIngredient> {
  const out: Record<string, PricedIngredient> = {};
  for (const ing of INGREDIENTS) {
    let p: PricedIngredient = { ...ing, source: 'estimado' };
    const m = prices?.products[ing.id];
    const ov = overrides[ing.id];
    const chosen = ov?.productId
      ? [m, ...(m?.alternatives ?? [])].find((x) => x?.id === ov.productId) ?? m
      : m;
    if (chosen && chosen.size > 0 && chosen.price > 0) {
      p = { ...p, pack: chosen.size, price: chosen.price, source: 'mercadona', productName: chosen.name, url: chosen.url, thumb: chosen.thumb };
    }
    if (ov?.price != null || ov?.pack != null) {
      p = { ...p, price: ov.price ?? p.price, pack: ov.pack ?? p.pack, source: 'manual' };
    }
    out[ing.id] = p;
  }
  return out;
}

export const unitPrice = (p: Pick<Ingredient, 'price' | 'pack'>) => p.price / p.pack;

export const fmtEur = (n: number) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

export const fmtQty = (qty: number, unit: string) => {
  if (unit === 'ud') return `${Math.round(qty * 10) / 10} ud`;
  if (qty >= 1000) return `${Math.round(qty / 100) / 10} ${unit === 'g' ? 'kg' : 'L'}`;
  return `${Math.round(qty)} ${unit}`;
};
