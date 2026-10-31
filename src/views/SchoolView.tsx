import { useRef, useState } from 'react';
import { dayName, shortDate, today, toIso } from '../lib/dates';
import { extractPdfItems } from '../lib/pdf';
import { classifyDay, detectMonth, itemsToText, parseLines, parseMenu, type TextItem } from '../lib/schoolMenu';
import { useStore } from '../store';
import type { Kid } from '../types';
import { GroupChips, Modal } from '../components/ui';

const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function SchoolView() {
  const kids = useStore((s) => s.kids);
  const upsertKid = useStore((s) => s.upsertKid);
  const removeKid = useStore((s) => s.removeKid);
  const [importFor, setImportFor] = useState<Kid | null>(null);

  return (
    <div>
      <p className="muted small">
        Sube el PDF del menú de cada colegio. Las cenas evitarán repetir lo que comen al mediodía
        (por ejemplo, si comen lentejas, la cena no será legumbre).
      </p>
      {kids.map((k) => <KidCard key={k.id} kid={k} onImport={() => setImportFor(k)} onChange={upsertKid} onRemove={() => removeKid(k.id)} />)}
      <button className="btn full" onClick={() => upsertKid({ id: `kid-${Date.now()}`, name: `Niño ${kids.length + 1}`, school: '', menu: {} })}>
        ➕ Añadir niño/a
      </button>
      {importFor && <ImportMenu kid={importFor} onClose={() => setImportFor(null)} />}
    </div>
  );
}

