"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CardCondition } from "@/lib/conditions";

export type CartItem = {
  slug: string;
  name: string;
  setName: string;
  condition: CardCondition;
  conditionLabel: string;
  marketPriceCents: number | null;
  imageUrl: string | null;
  gradient: string;
  quantity: number;
};

type AddToCartInput = Omit<CartItem, "quantity">;

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  addItem: (item: AddToCartInput) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
  lineId: (slug: string, condition: CardCondition) => string;
};

const STORAGE_KEY = "pokecell-cart";
const CartContext = createContext<CartContextValue | null>(null);

export function cartLineId(slug: string, condition: CardCondition = "NM"): string {
  return `${slug}:${condition}`;
}

function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry): CartItem | null => {
        if (
          !entry ||
          typeof entry !== "object" ||
          typeof entry.slug !== "string" ||
          typeof entry.name !== "string" ||
          typeof entry.setName !== "string" ||
          typeof entry.gradient !== "string" ||
          typeof entry.quantity !== "number"
        ) {
          return null;
        }

        const condition =
          typeof entry.condition === "string" ? entry.condition : "NM";
        const conditionLabel =
          typeof entry.conditionLabel === "string"
            ? entry.conditionLabel
            : condition;

        return {
          slug: entry.slug,
          name: entry.name,
          setName: entry.setName,
          condition: condition as CardCondition,
          conditionLabel,
          marketPriceCents:
            typeof entry.marketPriceCents === "number"
              ? entry.marketPriceCents
              : null,
          imageUrl: typeof entry.imageUrl === "string" ? entry.imageUrl : null,
          gradient: entry.gradient,
          quantity: Math.max(1, Math.floor(entry.quantity)),
        };
      })
      .filter((item): item is CartItem => item !== null);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return parseStoredCart(window.localStorage.getItem(STORAGE_KEY));
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: AddToCartInput) => {
    setItems((current) => {
      const id = cartLineId(item.slug, item.condition);
      const existingIndex = current.findIndex(
        (entry) => cartLineId(entry.slug, entry.condition) === id,
      );
      if (existingIndex === -1) return [...current, { ...item, quantity: 1 }];

      return current.map((entry, index) =>
        index === existingIndex
          ? {
              ...entry,
              quantity: entry.quantity + 1,
              marketPriceCents: item.marketPriceCents,
            }
          : entry,
      );
    });
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter(
          (item) => cartLineId(item.slug, item.condition) !== lineId,
        );
      }

      return current.map((item) =>
        cartLineId(item.slug, item.condition) === lineId
          ? { ...item, quantity: Math.floor(quantity) }
          : item,
      );
    });
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((current) =>
      current.filter((item) => cartLineId(item.slug, item.condition) !== lineId),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalCents = items.reduce(
      (sum, item) => sum + (item.marketPriceCents ?? 0) * item.quantity,
      0,
    );

    return {
      items,
      itemCount,
      subtotalCents,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      lineId: cartLineId,
    };
  }, [addItem, clearCart, items, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
