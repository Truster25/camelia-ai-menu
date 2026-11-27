/** Shared dish presentation helpers. */

export const toneClasses: Record<string, string> = {
  green: 'from-[#3f5537] via-[#2c3f2e] to-[#16241b]',
  amber: 'from-[#8a6636] via-[#5c4527] to-[#241a10]',
  brown: 'from-[#6b5044] via-[#43322a] to-[#1d1512]',
  rose: 'from-[#7a4547] via-[#4a2b2d] to-[#1d1213]',
};

export const toneGlow: Record<string, string> = {
  green: 'rgba(143, 176, 108, 0.35)',
  amber: 'rgba(237, 155, 54, 0.35)',
  brown: 'rgba(186, 142, 113, 0.35)',
  rose: 'rgba(214, 122, 122, 0.35)',
};

const SPICE_KEYS = ['spice.none', 'spice.mild', 'spice.medium', 'spice.hot'];

export const occasionLabels: Record<string, string> = {
  'quick-bite': 'Quick bite',
  casual: 'Casual',
  date: 'Date night',
  celebration: 'Celebration',
  family: 'Family',
};

/** A dish's own spice level, translated. `t` is the active language's translate function. */
export function spiceLabel(level: number, t: (key: string) => string): string {
  return t(SPICE_KEYS[level] ?? 'spice.mild');
}

export function dietaryLabels(
  dish: {
    is_vegetarian: boolean;
    is_vegan: boolean;
    is_halal: boolean;
    is_gluten_free: boolean;
  },
  t: (key: string) => string,
): string[] {
  const labels: string[] = [];
  if (dish.is_vegan) labels.push(t('dietary.vegan'));
  else if (dish.is_vegetarian) labels.push(t('dietary.vegetarian'));
  if (dish.is_halal) labels.push(t('dietary.halal'));
  if (dish.is_gluten_free) labels.push(t('dietary.glutenFree'));
  return labels;
}

export function formatSpice(level: number): string {
  return '🌶'.repeat(Math.max(level, 0)) || '—';
}
