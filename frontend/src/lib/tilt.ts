import type { PointerEvent } from 'react';

const tiltMedia = '(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference)';

function moveTilt(event: PointerEvent<HTMLElement>) {
  if (event.pointerType === 'touch' || !window.matchMedia(tiltMedia).matches) {
    resetTilt(event);
    return;
  }

  const target = event.currentTarget;
  const bounds = target.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;

  const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
  const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
  target.style.setProperty('--tilt-x', `${(0.5 - y) * 14}deg`);
  target.style.setProperty('--tilt-y', `${(x - 0.5) * 14}deg`);
  target.style.setProperty('--tilt-light-x', `${x * 100}%`);
  target.style.setProperty('--tilt-light-y', `${y * 100}%`);
  target.dataset.tilting = '';
}

function resetTilt({ currentTarget }: PointerEvent<HTMLElement>) {
  delete currentTarget.dataset.tilting;
}

export const tiltEvents = {
  onPointerMove: moveTilt,
  onPointerLeave: resetTilt,
  onPointerCancel: resetTilt,
};
