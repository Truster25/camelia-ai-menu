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

export const spiceLabels = ['No heat', 'Mild', 'Medium', 'Hot'];

export const occasionLabels: Record<string, string> = {
  'quick-bite': 'Quick bite',
  casual: 'Casual',
  date: 'Date night',
  celebration: 'Celebration',
  family: 'Family',
};

export function dietaryLabels(dish: {
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_halal: boolean;
  is_gluten_free: boolean;
}): string[] {
  const labels: string[] = [];
  if (dish.is_vegan) labels.push('Vegan');
  else if (dish.is_vegetarian) labels.push('Vegetarian');
  if (dish.is_halal) labels.push('Halal');
  if (dish.is_gluten_free) labels.push('Gluten free');
  return labels;
}

export function formatSpice(level: number): string {
  return '🌶'.repeat(Math.max(level, 0)) || '—';
}
