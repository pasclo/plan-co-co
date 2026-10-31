import { useMemo, useState } from 'react';
import { useCatalog, useRecipes, useSchoolGroups } from '../hooks';
import { addDays, dayName, isWeekday, shortDate, today, weekDays, weekStart } from '../lib/dates';
import { fitsDiet } from '../lib/diet';
import { dinnerCost, generatePlan, schoolClash } from '../lib/planner';
import { fmtEur } from '../lib/pricing';
import { buildShoppingList, totalCost } from '../lib/shopping';
import { useStore } from '../store';
import type { Recipe } from '../types';
import { GroupChips, Modal, RecipeDetail } from '../components/ui';

export function WeekView({ week, setWeek }: { week: string; setWeek: (w: string) => void }) {
  const s = useStore();
  const { list, byId } = useRecipes();
  const catalog = useCatalog();
  const schoolGroups = useSchoolGroups();
  const days = weekDays(week);
  const plan = s.plans[week];
  const [picker, setPicker] = useState<string | null>(null);
  const [detail, setDetail] = useState<Recipe | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const cost = useMemo(
    () => (plan ? totalCost(buildShoppingList(Object.values(plan.days), byId, s.settings.people, s.pantry, catalog)) : 0),
    [plan, byId, s.settings.people, s.pantry, catalog],
  );

  const generate = () => {
    const res = generatePlan({
      days, recipes: list, settings: s.settings, pantry: s.pantry, catalog, schoolGroups,
      current: plan, disabled: s.disabledRecipes,
    });
    s.setPlan(week, res.plan);
    setWarn(res.overBudget ? `No llego al presupuesto: lo más barato que he encontrado son ${fmtEur(res.cost)}.` : null);
  };

  const update = (day: string, patch: Partial<{ recipeId: string; locked: boolean; cooked: boolean }>) => {
    const cur = plan?.days[day];
    const next = { ...(cur ?? { recipeId: patch.recipeId! }), ...patch };
    s.setPlan(week, { generatedAt: plan?.generatedAt ?? new Date().toISOString(), days: { ...(plan?.days ?? {}), [day]: next } });
  };

  const markCooked = (day: string) => {
    const d = plan?.days[day];
    if (!d) return;
    const r = byId[d.recipeId];
    if (!d.cooked && r) {
      // Take what was used out of the pantry.
      const k = s.settings.people / r.servings;
      for (const ri of r.ingredients) {
        if (s.pantry[ri.id] !== undefined) s.setPantry(ri.id, (s.pantry[ri.id] ?? 0) - ri.qty * k);
      }
    }
    update(day, { cooked: !d.cooked });
  };

  const budgetPct = Math.min(100, (cost / Math.max(1, s.settings.budget)) * 100);

  return (
    <div>
      <div className="week-nav">
        <button className="icon-btn" onClick={() => setWeek(addDays(week, -7))} aria-label="Semana anterior">‹</button>
        <div>
          <b>Semana del {shortDate(week)}</b>
          {week === weekStart(today()) && <span className="muted small"> · esta semana</span>}
        </div>
        <button className="icon-btn" onClick={() => setWeek(addDays(week, 7))} aria-label="Semana siguiente">›</button>
      </div>

      <div className="card budget">
        <div className="row-between">
          <span>Compra estimada</span>
          <b className={cost > s.settings.budget ? 'over' : ''}>{fmtEur(cost)} / {fmtEur(s.settings.budget)}</b>
        </div>
        <div className="bar"><div style={{ width: `${budgetPct}%` }} className={cost > s.settings.budget ? 'over' : ''} /></div>
        <button className="btn primary full" onClick={generate}>
          {plan ? '🔄 Volver a generar (mantiene los fijados 📌)' : '✨ Generar semana'}
        </button>
        {warn && <p className="warn small">{warn}</p>}
      </div>

      {days.map((day) => {
        const d = plan?.days[day];
        const r = d && byId[d.recipeId];
        const sg = schoolGroups[day] ?? [];
        const lunches = s.kids.map((k) => ({ k, dishes: k.menu[day] ?? [] })).filter((x) => x.dishes.length);
        const clash = r && schoolClash(r, sg);
        return (
          <div key={day} className={`card day ${d?.cooked ? 'cooked' : ''}`}>
            <div className="day-head">
              <b className="cap">{dayName(day)}</b> <span className="muted">{shortDate(day)}</span>
            </div>
            {lunches.length > 0 ? (
              <div className="school small">
                {lunches.map(({ k, dishes }) => (
                  <div key={k.id}>🏫 <b>{k.name}:</b> {dishes.join(' · ')}</div>
                ))}
              </div>
            ) : (
              isWeekday(day) && s.kids.length > 0 && <div className="school small muted">🏫 Sin menú del cole para este día</div>
            )}
            {r ? (
              <>
                <button className="dinner" onClick={() => setDetail(r)}>
                  <span className="emoji">{r.emoji}</span>
                  <span className="dinner-text">
                    <span className="dinner-name">{r.name}</span>
                    <span className="muted small">
                      {fmtEur(dinnerCost(r, s.settings.people, catalog))} · {r.kcal} kcal · {r.minutes} min
                    </span>
                  </span>
                </button>
                {clash && <p className="warn small">⚠️ {clash}</p>}
                <div className="actions">
                  <button className={`btn small ${d.locked ? 'on' : ''}`} onClick={() => update(day, { locked: !d.locked })}>
                    📌 {d.locked ? 'Fijado' : 'Fijar'}
                  </button>
                  <button className="btn small" onClick={() => setPicker(day)}>🔁 Cambiar</button>
                  <button className={`btn small ${d.cooked ? 'on' : ''}`} onClick={() => markCooked(day)}>
                    ✅ {d.cooked ? 'Hecha' : 'Hecha?'}
                  </button>
                </div>
              </>
            ) : (
              <button className="btn small" onClick={() => setPicker(day)}>➕ Elegir cena</button>
            )}
          </div>
        );
      })}

      {picker && (
        <Modal title={`Cena del ${dayName(picker)} ${shortDate(picker)}`} onClose={() => setPicker(null)}>
          <Picker
            recipes={list.filter((r) => fitsDiet(r, s.settings) && !s.disabledRecipes.includes(r.id))}
            schoolGroups={schoolGroups[picker] ?? []}
            people={s.settings.people}
            catalog={catalog}
            onPick={(id) => {
              update(picker, { recipeId: id, cooked: false });
              setPicker(null);
            }}
          />
        </Modal>
      )}
      {detail && (
        <Modal title={`${detail.emoji} ${detail.name}`} onClose={() => setDetail(null)}>
          <RecipeDetail recipe={detail} people={s.settings.people} cost={dinnerCost(detail, s.settings.people, catalog)} />
        </Modal>
      )}
    </div>
  );
}

function Picker({ recipes, schoolGroups, people, catalog, onPick }: {
  recipes: Recipe[];
  schoolGroups: import('../types').FoodGroup[];
  people: number;
  catalog: ReturnType<typeof useCatalog>;
  onPick: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const sorted = recipes
    .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))
    .map((r) => ({ r, clash: schoolClash(r, schoolGroups), cost: dinnerCost(r, people, catalog) }))
    .sort((a, b) => Number(!!a.clash) - Number(!!b.clash) || a.cost - b.cost);
  return (
    <div>
      <input className="input" placeholder="Buscar receta…" value={q} onChange={(e) => setQ(e.target.value)} />
      {sorted.map(({ r, clash, cost }) => (
        <button key={r.id} className="list-item" onClick={() => onPick(r.id)}>
          <span className="emoji">{r.emoji}</span>
          <span className="dinner-text">
            <span>{r.name}</span>
            <span className="muted small">{fmtEur(cost)} · <GroupChips groups={r.groups.slice(0, 2)} /></span>
            {clash && <span className="warn small">⚠️ {clash}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
