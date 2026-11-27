import { useMemo, useRef, useState } from 'react';
import { Download, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { EmptyState } from '../ui';

const STORAGE_KEY = 'camelia.admin.tableLabels';
const DEFAULT_LABELS = Array.from({ length: 12 }, (_, index) => String(index + 1)).join(',');

function readLabels(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_LABELS;
  } catch {
    return DEFAULT_LABELS;
  }
}

/**
 * A QR code per table, each encoding this site's own menu URL with that
 * table pre-filled (?table=<label>). Generated entirely in the browser —
 * nothing is sent to the API, so there is no table list on the backend to
 * keep in sync. The label list itself is just a browser convenience,
 * remembered per admin in localStorage.
 */
export function TableQrCodes() {
  const [raw, setRaw] = useState(readLabels);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const origin = window.location.origin;

  const labels = useMemo(
    () => Array.from(new Set(raw.split(',').map((label) => label.trim()).filter(Boolean))),
    [raw],
  );

  const save = (value: string) => {
    setRaw(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Nothing to do: the list still holds for this session.
    }
  };

  const download = (label: string) => {
    const canvas = canvasRefs.current[label];
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `camelia-table-${label}.png`;
    link.click();
  };

  return (
    <div className="mt-8 space-y-5">
      <div className="card p-5">
        <h2 className="font-display text-xl">Table QR codes</h2>
        <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-sage-400">
          Each code opens the menu with that table already filled in, so a guest who scans it
          at checkout never has to type a table number. Download and print one per table.
        </p>
        <p className="mt-3 rounded-lg border border-amber-soft/25 bg-amber-logo/10 px-3 py-2 text-[11px] leading-relaxed text-amber-pale">
          These codes point at <span className="font-mono">{origin}</span>. Generate the ones
          you actually print from the live site, not from a laptop preview — a code made here
          would send guests to this address instead.
        </p>
        <div className="mt-4">
          <label className="label" htmlFor="table-labels">Table labels (comma separated)</label>
          <input
            id="table-labels"
            className="field"
            defaultValue={raw}
            onBlur={(event) => save(event.target.value)}
            placeholder="1,2,3,4,Patio 1,Bar"
          />
        </div>
      </div>

      {labels.length === 0 ? (
        <EmptyState icon={<QrCode size={22} />} title="No tables yet" body="Add at least one table label above." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {labels.map((label) => {
            const url = `${origin}/menu?table=${encodeURIComponent(label)}`;
            return (
              <div key={label} className="card flex flex-col items-center gap-3 p-5 text-center">
                <p className="text-[10px] uppercase tracking-[0.16em] text-amber-soft">Table</p>
                <p className="font-display text-lg text-sage-100">{label}</p>
                <div className="rounded-xl bg-white p-3">
                  <QRCodeCanvas
                    value={url}
                    size={160}
                    level="M"
                    marginSize={0}
                    ref={(el) => {
                      canvasRefs.current[label] = el;
                    }}
                  />
                </div>
                <p className="w-full truncate text-[10px] text-sage-500" title={url}>{url}</p>
                <button onClick={() => download(label)} className="btn-quiet !text-[10px]">
                  <Download size={13} /> Download PNG
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
