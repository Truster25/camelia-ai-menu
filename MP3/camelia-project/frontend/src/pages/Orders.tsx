import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, ClipboardList, Clock, XCircle } from 'lucide-react';
import { api, ApiError, formatDate, formatRwf } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { EmptyState, ErrorNote, Spinner, StatusPill } from '../components/ui';
import type { Dish, Order } from '../lib/types';

const flow = ['pending', 'accepted', 'preparing', 'ready', 'completed'];
const stepLabel: Record<string, string> = {
  pending: 'Received',
  accepted: 'Accepted',
  preparing: 'In the kitchen',
  ready: 'Ready',
  completed: 'Served',
};

export function Orders() {
  const { user } = useAuth();
  const location = useLocation();
  const justPlaced = (location.state as { justPlaced?: number } | null)?.justPlaced;
  const [orders, setOrders] = useState<Order[]>([]);
  const [favourites, setFavourites] = useState<Dish[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setStatus('ready');
      return;
    }
    Promise.all([api.get<Order[]>('/orders'), api.get<Dish[]>('/favourites')])
      .then(([orderRows, favouriteRows]) => {
        setOrders(orderRows);
        setFavourites(favouriteRows);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [user]);

  const cancel = async (orderId: number) => {
    setError('');
    try {
      const updated = await api.post<Order>(`/orders/${orderId}/cancel`);
      setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not cancel this order.');
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <EmptyState
          icon={<ClipboardList size={22} />}
          title="Sign in to see your orders"
          body="Your pre-orders, ratings and favourites live with your account. Sign in and everything you have ordered is waiting here."
          action={<Link to="/login" state={{ from: '/orders' }} className="btn-primary">Sign in</Link>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <p className="kicker"><span className="kicker-line" /> My orders</p>
      <h1 className="mt-4 font-display text-[clamp(2rem,4.4vw,3.2rem)] tracking-[-0.03em]">
        Hello, {user.name.split(' ')[0]}.
      </h1>
      <p className="mt-3 text-sm text-sage-400">Track your pre-orders, reorder a favourite, or check what the kitchen is doing.</p>

      {status === 'loading' && <Spinner label="Fetching your orders…" />}
      {status === 'error' && <div className="mt-6"><ErrorNote message="We could not load your orders just now. Please refresh in a moment." /></div>}
      {error && <div className="mt-6"><ErrorNote message={error} /></div>}

      {status === 'ready' && orders.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={<Clock size={22} />}
            title="No orders yet"
            body="When you pre-order from the menu it will appear here with live kitchen status."
            action={<Link to="/menu" className="btn-primary">Order something</Link>}
          />
        </div>
      )}

      {status === 'ready' && orders.length > 0 && (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => {
            const stepIndex = flow.indexOf(order.status);
            return (
              <li key={order.id} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-sage-400">
                      Order #{order.id} · {formatDate(order.created_at)}
                      {order.table_number && ` · table ${order.table_number}`}
                      {justPlaced === order.id && (
                        <span className="ml-2 rounded-full bg-amber-logo px-2 py-0.5 text-[9px] font-bold text-forest-950">NEW</span>
                      )}
                    </p>
                    <p className="mt-2 font-display text-xl text-amber-pale">{formatRwf(order.total_rwf)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={order.status} />
                    {(order.status === 'pending' || order.status === 'accepted') && (
                      <button onClick={() => cancel(order.id)} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-sage-400 hover:text-red-300">
                        <XCircle size={12} /> Cancel
                      </button>
                    )}
                  </div>
                </div>

                {order.status !== 'cancelled' ? (
                  <ol className="mt-5 flex items-center gap-1 text-[9px] uppercase tracking-[0.1em]">
                    {flow.map((step, index) => (
                      <li key={step} className="flex flex-1 items-center gap-1">
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[8px] ${index <= stepIndex ? 'border-amber-logo bg-amber-logo text-forest-950' : 'border-white/20 text-sage-400'}`}>
                          {index <= stepIndex ? <CheckCircle2 size={11} /> : index + 1}
                        </span>
                        <span className={`truncate ${index <= stepIndex ? 'text-amber-pale' : 'text-sage-400'}`}>{stepLabel[step]}</span>
                        {index < flow.length - 1 && <span className={`h-px flex-1 ${index < stepIndex ? 'bg-amber-logo/60' : 'bg-white/10'}`} />}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-4 text-[12px] text-red-200/80">This order was cancelled.</p>
                )}

                <ul className="mt-5 divide-y divide-white/5 border-t border-white/5 pt-3">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between py-2 text-[13px]">
                      <span className="text-sage-200">
                        {item.quantity} × {item.dish_name}
                      </span>
                      <span className="text-sage-400">{formatRwf(item.unit_price_rwf * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                {order.note && <p className="mt-3 text-[11px] text-sage-400">Note: {order.note}</p>}
              </li>
            );
          })}
        </ul>
      )}

      {status === 'ready' && favourites.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl">Saved favourites</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {favourites.map((dish) => (
              <Link key={dish.id} to={`/menu/${dish.id}`} className="chip !text-[11px] !normal-case !tracking-normal">
                {dish.name} · {formatRwf(dish.price_rwf)}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