function KidCard({ kid, onImport, onChange, onRemove }: { kid: Kid; onImport: () => void; onChange: (k: Kid) => void; onRemove: () => void }) {
  const t = today();
  const upcoming = Object.keys(kid.menu).filter((d) => d >= t).sort().slice(0, 5);
  const months = Object.keys(kid.menu).reduce<Record<string, number>>((acc, d) => {
    const m = d.slice(0, 7);
    acc[m] = (acc[m] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="card">
      <div className="grid2">
        <label className="field">Nombre<input className="input" value={kid.name} onChange={(e) => onChange({ ...kid, name: e.target.value })} /></label>
        <label className="field">Colegio<input className="input" value={kid.school} onChange={(e) => onChange({ ...kid, school: e.target.value })} /></label>
      </div>
      <button className="btn primary full" onClick={onImport}>📄 Subir menú en PDF</button>
      {Object.keys(months).length > 0 && (
        <div className="small">
          {Object.entries(months).sort().map(([m, n]) => {
            const [y, mm] = m.split('-').map(Number);
            return (
              <div key={m} className="row-between">
                <span>{MONTH_NAMES[mm - 1]} {y}: {n} días</span>
                <button className="icon-btn small" aria-label="Borrar mes" onClick={() =>
                  onChange({ ...kid, menu: Object.fromEntries(Object.entries(kid.menu).filter(([d]) => !d.startsWith(m))) })}>🗑</button>
              </div>
            );
          })}
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="small school">
          {upcoming.map((d) => (
            <div key={d}><b className="cap">{dayName(d)} {shortDate(d)}:</b> {kid.menu[d].join(' · ')}</div>
          ))}
        </div>
      )}
      <button className="btn small danger" onClick={() => confirm(`¿Quitar a ${kid.name}?`) && onRemove()}>Quitar</button>
    </div>
  );
}

function ImportMenu({ kid, onClose }: { kid: Kid; onClose: () => void }) {
  const upsertKid = useStore((s) => s.upsertKid);
  const fileRef = useRef<HTMLInputElement>(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [items, setItems] = useState<TextItem[] | null>(null);
  const [rawText, setRawText] = useState('');
  const [mode, setMode] = useState<'pdf' | 'text'>('pdf');
  const [days, setDays] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toEditable = (m: Record<string, string[]>) =>
    Object.fromEntries(Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).map(([d, l]) => [d, l.join('\n')]));

  const onFile = async (f: File) => {
    setBusy(true);
    setError(null);
    try {
      const its = await extractPdfItems(f);
      if (!its.length) {
        setError('No he podido leer texto en este PDF (puede ser una imagen escaneada). Prueba a pegar el texto o escribe el menú a mano.');
        setMode('text');
        return;
      }
      const text = itemsToText(its);
      const det = detectMonth(text);
      const m = det?.month ?? month;
      const y = det?.year ?? year;
      setMonth(m);
      setYear(y);
      setItems(its);
      setRawText(text);
      setDays(toEditable(parseMenu(its, m, y)));
    } catch (e) {
      setError(`Error al leer el PDF: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const reparse = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
    if (items) setDays(toEditable(parseMenu(items, m, y)));
    else if (rawText) setDays(toEditable(parseLines(rawText, m, y)));
  };

  const save = () => {
    if (!days) return;
    const menu = { ...kid.menu };
    for (const [d, txt] of Object.entries(days)) {
      const dishes = txt.split('\n').map((x) => x.trim()).filter(Boolean);
      if (dishes.length) menu[d] = dishes;
      else delete menu[d];
    }
    upsertKid({ ...kid, menu });
    onClose();
  };

  const addDay = () => {
    const iso = prompt('Día del mes (número)');
    const n = Number(iso);
    if (!n || n < 1 || n > 31) return;
    setDays({ ...(days ?? {}), [toIso(new Date(year, month, n))]: '' });
  };

  return (
    <Modal title={`Menú de ${kid.name}${kid.school ? ` (${kid.school})` : ''}`} onClose={onClose}>
      <div className="grid2">
        <label className="field">Mes
          <select className="input" value={month} onChange={(e) => reparse(Number(e.target.value), year)}>
            {MONTH_NAMES.map((n, i) => <option key={n} value={i}>{n}</option>)}
          </select>
        </label>
        <label className="field">Año
          <input className="input" inputMode="numeric" value={year} onChange={(e) => reparse(month, Number(e.target.value) || year)} />
        </label>
      </div>
      <div className="chips">
        <button className={`chip btn-chip ${mode === 'pdf' ? 'on' : ''}`} onClick={() => setMode('pdf')}>PDF</button>
        <button className={`chip btn-chip ${mode === 'text' ? 'on' : ''}`} onClick={() => setMode('text')}>Pegar texto</button>
      </div>
      {mode === 'pdf' ? (
        <>
          <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <button className="btn primary full" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? 'Leyendo…' : '📄 Elegir PDF'}
          </button>
        </>
      ) : (
        <>
          <textarea className="input" rows={6} placeholder={'Ejemplo:\nLunes 3: Lentejas, merluza con ensalada\nMartes 4: Macarrones, pollo asado'}
            value={rawText} onChange={(e) => setRawText(e.target.value)} />
          <button className="btn full" onClick={() => { setItems(null); setDays(toEditable(parseLines(rawText, month, year))); }}>Leer texto</button>
        </>
      )}
      {error && <p className="warn small">{error}</p>}

      {days && (
        <>
          <h3>Revisa el menú ({Object.keys(days).length} días)</h3>
          <p className="muted small">Un plato por línea. Corrige lo que se haya leído mal antes de guardar.</p>
          {Object.keys(days).length === 0 && <p className="warn small">No he encontrado días. Cambia a “Pegar texto” o añade los días a mano.</p>}
          {Object.entries(days).map(([d, txt]) => (
            <div key={d} className="menu-day">
              <div className="row-between">
                <b className="cap">{dayName(d)} {shortDate(d)}</b>
                <button className="icon-btn small" aria-label="Quitar día" onClick={() => { const n = { ...days }; delete n[d]; setDays(n); }}>✕</button>
              </div>
              <textarea className="input" rows={Math.max(2, txt.split('\n').length)} value={txt} onChange={(e) => setDays({ ...days, [d]: e.target.value })} />
              <GroupChips groups={classifyDay(txt.split('\n'))} />
            </div>
          ))}
          <button className="btn full" onClick={addDay}>➕ Añadir día</button>
          {rawText && mode === 'pdf' && (
            <details><summary className="small muted">Ver texto leído del PDF</summary><pre className="raw">{rawText}</pre></details>
          )}
          <button className="btn primary full" onClick={save}>Guardar menú</button>
        </>
      )}
    </Modal>
  );
}
