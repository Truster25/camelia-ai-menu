import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  ChefHat,
  ClipboardList,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  TrendingUp,
  Users,
  Utensils,
} from 'lucide-react';
import { api, ApiError, formatDate, formatRwf } from '../lib/api';
import type { Analytics, Category, Dish, Order } from '../lib/types';
import { EmptyState, ErrorNote, SectionHeading, Spinner, StatusPill } from '../components/ui';
import { DishEditModal } from '../components/admin/DishEditModal';

type Tab = 'overview' | 'dishes' | 'orders' | 'customers';

const statusOrder = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

export function Admin() {
  const [tab, setTab] = useState<Tab>('overview');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [creating, setCreating] = useState(false);
  const [refreshAt, setRefreshAt] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get<Analytics>('/admin/analytics?days=7'),
      api.get<Dish[]>('/dishes?available_only=false&sort=menu'),
      api.get<Category[]>('/admin/categories'),
      api.get<Order[]>('/admin/orders'),
    ])
      .then(([analyticsData, dishData, categoryData, orderData]) => {
        setAnalytics(analyticsData);
        setDishes(dishData);
        setCategories(categoryData);
        setOrders(orderData);
      })
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : 'Could not load admin data.'))
      .finally(() => setLoading(false));
  }, [refreshAt]);

  const updateStatus = async (orderId: number, status: string) => {
    try {
      const updated = await api.patch<Order>(`/admin/orders/${orderId}`, { status });
      setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not update the order.');
    }
  };

  const removeDish = async (dish: Dish) => {
    try {
      const outcome = await api.delete<{ message: string }>(`/admin/dishes/${dish.id}`);
      setError('');
      window.alert(outcome.message);
      setRefreshAt(Date.now());
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not remove the dish.');
    }
  };

  const maxDay = useMemo(
    () => Math.max(1, ...(analytics?.last_7_days.map((day) => day.orders) ?? [1])),
    [analytics],
  );

  if (loading) return <Spinner label="Opening the admin dashboard…" />;

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <SectionHeading
        kicker="Manager dashboard"
        title={<>The kitchen at a glance.</>}
        description="Live counts, order flow and menu management. Every number below comes from the API, not from hardcoded demo values."
        action={
          <button onClick={() => setRefreshAt(Date.now())} className="btn-quiet">
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      {error && <div className="mt-6"><ErrorNote message={error} /></div>}

      <div className="mt-8 flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {([
          ['overview', 'Overview', <BarChart3 size={14} key="i" />],
          ['dishes', 'Menu', <Utensils size={14} key="i" />],
          ['orders', 'Orders', <ClipboardList size={14} key="i" />],
          ['customers', 'Customers', <Users size={14} key="i" />],
        ] as [Tab, string, JSX.Element][]).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
              tab === key ? 'bg-amber-logo text-forest-950' : 'text-sage-300 hover:bg-white/5'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {analytics && tab === 'overview' && (
        <div className="mt-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="stat">
              <p className="stat-value">{analytics.total_orders}</p>
              <p className="stat-label">Orders recorded</p>
            </div>
            <div className="stat">
              <p className="stat-value">{formatRwf(analytics.revenue_rwf)}</p>
              <p className="stat-label">Revenue (excl. cancelled)</p>
            </div>
            <div className="stat">
              <p className="stat-value">{analytics.average_rating.toFixed(2)}<span className="text-base text-sage-400"> / 5</span></p>
              <p className="stat-label">{analytics.ratings} ratings</p>
            </div>
            <div className="stat">
              <p className="stat-value">{analytics.recommendations}</p>
              <p className="stat-label">AI quizzes run</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl">Last 7 days</h2>
                <span className="text-[10px] uppercase tracking-[0.14em] text-sage-400">orders · revenue</span>
              </div>
              <div className="mt-6 flex items-end gap-3">
                {analytics.last_7_days.map((day) => (
                  <div key={day.date} className="group flex flex-1 flex-col items-center gap-2">
                    <span className="text-[10px] text-sage-300">{day.orders}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-amber-logo/35 to-amber-logo transition-all group-hover:from-amber-logo/60"
                      style={{ height: `${Math.max(Math.round((day.orders / maxDay) * 132), 4)}px` }}
                      title={`${day.label}: ${day.orders} orders · ${formatRwf(day.revenue)}`}
                    />
                    <span className="text-[9px] uppercase tracking-[0.1em] text-sage-400">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-display text-xl">Order pipeline</h2>
              <ul className="mt-4 space-y-2.5">
                {statusOrder.map((status) => (
                  <li key={status} className="flex items-center justify-between text-[13px]">
                    <StatusPill status={status} />
                    <span className="text-sage-200">{analytics.orders_by_status[status] ?? 0}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-white/5 pt-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-sage-400">Quiz dietary mix</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(analytics.quiz_popularity).length === 0 && <span className="text-[12px] text-sage-400">No quizzes logged yet.</span>}
                  {Object.entries(analytics.quiz_popularity).map(([diet, count]) => (
                    <span key={diet} className="chip">{diet}: {count}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="font-display text-xl">Best performing dishes</h2>
              <TrendingUp size={16} className="text-amber-soft" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead className="border-y border-white/10 text-[9px] uppercase tracking-[0.16em] text-sage-400">
                  <tr>
                    <th className="table-cell font-normal">Dish</th>
                    <th className="table-cell font-normal">Orders</th>
                    <th className="table-cell font-normal">Rating</th>
                    <th className="table-cell font-normal">Reviews</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {analytics.top_dishes.map((dish) => (
                    <tr key={dish.dish_id} className="hover:bg-white/[0.03]">
                      <td className="table-cell text-sage-100">
                        <Link to={`/menu/${dish.dish_id}`} className="hover:text-amber-pale">{dish.name}</Link>
                      </td>
                      <td className="table-cell text-sage-300">{dish.orders}</td>
                      <td className="table-cell">
                        <span className="inline-flex items-center gap-1 text-amber-pale">
                          <Star size={11} className="fill-amber-logo text-amber-logo" />
                          {dish.rating_average.toFixed(1)}
                        </span>
                      </td>
                      <td className="table-cell text-sage-400">{dish.rating_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'dishes' && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-sage-400">
              {dishes.length} dishes · {dishes.filter((dish) => dish.is_available).length} available
            </p>
            <button onClick={() => setCreating(true)} className="btn-primary">
              <Plus size={15} /> New dish
            </button>
          </div>

          <div className="card mt-4 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead className="border-b border-white/10 text-[9px] uppercase tracking-[0.16em] text-sage-400">
                  <tr>
                    <th className="table-cell font-normal">Dish</th>
                    <th className="table-cell font-normal">Category</th>
                    <th className="table-cell font-normal">Price</th>
                    <th className="table-cell font-normal">Diet</th>
                    <th className="table-cell font-normal">Rating</th>
                    <th className="table-cell font-normal">Status</th>
                    <th className="table-cell font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dishes.map((dish) => (
                    <tr key={dish.id} className="hover:bg-white/[0.03]">
                      <td className="table-cell">
                        <span className="text-sage-100">{dish.name}</span>
                        {dish.is_signature && <span className="ml-2 text-[9px] uppercase tracking-[0.1em] text-amber-soft">signature</span>}
                      </td>
                      <td className="table-cell text-sage-400">{dish.category_name}</td>
                      <td className="table-cell text-amber-pale">{formatRwf(dish.price_rwf)}</td>
                      <td className="table-cell text-[11px] text-sage-400">
                        {[dish.is_vegan ? 'Vegan' : dish.is_vegetarian ? 'Veg' : null, dish.is_halal ? 'Halal' : null, dish.is_gluten_free ? 'GF' : null]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </td>
                      <td className="table-cell text-sage-300">
                        {dish.rating_count > 0 ? `${dish.rating_average.toFixed(1)} (${dish.rating_count})` : '—'}
                      </td>
                      <td className="table-cell">
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${dish.is_available ? 'border-emerald-400/40 text-emerald-200' : 'border-red-400/40 text-red-200'}`}>
                          {dish.is_available ? 'On menu' : 'Hidden'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditing(dish)} className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-sage-300 hover:border-amber-soft hover:text-amber-pale" aria-label={`Edit ${dish.name}`}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => removeDish(dish)} className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-sage-300 hover:border-red-400 hover:text-red-300" aria-label={`Delete ${dish.name}`}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="mt-8">
          {orders.length === 0 ? (
            <EmptyState icon={<ChefHat size={22} />} title="No orders yet" body="Pre-orders placed by customers appear here in real time." />
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <li key={order.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-sage-400">
                        #{order.id} · {order.customer_name} · {formatDate(order.created_at)}
                        {order.table_number && ` · table ${order.table_number}`}
                      </p>
                      <p className="mt-1.5 text-[13px] text-sage-200">
                        {order.items.map((item) => `${item.quantity}× ${item.dish_name}`).join(' · ')}
                      </p>
                      {order.note && <p className="mt-1 text-[11px] text-amber-pale/80">Note: {order.note}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg text-amber-pale">{formatRwf(order.total_rwf)}</p>
                      <div className="mt-1.5 flex justify-end"><StatusPill status={order.status} /></div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/5 pt-3">
                    {statusOrder.map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(order.id, status)}
                        disabled={order.status === status}
                        className={`rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] transition ${
                          order.status === status
                            ? 'bg-white/15 text-white'
                            : 'border border-white/10 text-sage-400 hover:border-amber-soft hover:text-amber-pale'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'customers' && <CustomersTab />}

      {(editing || creating) && (
        <DishEditModal
          dish={editing}
          categories={categories}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            setRefreshAt(Date.now());
          }}
        />
      )}
    </div>
  );
}

function CustomersTab() {
  const [rows, setRows] = useState<{ id: number; name: string; email: string; created_at: string }[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<{ id: number; name: string; email: string; created_at: string }[]>('/admin/customers')
      .then(setRows)
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : 'Could not load customers.'));
  }, []);

  if (error) return <div className="mt-8"><ErrorNote message={error} /></div>;
  if (!rows) return <Spinner label="Loading customers…" />;

  return (
    <div className="card mt-8 overflow-hidden">
      <table className="w-full min-w-[420px] text-left">
        <thead className="border-b border-white/10 text-[9px] uppercase tracking-[0.16em] text-sage-400">
          <tr>
            <th className="table-cell font-normal">Name</th>
            <th className="table-cell font-normal">Email</th>
            <th className="table-cell font-normal">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="table-cell text-sage-100">{row.name}</td>
              <td className="table-cell text-sage-400">{row.email}</td>
              <td className="table-cell text-sage-400">{new Date(row.created_at).toLocaleDateString('en-GB')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
