import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { api, ApiError, formatRwf } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { DishArt } from '../components/DishCard';
import { EmptyState, ErrorNote } from '../components/ui';
import type { Order } from '../lib/types';

export function Cart() {
  const { lines, total, count, setQuantity, remove, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [table, setTable] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
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
      <p className="kicker"><span className="kicker-line" /> Your pre-order</p>
      <h1 className="mt-4 font-display text-[clamp(2rem,4.4vw,3.2rem)] tracking-[-0.03em]">Your table, ready when you are.</h1>
      <p className="mt-3 max-w-xl text-sm text-sage-400">
        Pre-order at regular menu prices and pay at the table. The kitchen begins as soon as you arrive.
      </p>

      {count === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<ShoppingBag size={22} />}
            title="Your cart is empty"
            body="Add a dish from the menu, or let the AI pick your top five in under a minute."
            action={<Link to="/menu" className="btn-primary">Browse the menu</Link>}
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
                      <button onClick={() => setQuantity(line.dish.id, line.quantity - 1)} className="grid h-8 w-8 place-items-center text-sage-300 hover:text-white" aria-label={`Fewer ${line.dish.name}`}>
                        <Minus size={12} />
                      </button>
                      <span className="w-7 text-center text-xs">{line.quantity}</span>
                      <button onClick={() => setQuantity(line.dish.id, line.quantity + 1)} className="grid h-8 w-8 place-items-center text-sage-300 hover:text-white" aria-label={`More ${line.dish.name}`}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => remove(line.dish.id)} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-sage-400 hover:text-red-300">
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
                <p className="shrink-0 text-sm text-amber-pale">{formatRwf(line.dish.price_rwf * line.quantity)}</p>
              </li>
            ))}
            <li>
              <button onClick={clear} className="text-[10px] uppercase tracking-[0.14em] text-sage-400 hover:text-red-300">
                Clear cart
              </button>
            </li>
          </ul>

          <div className="card h-fit p-6">
            <h2 className="font-display text-2xl">Order summary</h2>
            <dl className="mt-5 space-y-3 border-b border-white/10 pb-5 text-sm">
              <div className="flex justify-between text-sage-300">
                <dt>Items ({count})</dt>
                <dd>{formatRwf(total)}</dd>
              </div>
              <div className="flex justify-between text-sage-400">
                <dt>Service</dt>
                <dd>Included</dd>
              </div>
            </dl>
            <div className="flex items-baseline justify-between py-4">
              <span className="text-[10px] uppercase tracking-[0.16em] text-sage-400">Total</span>
              <span className="font-display text-2xl text-amber-pale">{formatRwf(total)}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="table">Table number</label>
                <input
                  id="table"
                  value={table}
                  onChange={(event) => setTable(event.target.value)}
                  className="field"
                  placeholder="e.g. 7 (or leave blank for takeaway)"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="label" htmlFor="note">Note for the kitchen</label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  maxLength={500}
                  className="field resize-none"
                  placeholder="Allergies, no onion, extra chilli…"
                />
              </div>
            </div>

            {error && <div className="mt-4"><ErrorNote message={error} /></div>}

            <button onClick={placeOrder} disabled={busy} className="btn-primary mt-5 w-full">
              {busy ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-forest-950 border-t-transparent" />
              ) : user ? (
                'Place pre-order'
              ) : (
                'Sign in to pre-order'
              )}
            </button>
            <p className="mt-3 text-center text-[11px] text-sage-400">
              No online payment — you pay at the table like a normal order.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
