import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scroll behaviour on navigation.
 *
 * Two jobs:
 *  - a normal link goes to the top of the new page;
 *  - a link that carries a hash (`/our-story#team`) goes to that element
 *    instead — which is how the footer's "Meet the team" and "Opening hours"
 *    links work.
 *
 * The hash target can be rendered a frame after the route changes, so the
 * lookup is retried briefly before giving up and leaving the page at the top.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }

    const id = decodeURIComponent(hash.replace('#', ''));
    let tries = 0;

    const jump = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (tries++ < 12) window.setTimeout(jump, 60);
    };

    jump();
  }, [pathname, hash]);

  return null;
}
