import { describe, expect, it } from 'vitest';
import { classifyDish, detectMonth, parseGrid, parseLines, type TextItem } from './schoolMenu';

describe('classifyDish', () => {
  it('reads Spanish and Catalan dishes', () => {
    expect(classifyDish('Lentejas estofadas')).toContain('legumbre');
    expect(classifyDish('Llenties amb verdures')).toContain('legumbre');
    expect(classifyDish('Lluç a la planxa')).toContain('pescado');
    expect(classifyDish('Pollastre rostit')).toContain('ave');
    expect(classifyDish('Macarrons a la bolonyesa')).toEqual(expect.arrayContaining(['pasta', 'carne']));
    expect(classifyDish('Truita de patates')).toEqual(expect.arrayContaining(['huevo', 'patata']));
  });
  it('treats green beans as vegetables, not legumes', () => {
    expect(classifyDish('Mongeta tendra amb patata')).not.toContain('legumbre');
    expect(classifyDish('Judías verdes salteadas')).not.toContain('legumbre');
  });
});

describe('parseLines', () => {
  it('parses a list-style menu', () => {
    const txt = 'MENÚ NOVIEMBRE 2026\nLunes 2: Lentejas, merluza con ensalada\nMartes 3\nMacarrones\nPollo asado\nPan y fruta';
    expect(detectMonth(txt)).toEqual({ month: 10, year: 2026 });
    const m = parseLines(txt, 10, 2026);
    expect(m['2026-11-02']).toEqual(['Lentejas', 'merluza con ensalada']);
    expect(m['2026-11-03']).toEqual(['Macarrones', 'Pollo asado', 'Pan y fruta']);
  });
});

describe('parseGrid', () => {
  it('assigns dishes to the day number above them', () => {
    const it = (str: string, x: number, y: number): TextItem => ({ str, x, y, w: 50, h: 10, page: 1 });
    const items = [
      it('2', 50, 700), it('3', 200, 700), it('4', 350, 700),
      it('Lentejas', 50, 685), it('Merluza', 50, 672),
      it('Arroz', 200, 685), it('Pollo', 200, 672),
      it('Crema', 350, 685), it('Tortilla', 350, 672),
      it('9', 50, 600), it('10', 200, 600), it('11', 350, 600),
      it('Garbanzos', 50, 585), it('Espaguetis', 200, 585), it('Salmón', 350, 585),
    ];
    const m = parseGrid(items, 10, 2026);
    expect(m['2026-11-02']).toEqual(['Lentejas', 'Merluza']);
    expect(m['2026-11-03']).toEqual(['Arroz', 'Pollo']);
    expect(m['2026-11-11']).toEqual(['Salmón']);
  });
});
