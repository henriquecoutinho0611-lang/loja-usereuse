import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import type { Product, ProductSelection } from "../../app/models";
import { cartLineKey } from "./cartTypes";
import type { CartLine } from "./cartTypes";
import { hasRequiredSelections, readSavedCart, isUuid } from "./cartUtils";

type AddItemResult = "added" | "invalid-product" | "missing-options";

interface CartContextValue {
  items: CartLine[];
  setItems: Dispatch<SetStateAction<CartLine[]>>;
  itemCount: number;
  total: number;
  addItem: (product: Product, selection: ProductSelection) => AddItemResult;
  setQuantity: (key: string, value: number) => void;
  removeItem: (key: string) => void;
  updateSelection: (key: string, field: keyof ProductSelection, value: string | null) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartLine[]>(readSavedCart);

  useEffect(() => {
    localStorage.setItem("loja_cart", JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    setItems,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0),
    addItem(product, selection) {
      if (!isUuid(product.id)) return "invalid-product";
      if (!hasRequiredSelections(product, selection)) return "missing-options";
      setItems((current) => {
        const key = `${product.id}:${JSON.stringify(selection)}`;
        const existing = current.find((line) => cartLineKey(line) === key);
        return existing
          ? current.map((line) => cartLineKey(line) === key ? { ...line, quantity: Math.min(99, line.quantity + 1) } : line)
          : [...current, { product, quantity: 1, selection }];
      });
      return "added";
    },
    setQuantity(key, value) {
      const quantity = Math.max(1, Math.min(99, Math.floor(Number(value) || 1)));
      setItems((current) => current.map((line) => cartLineKey(line) === key ? { ...line, quantity } : line));
    },
    removeItem(key) {
      setItems((current) => current.filter((line) => cartLineKey(line) !== key));
    },
    updateSelection(key, field, value) {
      setItems((current) => {
        const updated = current.map((line) => cartLineKey(line) === key
          ? { ...line, selection: { ...line.selection, [field]: value } }
          : line);
        return updated.reduce<CartLine[]>((merged, line) => {
          const index = merged.findIndex((item) => cartLineKey(item) === cartLineKey(line));
          const existing = merged[index];
          if (existing) {
            merged[index] = { ...existing, quantity: Math.min(99, existing.quantity + line.quantity) };
          } else {
            merged.push(line);
          }
          return merged;
        }, []);
      });
    },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart precisa ser usado dentro de CartProvider.");
  return cart;
}
