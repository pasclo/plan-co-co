// Downloads Mercadona products for the postal code and matches them to the
// app's ingredients. Writes public/mercadona-prices.json.
// Uses the same (unofficial) API as tienda.mercadona.es; if it changes, this
// script fails and the app keeps the previous prices.
import { readFile, writeFile } from 'node:fs/promises';

const POSTAL_CODE = process.env.POSTAL_CODE || '08024';
const BASE = 'https://tienda.mercadona.es/api';
const OUT = new URL('../public/mercadona-prices.json', import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

async function getJson(url, init) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { ...init, headers: { 'User-Agent': 'plan-co-co/1.0', ...(init?.headers ?? {}) } });
    if (res.ok) return res.json();
    if (attempt === 3) throw new Error(`${res.status} ${url}`);
    await sleep(1000 * attempt);
  }
}

async function warehouseFor(pc) {
  try {
    const res = await fetch(`${BASE}/postal-codes/actions/change-pc/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_postal_code: pc }),
    });
    return res.headers.get('x-customer-wh') || 'bcn1';
  } catch {
    return 'bcn1';
  }
}

/** Read the ingredient list straight from the app source. */
async function loadIngredients() {
  const src = await readFile(new URL('../src/data/ingredients.ts', import.meta.url), 'utf8');
  const aisles = Object.fromEntries([...src.matchAll(/const (\w\w) = '([^']+)';/g)].map((m) => [m[1], m[2]]));
  const out = [];
  for (const m of src.matchAll(/\{ id: '([^']+)', name: '([^']+)', aisle: (\w\w), unit: '(\w+)'.*?q: \[([^\]]*)\]/g)) {
    out.push({ id: m[1], name: m[2], aisle: aisles[m[3]], unit: m[4], q: [...m[5].matchAll(/'([^']+)'/g)].map((x) => x[1]) });
  }
  return out;
}

function sizeIn(unit, p) {
  const pi = p.price_instructions ?? {};
  const size = Number(pi.unit_size);
  const fmt = norm(String(pi.size_format ?? ''));
  if (unit === 'g' && fmt === 'kg' && size > 0) return size * 1000;
  if (unit === 'ml' && fmt === 'l' && size > 0) return size * 1000;
  if (unit === 'ud') {
    if (fmt === 'ud' && size > 0) return size;
    const m = norm(`${p.packaging ?? ''} ${p.display_name}`).match(/(\d+)\s*(ud|uds|unidades)\b/);
    return m ? Number(m[1]) : 1;
  }
  return null;
}

function matches(name, words) {
  const n = norm(name);
  return words.every((w) => {
    const exact = w.endsWith('$');
    const word = norm(exact ? w.slice(0, -1) : w);
    return new RegExp(`\\b${word}${exact ? '\\b' : ''}`).test(n);
  });
}

async function main() {
  const wh = await warehouseFor(POSTAL_CODE);
  console.log(`Postal code ${POSTAL_CODE} -> warehouse ${wh}`);
  const top = await getJson(`${BASE}/categories/?lang=es&wh=${wh}`);
  const products = [];
  for (const group of top.results) {
    for (const cat of group.categories ?? []) {
      const detail = await getJson(`${BASE}/categories/${cat.id}/?lang=es&wh=${wh}`);
      for (const sub of detail.categories ?? []) {
        for (const p of sub.products ?? []) products.push({ ...p, _top: group.name, _cat: `${cat.name} > ${sub.name}` });
      }
      await sleep(120);
    }
  }
  console.log(`Downloaded ${products.length} products`);
  if (products.length < 500) throw new Error('Too few products, the API may have changed');

  const ingredients = await loadIngredients();
  const result = {};
  for (const ing of ingredients) {
    const toCandidate = (p) => {
      const size = sizeIn(ing.unit, p);
      const price = Number(p.price_instructions?.unit_price);
      if (!size || !(price > 0)) return null;
      return {
        id: String(p.id),
        name: [p.display_name, p.packaging].filter(Boolean).join(' · '),
        price,
        size: Math.round(size * 100) / 100,
        url: p.share_url,
        thumb: p.thumbnail,
        category: p._cat,
        _words: norm(p.display_name).split(/\s+/).length,
      };
    };
    let pool = products.filter((p) => norm(p._top) === norm(ing.aisle) && matches(p.display_name, ing.q));
    if (!pool.length) pool = products.filter((p) => !/aperitivo/i.test(p._top) && matches(p.display_name, ing.q));
    const cands = pool.map(toCandidate).filter(Boolean);
    // Prefer plain products (short names), then the cheapest per unit.
    cands.sort((a, b) => a._words - b._words || a.price / a.size - b.price / b.size);
    if (!cands.length) {
      console.warn(`No match for ${ing.id} (${ing.q.join(' ')})`);
      continue;
    }
    const clean = ({ _words, ...c }) => c;
    result[ing.id] = { ...clean(cands[0]), alternatives: cands.slice(1, 6).map(clean) };
  }
  console.log(`Matched ${Object.keys(result).length}/${ingredients.length} ingredients`);
  const file = { updatedAt: new Date().toISOString(), postalCode: POSTAL_CODE, warehouse: wh, products: result };
  await writeFile(OUT, JSON.stringify(file, null, 1) + '\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
