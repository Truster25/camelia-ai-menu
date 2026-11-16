import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Scroll scene.
 *
 * The difference between a reveal and a scene is who is in charge. A reveal
 * fires once when an element arrives and is over in half a second. A scene is
 * driven by the scroll position itself, continuously: as you move down the page
 * the section travels through its own small animation, and you are the one
 * holding the crank.
 *
 * That is why it reads like a camera move rather than a notification. Stop
 * scrolling and the section stops where you left it. Scroll back and it plays
 * backwards. There is nothing to wait for.
 *
 * How far it travels is measured against the viewport, not the section, so a
 * tall section and a short one move at the same apparent speed.
 *
 * Performance: the transform is written straight to the DOM in a rAF callback
 * rather than through React state. Re-rendering a whole section on every scroll
 * event would drop frames on a phone, which is exactly where this effect is
 * most visible and least forgiving.
 */
export type SceneKind =
  | 'rise' // drifts up as you enter, settles at the centre
  | 'zoom' // starts slightly small and pushes in
  | 'pan' // slides in from the side
  | 'depth'; // slow vertical drift, foreground feels further back

export function ScrollScene({
  children,
  kind = 'rise',
  strength = 1,
  className = '',
  id,
}: {
  children: ReactNode;
  kind?: SceneKind;
  /** Multiplier on the travel distance. 1 is the calibrated default. */
  strength?: number;
  className?: string;
  id?: string;
}) {
  const outer = useRef<HTMLDivElement | null>(null);
  const inner = useRef<HTMLDivElement | null>(null);
  const [reduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (reduced) return;
    const outerEl = outer.current;
    const innerEl = inner.current;
    if (!outerEl || !innerEl) return;

    let frame = 0;
    let last = -1;

    const paint = () => {
      frame = 0;
      const box = outerEl.getBoundingClientRect();
      const vh = window.innerHeight;

      // 0 when the section's top is at the bottom of the screen (just entering),
      // 1 when its top has reached the top of the screen. Clamped both ways so
      // the scene holds at its end states rather than overshooting.
      const raw = (vh - box.top) / (vh + box.height * 0.35);
      const p = Math.min(1, Math.max(0, raw));
      if (Math.abs(p - last) < 0.0015) return;
      last = p;

      // ease-out so the movement is quickest as it enters and settles as it
      // reaches reading position, which is where the eye rests.
      const eased = 1 - Math.pow(1 - p, 3);
      const travel = vh * 0.16 * strength;
      const inv = 1 - eased;

      switch (kind) {
        case 'zoom': {
          const scale = 0.94 + eased * 0.06;
          innerEl.style.transform = `translate3d(0, ${inv * travel * 0.55}px, 0) scale(${scale})`;
          break;
        }
        case 'pan': {
          const x = inv * vh * 0.06 * strength;
          innerEl.style.transform = `translate3d(${x}px, ${inv * travel * 0.35}px, 0)`;
          break;
        }
        case 'depth': {
          innerEl.style.transform = `translate3d(0, ${inv * travel * 1.5}px, 0)`;
          break;
        }
        case 'rise':
        default: {
          innerEl.style.transform = `translate3d(0, ${inv * travel}px, 0)`;
          break;
        }
      }
      innerEl.style.opacity = String(0.25 + eased * 0.75);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [kind, strength, reduced]);

  return (
    <div ref={outer} id={id} className={className}>
      <div
        ref={inner}
        style={
          reduced
            ? undefined
            : { willChange: 'transform, opacity', transform: 'translate3d(0,0,0)' }
        }
      >
        {children}
      </div>
    </div>
  );
}
