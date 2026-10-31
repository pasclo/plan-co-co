import { useState } from 'react';
import { INGREDIENTS, INGREDIENT_BY_ID } from '../data/ingredients';
import { useCatalog, useRecipes } from '../hooks';
import { fitsDiet } from '../lib/diet';
import { dinnerCost } from '../lib/planner';
import { fmtEur } from '../lib/pricing';
import { useStore } from '../store';
import { MAIN_GROUPS, type FoodGroup, type Recipe } from '../types';
import { GROUP_LABEL, GroupChips, Modal, RecipeDetail } from '../components/ui';

export function RecipesView() {
  const s = useStore();
  const { list } = useRecipes();
  const catalog = useCatalog();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<FoodGroup | null>(null);
  const [open, setOpen] = useState<Recipe | null>(null);
  const [editing, setEditing] = useState<Recipe | null>(null);

  const shown = list.filter(
    (r) => r.name.toLowerCase().includes(q.toLowerCase()) && (!group || r.groups[0] === group),
  );

  return (
    <div>
      <input className="input" placeholder="Buscar receta…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips scroll">
        <button className={`chip btn-chip ${!group ? 'on' : ''}`} onClick={() => setGroup(null)}>Todas</button>
        {[...MAIN_GROUPS, 'verdura' as FoodGroup].map((g) => (
          <button key={g} className={`chip btn-chip ${group === g ? 'on' : ''}`} onClick={() => setGroup(g)}>{GROUP_LABEL[g]}</button>
        ))}
      </div>
      <button className="btn full" onClick={() => setEditing(emptyRecipe())}>➕ Añadir mi receta</button>
      {shown.map((r) => {
        const off = s.disabledRecipes.includes(r.id);
        const fits = fitsDiet(r, s.settings);
        return (
          <button key={r.id} className={`list-item card ${off || !fits ? 'dim' : ''}`} onClick={() => setOpen(r)}>
            <span className="emoji">{r.emoji}</span>
            <span className="dinner-text">
              <span>{r.name}{r.custom && ' ⭐'}</span>
              <span className="muted small">
                {fmtEur(dinnerCost(r, s.settings.people, catalog))} · {r.minutes} min · <GroupChips groups={r.groups.slice(0, 2)} />
              </span>
              {!fits && <span className="warn small">No encaja con vuestra dieta o alergias</span>}
              {off && <span className="muted small">No se propone en el plan</span>}
            </span>
          </button>
        );
      })}

      {open && (
        <Modal title={`${open.emoji} ${open.name}`} onClose={() => setOpen(null)}>
          <RecipeDetail recipe={open} people={s.settings.people} cost={dinnerCost(open, s.settings.people, catalog)} />
          <div className="actions">
            <button className="btn" onClick={() => {
              const off = s.disabledRecipes.includes(open.id);
              s.set({ disabledRecipes: off ? s.disabledRecipes.filter((x) => x !== open.id) : [...s.disabledRecipes, open.id] });
            }}>
              {s.disabledRecipes.includes(open.id) ? '👍 Volver a proponer' : '🚫 No proponer'}
            </button>
            <button className="btn" onClick={() => { setEditing(open.custom ? open : { ...open, id: `mi-${Date.now()}`, name: `${open.name} (mía)`, custom: true }); setOpen(null); }}>
              ✎ {open.custom ? 'Editar' : 'Copiar y editar'}
            </button>
            {open.custom && (
              <button className="btn danger" onClick={() => { s.deleteRecipe(open.id); setOpen(null); }}>🗑 Borrar</button>
            )}
          </div>
        </Modal>
      )}
      {editing && <RecipeEditor initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

const emptyRecipe = (): Recipe => ({
  id: `mi-${Date.now()}`, name: '', emoji: '🍽️', servings: 4, minutes: 30, groups: ['verdura'],
  ingredients: [], steps: [], kcal: 450, protein: 20, carbs: 45, fat: 18, custom: true,
});

function RecipeEditor({ initial, onClose }: { initial: Recipe; onClose: () => void }) {
  const save = useStore((s) => s.saveRecipe);
  const [r, setR] = useState<Recipe>(initial);
  const [steps, setSteps] = useState(initial.steps.join('\n'));
  const [addId, setAddId] = useState('');
  const up = (p: Partial<Recipe>) => setR({ ...r, ...p });
  const num = (v: string) => Number(v.replace(',', '.')) || 0;
  const allGroups = Object.keys(GROUP_LABEL) as FoodGroup[];

  return (
    <Modal title={initial.name ? 'Editar receta' : 'Nueva receta'} onClose={onClose}>
      <label className="field">Nombre<input className="input" value={r.name} onChange={(e) => up({ name: e.target.value })} /></label>
      <div className="grid3">
        <label className="field">Emoji<input className="input" value={r.emoji} onChange={(e) => up({ emoji: e.target.value })} /></label>
        <label className="field">Raciones<input className="input" inputMode="numeric" value={r.servings} onChange={(e) => up({ servings: num(e.target.value) || 1 })} /></label>
        <label className="field">Minutos<input className="input" inputMode="numeric" value={r.minutes} onChange={(e) => up({ minutes: num(e.target.value) })} /></label>
      </div>
      <div className="field">Plato principal
        <select className="input" value={r.groups[0]} onChange={(e) => up({ groups: [e.target.value as FoodGroup, ...r.groups.slice(1).filter((g) => g !== e.target.value)] })}>
          {[...MAIN_GROUPS, 'verdura' as FoodGroup].map((g) => <option key={g} value={g}>{GROUP_LABEL[g]}</option>)}
        </select>
      </div>
      <div className="field">También lleva
        <div className="chips">
          {allGroups.filter((g) => g !== r.groups[0]).map((g) => (
            <button key={g} className={`chip btn-chip ${r.groups.includes(g) ? 'on' : ''}`}
              onClick={() => up({ groups: r.groups.includes(g) ? r.groups.filter((x) => x !== g) : [...r.groups, g] })}>
              {GROUP_LABEL[g]}
            </button>
          ))}
        </div>
      </div>
      <h3>Ingredientes (para {r.servings} raciones)</h3>
      {r.ingredients.map((ri, i) => {
        const ing = INGREDIENT_BY_ID[ri.id];
        return (
          <div key={ri.id} className="line">
            <span className="line-text">{ing?.name}</span>
            <input className="input qty" inputMode="decimal" value={ri.qty}
              onChange={(e) => up({ ingredients: r.ingredients.map((x, j) => (j === i ? { ...x, qty: num(e.target.value) } : x)) })} />
            <span className="muted small">{ing?.unit}</span>
            <button className="icon-btn small" onClick={() => up({ ingredients: r.ingredients.filter((_, j) => j !== i) })} aria-label="Quitar">✕</button>
          </div>
        );
      })}
      <select className="input" value={addId} onChange={(e) => {
        const id = e.target.value;
        if (id && !r.ingredients.some((x) => x.id === id)) up({ ingredients: [...r.ingredients, { id, qty: INGREDIENT_BY_ID[id].unit === 'ud' ? 1 : 100 }] });
        setAddId('');
      }}>
        <option value="">➕ Añadir ingrediente…</option>
        {[...INGREDIENTS].sort((a, b) => a.name.localeCompare(b.name)).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
      </select>
      <label className="field">Pasos (uno por línea)
        <textarea className="input" rows={5} value={steps} onChange={(e) => setSteps(e.target.value)} />
      </label>
      <div className="grid4">
        <label className="field">kcal<input className="input" inputMode="numeric" value={r.kcal} onChange={(e) => up({ kcal: num(e.target.value) })} /></label>
        <label className="field">Prot.<input className="input" inputMode="numeric" value={r.protein} onChange={(e) => up({ protein: num(e.target.value) })} /></label>
        <label className="field">Hidr.<input className="input" inputMode="numeric" value={r.carbs} onChange={(e) => up({ carbs: num(e.target.value) })} /></label>
        <label className="field">Grasa<input className="input" inputMode="numeric" value={r.fat} onChange={(e) => up({ fat: num(e.target.value) })} /></label>
      </div>
      <button className="btn primary full" disabled={!r.name.trim() || !r.ingredients.length}
        onClick={() => { save({ ...r, steps: steps.split('\n').map((x) => x.trim()).filter(Boolean), custom: true }); onClose(); }}>
        Guardar receta
      </button>
    </Modal>
  );
}
