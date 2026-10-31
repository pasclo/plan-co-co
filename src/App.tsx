import { useEffect, useState } from 'react';
import { today, weekStart } from './lib/dates';
import { useStore } from './store';
import type { PricesFile } from './types';
import { WeekView } from './views/WeekView';
import { ShoppingView } from './views/ShoppingView';
import { RecipesView } from './views/RecipesView';
import { PantryView } from './views/PantryView';
import { SchoolView } from './views/SchoolView';
import { SettingsView } from './views/SettingsView';

type Tab = 'semana' | 'compra' | 'recetas' | 'despensa' | 'cole' | 'ajustes';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'semana', icon: '📅', label: 'Semana' },
  { id: 'compra', icon: '🛒', label: 'Compra' },
  { id: 'recetas', icon: '📖', label: 'Recetas' },
  { id: 'despensa', icon: '🥫', label: 'Despensa' },
  { id: 'cole', icon: '🏫', label: 'Cole' },
];

const TITLES: Record<Tab, string> = {
  semana: 'Cenas de la semana', compra: 'Lista de la compra', recetas: 'Recetas',
  despensa: 'Despensa', cole: 'Menú del colegio', ajustes: 'Ajustes',
};

const readTab = (): Tab => {
  try {
    return (localStorage.getItem('plan-co-co-tab') as Tab) || 'semana';
  } catch {
    return 'semana';
  }
};

export function App() {
  const [tab, setTab] = useState<Tab>(readTab);
  const [week, setWeek] = useState(weekStart(today()));
  const set = useStore((s) => s.set);

  useEffect(() => {
    try { localStorage.setItem('plan-co-co-tab', tab); } catch { /* ignore */ }
    window.scrollTo(0, 0);
  }, [tab]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}mercadona-prices.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((p: PricesFile | null) => p && set({ prices: p }))
      .catch(() => {});
  }, [set]);

  return (
    <div className="app">
      <header className="top">
        <span className="logo">🥘 Plan Co-Co</span>
        <h1>{TITLES[tab]}</h1>
        <button className={`icon-btn ${tab === 'ajustes' ? 'on' : ''}`} onClick={() => setTab('ajustes')} aria-label="Ajustes">⚙️</button>
      </header>
      <main>
        {tab === 'semana' && <WeekView week={week} setWeek={setWeek} />}
        {tab === 'compra' && <ShoppingView week={week} />}
        {tab === 'recetas' && <RecipesView />}
        {tab === 'despensa' && <PantryView />}
        {tab === 'cole' && <SchoolView />}
        {tab === 'ajustes' && <SettingsView />}
      </main>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>
            <small>{t.label}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}
