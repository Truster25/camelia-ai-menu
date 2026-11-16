import { useState } from 'react';
import { X } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import type { Category, Dish } from '../../lib/types';
import { ErrorNote } from '../ui';

type Props = {
  dish: Dish | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
};

const emptyForm = {
  name: '',
  description: '',
  category_id: 0,
  price_rwf: 5000,
  cuisine: 'Rwandan',
  occasions: 'casual',
  is_vegetarian: false,
  is_vegan: false,
  is_halal: true,
  is_gluten_free: false,
  spice_level: 1,
  ingredients: '',
  allergens: '',
  prep_minutes: 20,
  calories: 400,
  popularity_seed: 50,
  art_tone: 'green',
  is_available: true,
  is_signature: false,
};

export function DishEditModal({ dish, categories, onClose, onSaved }: Props) {
  const [form, setForm] = useState(() =>
    dish
      ? {
          name: dish.name,
          description: dish.description,
          category_id: dish.category_id,
          price_rwf: dish.price_rwf,
          cuisine: dish.cuisine,
          occasions: dish.occasions,
          is_vegetarian: dish.is_vegetarian,
          is_vegan: dish.is_vegan,
          is_halal: dish.is_halal,
          is_gluten_free: dish.is_gluten_free,
          spice_level: dish.spice_level,
          ingredients: dish.ingredients,
          allergens: dish.allergens,
          prep_minutes: dish.prep_minutes,
          calories: dish.calories,
          popularity_seed: dish.popularity_seed,
          art_tone: dish.art_tone,
          is_available: dish.is_available,
          is_signature: dish.is_signature,
        }
      : { ...emptyForm, category_id: categories[0]?.id ?? 0 },
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      if (dish) await api.patch(`/admin/dishes/${dish.id}`, form);
      else await api.post('/admin/dishes', form);
      onSaved();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not save the dish.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-forest-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="card my-8 w-full max-w-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-amber-soft">{dish ? 'Edit dish' : 'New dish'}</p>
            <h2 className="mt-1 font-display text-2xl">{dish ? dish.name : 'Add something to the menu'}</h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-sage-300 hover:text-white" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="dish-name">Name</label>
            <input id="dish-name" className="field" value={form.name} onChange={(event) => set('name', event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="dish-desc">Description</label>
            <textarea id="dish-desc" rows={2} className="field resize-none" value={form.description} onChange={(event) => set('description', event.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="dish-cat">Category</label>
            <select id="dish-cat" className="field" value={form.category_id} onChange={(event) => set('category_id', Number(event.target.value))}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="dish-price">Price (RWF)</label>
            <input id="dish-price" type="number" min={0} className="field" value={form.price_rwf} onChange={(event) => set('price_rwf', Number(event.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="dish-cuisine">Cuisine</label>
            <select id="dish-cuisine" className="field" value={form.cuisine} onChange={(event) => set('cuisine', event.target.value)}>
              {['Rwandan', 'African', 'International'].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="dish-spice">Spice level</label>
            <select id="dish-spice" className="field" value={form.spice_level} onChange={(event) => set('spice_level', Number(event.target.value))}>
              {['None', 'Mild', 'Medium', 'Hot'].map((label, index) => <option key={label} value={index}>{label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="dish-occ">Occasions (comma separated)</label>
            <input id="dish-occ" className="field" value={form.occasions} onChange={(event) => set('occasions', event.target.value)} placeholder="casual,date,family" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="dish-ing">Ingredients</label>
            <input id="dish-ing" className="field" value={form.ingredients} onChange={(event) => set('ingredients', event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="dish-all">Allergens</label>
            <input id="dish-all" className="field" value={form.allergens} onChange={(event) => set('allergens', event.target.value)} placeholder="milk, gluten (leave empty if none declared)" />
          </div>
          <div>
            <label className="label" htmlFor="dish-prep">Prep minutes</label>
            <input id="dish-prep" type="number" min={1} className="field" value={form.prep_minutes} onChange={(event) => set('prep_minutes', Number(event.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="dish-cal">Calories</label>
            <input id="dish-cal" type="number" min={0} className="field" value={form.calories} onChange={(event) => set('calories', Number(event.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="dish-pop">Popularity seed (0-100)</label>
            <input id="dish-pop" type="number" min={0} max={100} className="field" value={form.popularity_seed} onChange={(event) => set('popularity_seed', Number(event.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="dish-tone">Card tone</label>
            <select id="dish-tone" className="field" value={form.art_tone} onChange={(event) => set('art_tone', event.target.value)}>
              {['green', 'amber', 'brown', 'rose'].map((tone) => <option key={tone} value={tone}>{tone}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {([
            ['is_vegetarian', 'Vegetarian'],
            ['is_vegan', 'Vegan'],
            ['is_halal', 'Halal'],
            ['is_gluten_free', 'Gluten free'],
            ['is_available', 'Available on the menu'],
            ['is_signature', 'Signature dish'],
          ] as [keyof typeof form, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2.5 rounded-lg border border-white/10 px-3 py-2.5 text-[12.5px] text-sage-200">
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(event) => set(key, event.target.checked as never)}
                className="h-4 w-4 accent-[#ed9b36]"
              />
              {label}
            </label>
          ))}
        </div>

        {error && <div className="mt-4"><ErrorNote message={error} /></div>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-quiet">Cancel</button>
          <button onClick={save} disabled={busy || !form.name.trim() || !form.category_id} className="btn-primary">
            {busy ? 'Saving…' : dish ? 'Save changes' : 'Create dish'}
          </button>
        </div>
      </div>
    </div>
  );
}
