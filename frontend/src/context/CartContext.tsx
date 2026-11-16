import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CartLine, Dish } from '../lib/types';

type CartContextValue = {
  lines: CartLine[];
  count: number;
  total: number;
  add: (dish: Dish, quantity?: number) => void;
  setQuantity: (dishId: number, quantity: number) => void;
  remove: (dishId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'camelia_cart_v1';

function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed.filter((line) => line?.dish?.id) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const add = useCallback((dish: Dish, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((line) => line.dish.id === dish.id);
      if (existing) {
        return current.map((line) =>
          line.dish.id === dish.id ? { ...line, quantity: Math.min(line.quantity + quantity, 20) } : line,
        );
      }
      return [...current, { dish, quantity }];
    });
  }, []);

  const setQuantity = useCallback((dishId: number, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => line.dish.id !== dishId)
        : current.map((line) => (line.dish.id === dishId ? { ...line, quantity: Math.min(quantity, 20) } : line)),
    );
  }, []);

  const remove = useCallback((dishId: number) => {
    setLines((current) => current.filter((line) => line.dish.id !== dishId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const total = lines.reduce((sum, line) => sum + line.quantity * line.dish.price_rwf, 0);
    return { lines, count, total, add, setQuantity, remove, clear };
  }, [lines, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
