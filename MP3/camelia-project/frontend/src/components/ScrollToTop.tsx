import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Restores the top of the page on navigation (the browser keeps the old scroll otherwise). */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}
