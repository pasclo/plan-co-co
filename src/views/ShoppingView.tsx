import { useMemo, useState } from 'react';
import { AISLES } from '../data/ingredients';
import { useCatalog, useRecipes } from '../hooks';
import { shortDate } from '../lib/dates';
import { fmtEur, fmtQty, type PricedIngredient } from '../lib/pricing';
import { buildShoppingList, totalCost, type ShoppingLine } from '../lib/shopping';
import { useStore } from '../store';
import { Modal } from '../components/ui';

export function ShoppingView({ week }: { week: string }) {
  const s = useStore();
  const { byId } = useRecipes();
  const catalog = useCatalog();
  const plan = s.plans[week];
  const checked = s.checked[week] ?? {};
  const [edit, setEdit] = useState<PricedIngredient | null>(null);
  const [copied, setCopied] = useState(false);

  const lines = useMemo(
    () => (plan ? buildShoppingList(Object.values(plan.days), byId, s.settings.people, s.pantry, catalog) : []),
    [plan, byId, s.settings.people, s.pantry, catalog],
  );

  if (!plan) return <p className="card">Primero genera el plan de la semana en la pestaña <b>Semana</b>.</p>;

  const toBuy = lines.filter((l) => l.packs > 0);
  const covered = lines.filter((l) => l.packs === 0 && !l.ing.staple);
  const staples = lines.filter((l) => l.packs === 0 && l.ing.staple);
  const total = totalCost(lines);
  const pending = toBuy.filter((l) => !checked[l.ing.id]);
  const byAisle = AISLES.map((a) => ({ aisle: a, items: toBuy.filter((l) => l.ing.aisle === a) })).filter((x) => x.items.length);
  const priced = s.prices?.updatedAt;

  const moveToPantry = () => {
    const items: Record<string, number> = {};
    for (const l of toBuy) if (checked[l.ing.id]) items[l.ing.id] = l.packs * l.ing.pack;
    s.addToPantry(items);
    s.set({ checked: { ...s.checked, [week]: {} } });
  };

  const copy = async () => {
    const txt = byAisle
      .map(({ aisle, items }) => `${aisle}\n${items.map((l) => `- ${l.packs} × ${l.ing.productName ?? l.ing.name}`).join('\n')}`)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(`Compra semana ${shortDate(week)}\n\n${txt}\n\nTotal aprox: ${fmtEur(total)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <div>
      <div className="card">
        <div className="row-between">
          <span>Total estimado</span>
          <b className={total > s.settings.budget ? 'over' : ''}>{fmtEur(total)}</b>
        </div>
        <p className="muted small">
          {priced ? `Precios de Mercadona (CP ${s.prices?.postalCode}) del ${shortDate(priced.slice(0, 10))}.` : 'Precios aproximados hasta que se descarguen los de Mercadona.'}
          {' '}Quedan {pending.length} de {toBuy.length} productos.
        </p>
        <div className="actions">
          <button className="btn small" onClick={copy}>{copied ? '✔ Copiada' : '📋 Copiar lista'}</button>
          <a className="btn small" href="https://tienda.mercadona.es/" target="_blank" rel="noreferrer">🛒 Abrir Mercadona</a>
          {toBuy.some((l) => checked[l.ing.id]) && (
            <button className="btn small primary" onClick={moveToPantry}>📦 Guardar lo comprado en despensa</button>
          )}
        </div>
      </div>

      {byAisle.map(({ aisle, items }) => (
        <div key={aisle} className="card">
          <h3 className="aisle">{aisle}</h3>
          {items.map((l) => (
            <Line key={l.ing.id} l={l} checked={!!checked[l.ing.id]} onToggle={() => s.toggleChecked(week, l.ing.id)} onEdit={() => setEdit(l.ing)} />
          ))}
        </div>
      ))}

      {covered.length > 0 && (
        <details className="card">
          <summary>✅ Ya lo tienes en la despensa ({covered.length})</summary>
          {covered.map((l) => (
            <div key={l.ing.id} className="line muted small">{l.ing.name} · necesitas {fmtQty(l.need, l.ing.unit)}</div>
          ))}
        </details>
      )}
      {staples.length > 0 && (
        <details className="card">
          <summary>🧂 Básicos que se suponen en casa ({staples.length})</summary>
          {staples.map((l) => (
            <div key={l.ing.id} className="line muted small">{l.ing.name} · {fmtQty(l.need, l.ing.unit)}</div>
          ))}
          <p className="muted small">Si te faltan, añádelos a la despensa con cantidad 0 y aparecerán en la lista.</p>
        </details>
      )}
      {edit && <PriceEditor ing={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function Line({ l, checked, onToggle, onEdit }: { l: ShoppingLine; checked: boolean; onToggle: () => void; onEdit: () => void }) {
  return (
    <div className={`line ${checked ? 'done' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onToggle} aria-label={l.ing.name} />
      <div className="line-text" onClick={onToggle}>
        <div>
          <b>{l.packs} ×</b> {l.ing.productName ?? l.ing.name}
        </div>
        <div className="muted small">
          Necesitas {fmtQty(l.toBuy, l.ing.unit)} · paquete {fmtQty(l.ing.pack, l.ing.unit)}
          {l.ing.source === 'estimado' && ' · precio aprox.'}
        </div>
      </div>
      <div className="line-end">
        <b>{fmtEur(l.cost)}</b>
        <div className="line-links">
          {l.ing.url && <a href={l.ing.url} target="_blank" rel="noreferrer" aria-label="Ver en Mercadona">↗</a>}
          <button className="icon-btn small" onClick={onEdit} aria-label="Cambiar producto o precio">✎</button>
        </div>
      </div>
    </div>
  );
}

function PriceEditor({ ing, onClose }: { ing: PricedIngredient; onClose: () => void }) {
  const s = useStore();
  const m = s.prices?.products[ing.id];
  const options = m ? [m, ...(m.alternatives ?? [])] : [];
  const ov = s.priceOverrides[ing.id] ?? {};
  const [price, setPrice] = useState(ov.price != null ? String(ov.price) : '');
  const [pack, setPack] = useState(ov.pack != null ? String(ov.pack) : '');

  const save = (patch: typeof ov | null) => {
    const next = { ...s.priceOverrides };
    if (patch === null) delete next[ing.id];
    else next[ing.id] = patch;
    s.set({ priceOverrides: next });
    onClose();
  };

  return (
    <Modal title={ing.name} onClose={onClose}>
      {options.length > 0 && (
        <>
          <h3>Producto de Mercadona</h3>
          {options.map((o) => (
            <button key={o.id} className={`list-item ${(ov.productId ?? m!.id) === o.id ? 'on' : ''}`} onClick={() => save({ productId: o.id })}>
              {o.thumb && <img src={o.thumb} alt="" width={40} height={40} />}
              <span className="dinner-text">
                <span>{o.name}</span>
                <span className="muted small">{fmtEur(o.price)} · {fmtQty(o.size, ing.unit)}</span>
              </span>
            </button>
          ))}
        </>
      )}
      <h3>Precio a mano</h3>
      <label className="field">Precio del paquete (€)
        <input className="input" inputMode="decimal" value={price} placeholder={String(ing.price)} onChange={(e) => setPrice(e.target.value)} />
      </label>
      <label className="field">Tamaño del paquete ({ing.unit})
        <input className="input" inputMode="decimal" value={pack} placeholder={String(ing.pack)} onChange={(e) => setPack(e.target.value)} />
      </label>
      <div className="actions">
        <button className="btn primary" onClick={() => save({
          productId: ov.productId,
          price: price ? Number(price.replace(',', '.')) : undefined,
          pack: pack ? Number(pack.replace(',', '.')) : undefined,
        })}>Guardar</button>
        <button className="btn" onClick={() => save(null)}>Quitar cambios</button>
      </div>
    </Modal>
  );
}
