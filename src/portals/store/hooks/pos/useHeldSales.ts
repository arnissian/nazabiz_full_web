import { useState, useCallback } from 'react';
import type { POSCartItem } from '../../types/pos';

export interface HeldSale {
  id: string;
  cart: POSCartItem[];
  customer: { id: string; name: string; phone: string } | null;
  selectedCustomerId: string;
  globalDiscount: number;
  taxRate: number;
  heldAt: string;
  label: string;
  total: number;
}

const STORAGE_KEY = 'pos-held-sales';

const loadHeldSales = (): HeldSale[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveHeldSales = (sales: HeldSale[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
};

export const useHeldSales = () => {
  const [heldSales, setHeldSales] = useState<HeldSale[]>(loadHeldSales);

  const holdSale = useCallback((data: Omit<HeldSale, 'id' | 'heldAt'>) => {
    const newSale: HeldSale = {
      ...data,
      id: 'held_' + Date.now(),
      heldAt: new Date().toISOString(),
    };
    const updated = [...loadHeldSales(), newSale];
    saveHeldSales(updated);
    setHeldSales(updated);
    return newSale;
  }, []);

  const deleteSale = useCallback((id: string) => {
    const updated = loadHeldSales().filter(s => s.id !== id);
    saveHeldSales(updated);
    setHeldSales(updated);
  }, []);

  const clearAll = useCallback(() => {
    saveHeldSales([]);
    setHeldSales([]);
  }, []);

  return {
    heldSales,
    holdSale,
    deleteSale,
    clearAll,
    count: heldSales.length,
  };
};
