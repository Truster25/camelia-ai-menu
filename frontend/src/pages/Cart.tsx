import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { api, ApiError, formatRwf } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { DishArt } from '../components/DishCard';
import { EmptyState, ErrorNote } from '../components/ui';
import type { Order } from '../lib/types';
import { getSavedTable } from '../lib/table';

export function Cart() {
  const { lines, total, count, setQuantity, remove, clear } = useCart();
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  // Pre-filled when a table's QR code brought the guest here; still a plain
  // editable field, so a guest who prefers to type their own table can.
  const [table, setTable] = useState(getSavedTable);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<'cash' | 'momo' | 'card'>('cash');
  const [busy, setBusy] = useState(false);

  const placeOrder = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    setError('');
    setBusy(true);
    try {
      const order = await api.post<Order>('/orders', {
        items: lines.map((line) => ({ dish_id: line.dish.id, quantity: line.quantity })),
        table_number: table,
        note,
        payment_method: payment,
      });
      clear();
      navigate('/orders', { state: { justPlaced: order.id } });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not place the order.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-header-theme="dark" className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <p className="kicker">{t('cart.kicker')}</p>
      <h1 className="mt-4 font-display text-[clamp(2rem,4.4vw,3.2rem)] tracking-[-0.03em]">{t('cart.heroTitle')}</h1>
      <p className="mt-3 max-w-xl text-sm text-sage-400">
        {t('cart.heroBody')}
      </p>

      {count === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<ShoppingBag size={22} />}
            title={t('cart.empty.title')}
            body={t('cart.empty.body')}
            action={<Link to="/menu" className="btn-primary">{t('cart.browse')}</Link>}
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <ul className="space-y-4">
            {lines.map((line) => (
              <li key={line.dish.id} className="card flex items-center gap-4 p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                  <DishArt dish={line.dish} className="h-20" showLabels={false} />
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/menu/${line.dish.id}`} className="font-display text-lg hover:text-white">{line.dish.name}</Link>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-amber-soft">
                    {line.dish.category_name} · {formatRwf(line.dish.price_rwf)}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="inline-flex items-center rounded-full border border-white/15">
                      <button onClick={() => setQuantity(line.dish.id, line.quantity - 1)} className="grid h-8 w-8 place-items-center text-sage-300 hover:text-white" aria-label={`${t('cart.fewer')} ${line.dish.name}`}>
                        <Minus size={12} />
                      </button>
                      <span className="w-7 text-center text-xs">{line.quantity}</span>
                      <button onClick={() => setQuantity(line.dish.id, line.quantity + 1)} className="grid h-8 w-8 place-items-center text-sage-300 hover:text-white" aria-label={`${t('cart.more')} ${line.dish.name}`}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => remove(line.dish.id)} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-sage-400 hover:text-red-300">
                      <Trash2 size={12} /> {t('cart.remove')}
                    </button>
                  </div>
                </div>
                <p className="shrink-0 text-sm text-amber-pale">{formatRwf(line.dish.price_rwf * line.quantity)}</p>
              </li>
            ))}
            <li>
              <button onClick={clear} className="text-[10px] uppercase tracking-[0.14em] text-sage-400 hover:text-red-300">
                {t('cart.clear')}
              </button>
            </li>
          </ul>

          <div className="card h-fit p-6">
            <h2 className="font-display text-2xl">{t('cart.summary')}</h2>
            <dl className="mt-5 space-y-3 border-b border-white/10 pb-5 text-sm">
              <div className="flex justify-between text-sage-300">
                <dt>{t('cart.items')} ({count})</dt>
                <dd>{formatRwf(total)}</dd>
              </div>
              <div className="flex justify-between text-sage-400">
                <dt>{t('cart.service')}</dt>
                <dd>{t('cart.serviceIncluded')}</dd>
              </div>
            </dl>
            <div className="flex items-baseline justify-between py-4">
              <span className="text-[10px] uppercase tracking-[0.16em] text-sage-400">{t('cart.total')}</span>
              <span className="font-display text-2xl text-amber-pale">{formatRwf(total)}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="table">{t('cart.tableNumber')}</label>
                <input
                  id="table"
                  value={table}
                  onChange={(event) => setTable(event.target.value)}
                  className="field"
                  placeholder={t('cart.tableNumber.placeholder')}
                  maxLength={20}
                />
              </div>
              <div>
                <label className="label" htmlFor="note">{t('cart.note')}</label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  maxLength={500}
                  className="field resize-none"
                  placeholder={t('cart.note.placeholder')}
                />
              </div>
            </div>

            <div className="mt-6">
              <span className="label">{t('cart.payment.question')}</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([
                  ['cash', t('cart.payment.cash')],
                  ['momo', t('cart.payment.momo')],
                  ['card', t('cart.payment.card')],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPayment(value)}
                    aria-pressed={payment === value}
                    className={`rounded-xl border px-2 py-3 text-[10.5px] font-semibold uppercase leading-tight tracking-[0.1em] transition ${
                      payment === value
                        ? 'border-amber-logo bg-amber-logo/15 text-amber-pale'
                        : 'border-white/12 text-sage-300 hover:border-white/25'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="mt-4"><ErrorNote message={error} /></div>}

            <button onClick={placeOrder} disabled={busy} className="btn-primary mt-5 w-full">
              {busy ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-forest-950 border-t-transparent" />
              ) : user ? (
                t('cart.checkout')
              ) : (
                t('cart.signInToOrder')
              )}
            </button>
            <p className="mt-3 text-center text-[11px] text-sage-400">
              {t('cart.disclaimer')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
