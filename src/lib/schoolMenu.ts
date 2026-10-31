import type { FoodGroup } from '../types';
import { toIso } from './dates';

export const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/·/g, '.');

// Spanish and Catalan keywords. Order matters: green beans are a vegetable, not a legume.
const RULES: { group: FoodGroup; re: RegExp; consume?: boolean }[] = [
  { group: 'verdura', re: /judias? verdes?|mongetes? tendres?|mongeta tendra/g, consume: true },
  { group: 'legumbre', re: /lentej|llentie|garbanz|cigro|alubi|judion|judias|fabada|mongete|faves|habas|hummus|soja texturizada/g },
  { group: 'pescado', re: /pescad|merluz|bacala|salmo|atun|tonyina|lenguad|llenguad|abadej|panga|dorad|lubina|llobarro|sardin|boquer|seito|calamar|sepia|sipia|gamba|mejillon|musclo|peix|lluc|rap\b|marisc|surimi|palitos de mar|fideua/g },
  { group: 'ave', re: /pollo|pollastre|pavo|gall dindi|indiot/g },
  { group: 'carne', re: /ternera|vedella|vacuno|cerdo|porc|lomo|llom|carne|hamburgues|albondig|mandonguil|salchich|salsitx|frankfurt|chuleta|costell|cordero|xai|conejo|conill|botifarr|butifarr|lacon|jamon|pernil|chorizo|longaniza|llonganissa|bolonesa|bolonyesa|canelon|canelo/g },
  { group: 'huevo', re: /huevo|\bous?\b|tortilla|truita|revuelto|remenat|quiche/g },
  { group: 'pasta', re: /pasta|macarr|espaguet|spaghett|fideo|fideu|tallarin|lasa[nñ]|canelon|canelo|raviol|tortellin|noodle|ñoqui|nyoqui|fusilli|penne|espiral/g },
  { group: 'arroz', re: /arroz|arros|paella|risotto/g },
  { group: 'patata', re: /patat|papas/g },
  { group: 'verdura', re: /verdur|crema|pure|ensalad|amanid|brocol|broquil|coliflor|calabac|carbass|zanahor|pastanag|espinac|acelg|bleda|pisto|samfaina|escalivad|menestra|minestra|sopa|tomate|tomaquet|berenjen|alberg|pesol|guisant/g },
];

export function classifyDish(text: string): FoodGroup[] {
  let t = norm(text);
  const out = new Set<FoodGroup>();
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    if (rule.re.test(t)) {
      out.add(rule.group);
      if (rule.consume) t = t.replace(rule.re, ' ');
    }
  }
  return [...out];
}

export function classifyDay(dishes: string[]): FoodGroup[] {
  const s = new Set<FoodGroup>();
  dishes.forEach((d) => classifyDish(d).forEach((g) => s.add(g)));
  return [...s];
}

// ---------- PDF text parsing ----------

export interface TextItem {
  str: string;
  x: number;
  y: number; // PDF coordinates: y grows upwards
  w: number;
  h: number;
  page: number;
}

const MONTHS: [RegExp, number][] = [
  [/\b(enero|gener)\b/, 0], [/\b(febrero|febrer)\b/, 1], [/\b(marzo|marc)\b/, 2], [/\babril\b/, 3],
  [/\b(mayo|maig)\b/, 4], [/\b(junio|juny)\b/, 5], [/\b(julio|juliol)\b/, 6], [/\b(agosto|agost)\b/, 7],
  [/\b(septiembre|setiembre|setembre)\b/, 8], [/\boctubre\b/, 9], [/\b(noviembre|novembre)\b/, 10],
  [/\b(diciembre|desembre)\b/, 11],
];

const WEEKDAY = /^(lunes|martes|miercoles|jueves|viernes|dilluns|dimarts|dimecres|dijous|divendres|lu|ma|mi|ju|vi|dl|dt|dc|dj|dv)\b\.?/;

const NOISE = /^(pan|pa|fruta|fruita|postre|agua|aigua|yogur|iogurt|kcal|cal|proteinas?|hidratos|lipidos|grasas?|menu|menu escolar|basal|\d+(\.\d+)?\s*(kcal|g|gr))$/;

/** Guess month/year from the text (e.g. "Menú noviembre 2026"). */
export function detectMonth(text: string): { month: number; year: number } | null {
  const t = norm(text);
  for (const [re, m] of MONTHS) {
    if (re.test(t)) {
      const y = t.match(/\b(20\d{2})\b/);
      return { month: m, year: y ? Number(y[1]) : new Date().getFullYear() };
    }
  }
  return null;
}

const isDayNumber = (s: string) => /^\d{1,2}$/.test(s.trim()) && +s >= 1 && +s <= 31;

function cleanLines(lines: string[]): string[] {
  return lines
    .map((l) => l.replace(/\s+/g, ' ').replace(/^[-•·*–]\s*/, '').trim())
    .filter((l) => l.length > 2 && !NOISE.test(norm(l)) && !/^\d+$/.test(l));
}

