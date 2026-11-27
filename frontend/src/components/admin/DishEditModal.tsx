import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, X } from 'lucide-react';
import { api, ApiError, assetUrl, uploadDishImage } from '../../lib/api';
import type { Category, Dish } from '../../lib/types';
import { ErrorNote } from '../ui';
import { Select } from '../Select';

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
  image_url: null as string | null,
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
          image_url: dish.image_url,
          is_available: dish.is_available,
          is_signature: dish.is_signature,
        }
      : { ...emptyForm, category_id: categories[0]?.id ?? 0 },
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const pickImage = () => fileInput.current?.click();

  const onImageSelected = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file (JPEG, PNG or WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Images must be 5 MB or smaller.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const url = await uploadDishImage(file);
      set('image_url', url);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not upload the image.');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

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

        <div className="mt-6">
          <span className="label">Photo</span>
          <div className="flex items-center gap-4">
            <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/15 bg-forest-950/60">
              {form.image_url ? (
                <img src={assetUrl(form.image_url)!} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus size={22} className="text-sage-400" />
              )}
              {uploading && (
                <div className="absolute inset-0 grid place-items-center bg-forest-950/70">
                  <Loader2 size={20} className="animate-spin text-amber-pale" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => onImageSelected(event.target.files?.[0])}
              />
              <button type="button" onClick={pickImage} disabled={uploading} className="btn-quiet !text-[10px]">
                <ImagePlus size={14} /> {form.image_url ? 'Replace photo' : 'Upload photo'}
              </button>
              {form.image_url && (
                <button type="button" onClick={() => set('image_url', null)} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-sage-400 hover:text-red-300">
                  <Trash2 size={12} /> Remove photo
                </button>
              )}
              <p className="text-[10px] text-sage-400">JPEG, PNG or WEBP, up to 5 MB. Shown on the menu and dish page.</p>
            </div>
          </div>
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
            <Select
              label="Category"
              value={String(form.category_id)}
              onChange={(value) => set('category_id', Number(value))}
              options={categories.map((category) => ({ value: String(category.id), label: category.name }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="dish-price">Price (RWF)</label>
            <input id="dish-price" type="number" min={0} className="field" value={form.price_rwf} onChange={(event) => set('price_rwf', Number(event.target.value))} />
          </div>
          <div>
            <Select
              label="Cuisine"
              value={form.cuisine}
              onChange={(value) => set('cuisine', value)}
              options={['Rwandan', 'African', 'International'].map((value) => ({ value, label: value }))}
            />
          </div>
          <div>
            <Select
              label="Spice level"
              value={String(form.spice_level)}
              onChange={(value) => set('spice_level', Number(value))}
              options={['None', 'Mild', 'Medium', 'Hot'].map((label, index) => ({ value: String(index), label }))}
            />
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
            <Select
              label="Card tone"
              value={form.art_tone}
              onChange={(value) => set('art_tone', value)}
              options={['green', 'amber', 'brown', 'rose'].map((tone) => ({
                value: tone,
                label: tone[0].toUpperCase() + tone.slice(1),
              }))}
            />
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
