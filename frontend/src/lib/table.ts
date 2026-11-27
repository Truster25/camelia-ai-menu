/**
 * The table number a guest carries in from a table's QR code.
 *
 * A QR code on the table links to e.g. `/menu?table=5`. The query string
 * only survives that first page load — client-side navigation to the dish
 * page, then the cart, drops it — so it is captured once, as early as
 * possible, into sessionStorage and read back wherever the table number is
 * needed (the cart, and a small confirmation banner on the menu). Session
 * storage, not local storage: this is about the current visit, not a
 * standing preference, and it should not follow the guest home.
 */
const STORAGE_KEY = 'camelia_table';

export function captureTableFromUrl(search: string = window.location.search): void {
  const value = new URLSearchParams(search).get('table');
  if (value === null) return;
  const trimmed = value.trim().slice(0, 20);
  try {
    if (trimmed) sessionStorage.setItem(STORAGE_KEY, trimmed);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked in private mode; the table just won't be remembered.
  }
}

export function getSavedTable(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function clearSavedTable(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