/**
 * Most school menus are a calendar grid: each cell starts with the day number
 * and lists the dishes underneath. We find the day numbers and give every
 * other piece of text to the nearest day number above it in the same column.
 */
export function parseGrid(items: TextItem[], month: number, year: number): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const pages = [...new Set(items.map((i) => i.page))];
  for (const page of pages) {
    const its = items.filter((i) => i.page === page && i.str.trim());
    // A day number can come alone or as "Lunes 3" / "Dilluns 3".
    const anchors = its
      .map((i) => {
        const t = norm(i.str.trim());
        const m = t.match(/^(?:[a-z]+\.?\s+)?(\d{1,2})$/);
        if (!m || !isDayNumber(m[1])) return null;
        if (m[0] !== m[1] && !WEEKDAY.test(t)) return null;
        return { item: i, day: Number(m[1]) };
      })
      .filter((a): a is { item: TextItem; day: number } => a !== null);
    if (anchors.length < 3) continue;

    // Column bounds from the distinct x positions of the anchors.
    const xs = [...new Set(anchors.map((a) => Math.round(a.item.x / 15) * 15))].sort((a, b) => a - b);
    const colOf = (x: number) => {
      let c = 0;
      for (let k = 0; k < xs.length; k++) if (x >= xs[k] - 20) c = k;
      return c;
    };
    const rowH = Math.max(...its.map((i) => i.h), 8);

    const cells = new Map<number, { day: number; y: number; texts: TextItem[] }[]>();
    for (const a of anchors) {
      const c = colOf(a.item.x);
      const list = cells.get(c) ?? [];
      list.push({ day: a.day, y: a.item.y, texts: [] });
      cells.set(c, list);
    }
    const anchorSet = new Set(anchors.map((a) => a.item));
    for (const it of its) {
      if (anchorSet.has(it)) continue;
      const col = cells.get(colOf(it.x));
      if (!col) continue;
      // Nearest anchor at or above this text.
      let best: (typeof col)[number] | null = null;
      for (const cell of col) {
        if (cell.y + rowH * 0.6 >= it.y && (!best || cell.y < best.y)) best = cell;
      }
      best?.texts.push(it);
    }

    // Day numbers going down in a column mean a new month started; handle wrap.
    for (const col of cells.values()) {
      for (const cell of col) {
        const lines = groupLines(cell.texts);
        const dishes = cleanLines(lines);
        if (!dishes.length) continue;
        const iso = toIso(new Date(year, month, cell.day));
        result[iso] = [...(result[iso] ?? []), ...dishes];
      }
    }
  }
  return result;
}

function groupLines(texts: TextItem[]): string[] {
  const sorted = [...texts].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: { y: number; parts: TextItem[] }[] = [];
  for (const t of sorted) {
    const line = lines.find((l) => Math.abs(l.y - t.y) < Math.max(3, t.h * 0.5));
    if (line) line.parts.push(t);
    else lines.push({ y: t.y, parts: [t] });
  }
  return lines.map((l) => l.parts.sort((a, b) => a.x - b.x).map((p) => p.str).join(' '));
}

/**
 * Fallback for list-style menus ("Lunes 3: Lentejas / Merluza") or pasted text.
 * Works line by line: a line starting with a day number (optionally after a
 * weekday) opens a new day.
 */
export function parseLines(text: string, month: number, year: number): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  let current: string | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const t = norm(line);
    const m = t.match(/^(?:(?:lunes|martes|miercoles|jueves|viernes|dilluns|dimarts|dimecres|dijous|divendres)[\s,.]*)?(\d{1,2})(?:\s*(?:de\s+|d')?(?:enero|gener|febrero|febrer|marzo|marc|abril|mayo|maig|junio|juny|julio|juliol|septiembre|setembre|octubre|noviembre|novembre|diciembre|desembre)\b)?\s*[:.\-–]?\s*(.*)$/);
    if (m && isDayNumber(m[1]) && (m[2] === '' || /[a-z]/.test(m[2]) || WEEKDAY.test(t))) {
      current = toIso(new Date(year, month, Number(m[1])));
      result[current] = result[current] ?? [];
      const rest = line.slice(line.length - m[2].length);
      if (rest.trim()) result[current].push(...cleanLines(rest.split(/[,;/]|\s-\s/)));
    } else if (current) {
      result[current].push(...cleanLines(line.split(/[;/]|\s-\s/)));
    }
  }
  for (const k of Object.keys(result)) if (!result[k].length) delete result[k];
  return result;
}

export function itemsToText(items: TextItem[]): string {
  const pages = [...new Set(items.map((i) => i.page))];
  return pages.map((p) => groupLines(items.filter((i) => i.page === p)).join('\n')).join('\n');
}

export function parseMenu(items: TextItem[], month: number, year: number): Record<string, string[]> {
  const grid = parseGrid(items, month, year);
  const lines = parseLines(itemsToText(items), month, year);
  return Object.keys(grid).length >= Object.keys(lines).length ? grid : lines;
}
