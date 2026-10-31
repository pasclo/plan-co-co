import { useEffect, type ReactNode } from 'react';
import type { FoodGroup, Recipe } from '../types';
import { INGREDIENT_BY_ID } from '../data/ingredients';
import { fmtEur, fmtQty } from '../lib/pricing';
import { isVegan, isVegetarian, recipeAllergens, ALLERGEN_LABELS } from '../lib/diet';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export const GROUP_LABEL: Record<FoodGroup, string> = {
  pescado: 'Pescado', ave: 'Pollo/pavo', carne: 'Carne', huevo: 'Huevo', legumbre: 'Legumbre',
  pasta: 'Pasta', arroz: 'Arroz', patata: 'Patata', pan: 'Pan', verdura: 'Verdura',
};

export function GroupChips({ groups }: { groups: FoodGroup[] }) {
  return (
    <span className="chips">
      {groups.map((g) => (
        <span key={g} className={`chip g-${g}`}>{GROUP_LABEL[g]}</span>
      ))}
    </span>
  );
}

export function RecipeDetail({ recipe, people, cost }: { recipe: Recipe; people: number; cost?: number }) {
  const k = people / recipe.servings;
  const al = [...recipeAllergens(recipe)];
  return (
    <div className="recipe-detail">
      <p className="muted">
        {recipe.minutes} min · {people} personas{cost != null && ` · ${fmtEur(cost)}`}
      </p>
      <GroupChips groups={recipe.groups} />
      <div className="macros">
        <div><b>{recipe.kcal}</b><span>kcal</span></div>
        <div><b>{recipe.protein} g</b><span>proteína</span></div>
        <div><b>{recipe.carbs} g</b><span>hidratos</span></div>
        <div><b>{recipe.fat} g</b><span>grasa</span></div>
      </div>
      <p className="muted small">Valores por ración, aproximados.</p>
      <p className="small">
        {isVegan(recipe) ? '🌱 Vegana' : isVegetarian(recipe) ? '🥚 Vegetariana' : ''}
        {al.length > 0 && ` · Contiene: ${al.map((a) => ALLERGEN_LABELS[a]).join(', ')}`}
      </p>
      <h3>Ingredientes</h3>
      <ul className="ing-list">
        {recipe.ingredients.map((ri) => {
          const ing = INGREDIENT_BY_ID[ri.id];
          return (
            <li key={ri.id}>
              <span>{ing?.name ?? ri.id}</span>
              <span className="muted">{fmtQty(ri.qty * k, ing?.unit ?? 'g')}</span>
            </li>
          );
        })}
      </ul>
      <h3>Pasos</h3>
      <ol className="steps">
        {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
    </div>
  );
}
