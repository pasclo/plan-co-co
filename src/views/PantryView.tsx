import { useState } from 'react';
import { AISLES, INGREDIENTS, INGREDIENT_BY_ID } from '../data/ingredients';
import { fmtQty } from '../lib/pricing';
import { norm } from '../lib/schoolMenu';
import { useStore } from '../store';

export function PantryView() {
  const pantry = useStore((s) => s.pantry);
  const setPantry = useStore((s) => s.setPantry);
  const [q, setQ] = useState('');
  const ids = Object.keys(pantry).filter((id) => INGREDIENT_BY_ID[id]);
  const matches = q.trim()
    ? INGREDIENTS.filter((i) => norm(i.name).includes(norm(q)) && pantry[i.id] === undefined).slice(0, 8)
    : [];

  const step = (unit: string) => (unit === 'ud' ? 1 : unit === 'ml' ? 250 : 100);

  return (
    <div>
      <p className="muted small">Lo que tienes en casa. El plan lo usa primero y no lo pone en la lista de la compra.</p>
      <input className="input" placeholder="Añadir: busca un ingrediente…" value={q} onChange={(e) => setQ(e.target.value)} />
      {matches.map((i) => (
        <button key={i.id} className="list-item" onClick={() => { setPantry(i.id, i.pack); setQ(''); }}>
          ➕ {i.name} <span className="muted small">({fmtQty(i.pack, i.unit)})</span>
        </button>
      ))}
      {ids.length === 0 && <p className="card muted">La despensa está vacía.</p>}
      {AISLES.map((a) => {
        const items = ids.filter((id) => INGREDIENT_BY_ID[id].aisle === a);
        if (!items.length) return null;
        return (
          <div key={a} className="card">
            <h3 className="aisle">{a}</h3>
            {items.map((id) => {
              const ing = INGREDIENT_BY_ID[id];
              const qty = pantry[id];
              const st = step(ing.unit);
              return (
                <div key={id} className="line">
                  <span className="line-text">{ing.name}</span>
                  <button className="icon-btn small" onClick={() => setPantry(id, qty - st)} aria-label="Menos">−</button>
                  <span className="qty-label">{fmtQty(qty, ing.unit)}</span>
                  <button className="icon-btn small" onClick={() => setPantry(id, qty + st)} aria-label="Más">+</button>
                  <button className="icon-btn small" onClick={() => setPantry(id, null)} aria-label="Quitar">🗑</button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
