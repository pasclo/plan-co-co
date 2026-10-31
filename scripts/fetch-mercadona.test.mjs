import { describe, expect, it } from 'vitest';
import { loadIngredients, matchProducts } from './fetch-mercadona.mjs';

const prod = (id, name, top, price, size, fmt, extra = {}) => ({
  id, display_name: name, packaging: extra.packaging ?? 'Paquete', _top: top, _cat: top,
  price_instructions: { unit_price: String(price), unit_size: size, size_format: fmt, total_units: extra.units ?? null },
});

describe('matchProducts', () => {
  it('picks the usual pack and skips excluded variants', async () => {
    const ings = (await loadIngredients()).filter((i) => ['merluza', 'salmon', 'alubias_rojas', 'tortillas_trigo', 'atun'].includes(i.id));
    expect(ings).toHaveLength(5);
    const products = [
      prod(1, 'Merluza rebozada', 'Marisco y pescado', 3.9, 0.23, 'kg'),
      prod(2, 'Filetes de merluza sin piel', 'Marisco y pescado', 5.5, 0.4, 'kg'),
      prod(3, 'Salmón a rodajas', 'Marisco y pescado', 29.6, 2.7, 'kg', { packaging: 'Pieza' }),
      prod(4, 'Lomos de salmón', 'Marisco y pescado', 5.2, 0.25, 'kg'),
      prod(5, 'Alubia roja Hacendado', 'Arroz, legumbres y pasta', 3, 1, 'kg'),
      prod(6, 'Alubia roja cocida Hacendado', 'Arroz, legumbres y pasta', 0.9, 0.57, 'kg', { packaging: 'Tarro' }),
      prod(7, 'Tortillas de trigo Hacendado', 'Panadería y pastelería', 1.15, 0.32, 'kg', { units: 8 }),
      prod(8, 'Atún en aceite de girasol Hacendado', 'Conservas, caldos y cremas', 6.5, 0.9, 'kg', { packaging: 'Lata' }),
      prod(9, 'Atún claro en aceite de oliva Hacendado', 'Conservas, caldos y cremas', 3.6, 0.24, 'kg', { packaging: 'Pack-3' }),
    ];
    const r = matchProducts(products, ings);
    expect(r.merluza.id).toBe('2');
    expect(r.salmon.id).toBe('4');
    expect(r.alubias_rojas.id).toBe('6');
    expect(r.tortillas_trigo.size).toBe(8);
    expect(r.atun.id).toBe('9');
  });
});
