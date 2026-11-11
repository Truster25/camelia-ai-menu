import type { ReactNode } from 'react';
import { Star } from 'lucide-react';

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-sage-400" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-logo border-t-transparent" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
      {icon && <div className="grid h-14 w-14 place-items-center rounded-full border border-amber-soft/40 text-amber-soft">{icon}</div>}
      <div>
        <h3 className="font-display text-2xl text-sage-100">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-sage-400">{body}</p>
      </div>
      {action}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
      {message}
    </div>
  );
}

export function SectionHeading({
  kicker,
  title,
  action,
  description,
}: {
  kicker: string;
  title: ReactNode;
  action?: ReactNode;
  description?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="kicker">
          <span className="kicker-line" /> {kicker}
        </p>
        <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,2.9rem)] leading-tight tracking-[-0.02em]">{title}</h2>
        {description && <p className="mt-3 max-w-xl text-sm leading-relaxed text-sage-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stars({
  value,
  count,
  size = 13,
  onChange,
}: {
  value: number;
  count?: number;
  size?: number;
  onChange?: (stars: number) => void;
}) {
  const interactive = typeof onChange === 'function';
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        const icon = (
          <Star
            size={size}
            className={filled ? 'fill-amber-logo text-amber-logo' : 'text-sage-400/40'}
            strokeWidth={1.5}
          />
        );
        return interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className="transition hover:scale-110"
            aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
          >
            {icon}
          </button>
        ) : (
          <span key={star}>{icon}</span>
        );
      })}
      {typeof count === 'number' && <span className="ml-1 text-[11px] text-sage-400">({count})</span>}
    </span>
  );
}

export function ScoreBar({ label, value, weight }: { label: string; value: number; weight?: number }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-[10px] uppercase tracking-[0.12em] text-sage-400">
        <span>
          {label}
          {weight !== undefined && <span className="ml-1 text-sage-400/60">{Math.round(weight * 100)}%</span>}
        </span>
        <span className="text-amber-pale">{value.toFixed(0)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-amber-logo" style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'border-amber-soft/50 text-amber-pale',
    accepted: 'border-sky-400/40 text-sky-200',
    preparing: 'border-violet-400/40 text-violet-200',
    ready: 'border-emerald-400/40 text-emerald-200',
    completed: 'border-white/20 text-sage-300',
    cancelled: 'border-red-400/40 text-red-200',
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${styles[status] ?? 'border-white/20 text-sage-300'}`}>
      {status}
    </span>
  );
}
