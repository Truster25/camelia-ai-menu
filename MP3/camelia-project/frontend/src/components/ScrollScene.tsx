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
 * ---------------------------------------------------------------------------
 * Timing
 * ---------------------------------------------------------------------------
 * The progress ramp is deliberately long. A short ramp finishes the movement in
 * the first few hundred pixels of scrolling, and then the section is static for
 * the rest of its life on screen: the motion is over before the eye arrives.
 * A long ramp means the section is still settling as it reaches the middle of
 * the screen, which is where the eye actually meets it.
 *
 * ---------------------------------------------------------------------------
 * Direction
 * ---------------------------------------------------------------------------
 * `dir` sets where the movement comes FROM. Mixing directions down the page,
 * rather than stacking everything upward, is what stops a long page reading as
 * one repeated gesture.
 *
 * ---------------------------------------------------------------------------
 * Parallax
 * ---------------------------------------------------------------------------
 * `parallax` lifts any element marked with `data-parallax` inside the scene and
 * moves it against the section, so the photograph and the words travel at
 * different speeds. That difference is what the eye reads as depth. It is
 * capped small on purpose: a few percent is plenty, more looks like the layout
 * is broken.
 *
 * Performance: transforms are written straight to the DOM inside rAF rather
 * than through React state. Re-rendering a whole section on every scroll event
 * drops frames on a phone, which is exactly where this effect is most visible
 * and least forgiving.
 */
export type SceneKind = 'rise' | 'zoom' | 'pan';
export type SceneDir = 'up' | 'down' | 'left' | 'right';

type Props = {
  children: ReactNode;
  kind?: SceneKind;
  dir?: SceneDir;
  /** Multiplier on travel distance. 1 is the calibrated default. */
  strength?: number;
  /** Lift `[data-parallax]` descendants against the section. 0 disables. */
  parallax?: number;
  className?: string;
  id?: string;
};

export function ScrollScene({
  children,
  kind = 'rise',
  dir = 'up',
  strength = 1,
  parallax = 0,
  className = '',
  id,
}: Props) {
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

    // Queried per paint, not once on mount. The dish tiles do not exist yet
    // when this effect first runs: they arrive from the API a moment later, so
    // a list captured on mount would be empty for ever. The subtree is small,
    // so re-reading it is cheaper than the bookkeeping needed to cache it.
    let layers: HTMLElement[] = [];

    let frame = 0;
    let last = -1;

    const paint = () => {
      frame = 0;
      const box = outerEl.getBoundingClientRect();
      const vh = window.innerHeight;

      // Long ramp: 0 when the top edge is still a full screen and a bit below
      // the fold, 1 once it has climbed past the top of the viewport. The
      // movement is therefore still in progress during the whole time the
      // section is crossing the screen, instead of finishing off-screen.
      const raw = (vh - box.top) / (vh * 1.55);
      const p = Math.min(1, Math.max(0, raw));
      if (Math.abs(p - last) < 0.0012) return;
      last = p;

      const eased = 1 - Math.pow(1 - p, 3);
      const inv = 1 - eased; // 1 = fully out of position, 0 = settled

      const vTravel = vh * 0.2 * strength;
      const hTravel = vh * 0.1 * strength;

      // Out-of-position offset, applied per direction.
      const ox = dir === 'left' ? -hTravel * inv : dir === 'right' ? hTravel * inv : 0;
      const oy = dir === 'down' ? -vTravel * inv : dir === 'up' ? vTravel * inv : 0;

      let scale = 1;
      if (kind === 'zoom') {
        // Fills the screen and shrinks into place: starts larger than the
        // layout and settles at 1, so it feels like the section comes toward
        // you and then sets down rather than growing out of nothing.
        scale = 1 + inv * 0.09;
      } else if (kind === 'pan') {
        scale = 1 + inv * 0.03;
      }

      innerEl.style.transform = `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      // Never fully transparent: a section that starts at zero reads as a blank
      // page while you are scrolling through it.
      innerEl.style.opacity = String(0.35 + eased * 0.65);

      if (parallax) {
        layers = Array.from(outerEl.querySelectorAll<HTMLElement>('[data-parallax]'));
      }
      if (layers.length) {
        // Move each layer against the section's own travel, scaled by its own
        // data-parallax value, so one scene can hold several depths.
        for (const el of layers) {
          const depth = parseFloat(el.dataset.parallax || '0');
          const y = (0.5 - p) * vh * 0.12 * depth;
          el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
        }
      }
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
  }, [kind, dir, strength, parallax, reduced]);

  return (
    // The clip belongs on the wrapper, not the moving layer. A transform does
    // not affect layout, but it does extend the document's scrollable area, so
    // the pushed-aside section widened the page by 125px and showed a
    // horizontal scrollbar. Clipping the wrapper's own overflow is what
    // contains it; clipping the inner layer only clips the layer's children,
    // which is not the same thing.
    <div ref={outer} id={id} className={className} style={{ overflowX: 'clip' }}>
      <div
        ref={inner}
        style={
          reduced
            ? undefined
            : {
                willChange: 'transform, opacity',
                transform: 'translate3d(0,0,0)',
              }
        }
      >
        {children}
      </div>
    </div>
  );
}
