import { expect, it, vi } from "vitest";
import type { Product } from "../../app/models";
import { EMPTY_SELECTION, hasRequiredSelections, isUuid, readSavedCart } from "./cartUtils";
import { cartLineKey } from "./cartTypes";

const product: Product = {
  id: "d14e65bb-35b4-40a6-8bb5-e1730df1e014",
  title: "Mesa",
  description: "",
  department: "Mesas",
  price: 100,
  width: 100,
  height: 80,
  image: "",
  featured: false,
  ironColors: ["Preto"],
  woodColors: [],
  woodTypes: [],
  upholsteryColors: [],
};

it("validates product identifiers and required finish choices", () => {
  expect(isUuid(product.id)).toBe(true);
  expect(isUuid("demo-product")).toBe(false);
  expect(hasRequiredSelections(product, EMPTY_SELECTION)).toBe(false);
  expect(hasRequiredSelections(product, { ...EMPTY_SELECTION, ironColor: "Preto" })).toBe(true);
});

it("generates deterministic cart line keys regardless of selection property order", () => {
  const lineA = {
    product,
    quantity: 1,
    selection: { ironColor: "Preto", woodColor: "Natural", woodType: null, upholsteryColor: null },
  };
  const lineB = {
    product,
    quantity: 2,
    selection: { upholsteryColor: null, woodType: null, woodColor: "Natural", ironColor: "Preto" },
  };
  expect(cartLineKey(lineA)).toBe(cartLineKey(lineB));
  expect(cartLineKey(lineA)).toBe(`${product.id}:Preto|Natural||`);
});

it("restores only valid cart lines from local storage", () => {
  const savedValues = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => savedValues.get(key) ?? null,
    setItem: (key: string, value: string) => savedValues.set(key, value),
  });
  try {
    savedValues.set("loja_cart", JSON.stringify([
      { product, quantity: 2, selection: { ironColor: "Preto" } },
      { product, quantity: 0 },
      { product, quantity: 0.5 },
      { product: { id: product.id }, quantity: 1 },
      { product, quantity: 150 },
      null,
    ]));

    expect(readSavedCart()).toEqual([
      {
        product,
        quantity: 2,
        selection: { ...EMPTY_SELECTION, ironColor: "Preto" },
      },
      {
        product,
        quantity: 99,
        selection: EMPTY_SELECTION,
      },
    ]);

    savedValues.set("loja_cart", "invalid json");
    expect(readSavedCart()).toEqual([]);
  } finally {
    vi.unstubAllGlobals();
  }
});
