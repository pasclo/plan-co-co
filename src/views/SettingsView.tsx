import { useRef, useState } from 'react';
import { ALLERGEN_LABELS } from '../lib/diet';
import { shortDate } from '../lib/dates';
import { exportBackup, initialState, useStore, type State } from '../store';
import type { Allergen, Diet } from '../types';

export function SettingsView() {
  const s = useStore();
  const st = s.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const download = () => {
    const blob = new Blob([exportBackup(s)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `plan-co-co-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const restore = async (f: File) => {
    try {
      const json = JSON.parse(await f.text());
      if (json.app !== 'plan-co-co' || !json.data) throw new Error('No es una copia de Plan Co-Co');
      s.importBackup(json.data as Partial<State>);
      setMsg('Copia restaurada ✔');
      location.reload();
    } catch (e) {
      setMsg(`No se pudo restaurar: ${(e as Error).message}`);
    }
  };

  return (
    <div>
      <div className="card">
        <h3>Familia y presupuesto</h3>
        <div className="grid2">
          <label className="field">Personas a cenar
            <input className="input" inputMode="numeric" value={st.people} onChange={(e) => s.setSettings({ people: Math.max(1, Number(e.target.value) || 1) })} />
          </label>
          <label className="field">Presupuesto semanal (€)
            <input className="input" inputMode="decimal" value={st.budget} onChange={(e) => s.setSettings({ budget: Math.max(0, Number(e.target.value.replace(',', '.')) || 0) })} />
          </label>
        </div>
      </div>
      <div className="card">
        <h3>Dieta</h3>
        <div className="chips">
          {(['vegetariano', 'vegano'] as Diet[]).map((d) => (
            <button key={d} className={`chip btn-chip ${st.diets.includes(d) ? 'on' : ''}`} onClick={() => s.setSettings({ diets: toggle(st.diets, d) })}>{d === "vegano" ? "Vegano" : "Vegetariano"}</button>
          ))}
        </div>
        <h3>Alergias e intolerancias</h3>
        <div className="chips">
          {(Object.keys(ALLERGEN_LABELS) as Allergen[]).map((a) => (
            <button key={a} className={`chip btn-chip ${st.allergies.includes(a) ? 'on' : ''}`} onClick={() => s.setSettings({ allergies: toggle(st.allergies, a) })}>
              Sin {ALLERGEN_LABELS[a].toLowerCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>Mercadona</h3>
        <p className="small">Código postal: <b>{s.prices?.postalCode ?? st.postalCode}</b></p>
        <p className="small muted">
          {s.prices?.updatedAt
            ? `Precios descargados el ${shortDate(s.prices.updatedAt.slice(0, 10))} (${Object.keys(s.prices.products).length} productos). Se actualizan cada lunes.`
            : 'Aún no hay precios de Mercadona descargados: se usan precios aproximados.'}
        </p>
        {Object.keys(s.priceOverrides).length > 0 && (
          <button className="btn small" onClick={() => s.set({ priceOverrides: {} })}>Quitar mis cambios de precios ({Object.keys(s.priceOverrides).length})</button>
        )}
      </div>
      <div className="card">
        <h3>Copia de seguridad</h3>
        <p className="small muted">Los datos se guardan solo en este móvil. Descarga una copia de vez en cuando.</p>
        <div className="actions">
          <button className="btn" onClick={download}>⬇️ Descargar copia</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>⬆️ Restaurar copia</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
        </div>
        {msg && <p className="small">{msg}</p>}
        <button className="btn small danger" onClick={() => confirm('¿Borrar todos los datos de la app?') && s.importBackup(initialState)}>Borrar todo</button>
      </div>
    </div>
  );
}
