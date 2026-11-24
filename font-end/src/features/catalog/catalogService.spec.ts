import { expect, it } from "vitest";
import type { Product } from "../../app/models";
import { matchesProductFilters, productMaterialOptions, EMPTY_PRODUCT_FILTERS } from "./catalogService";

const product: Product = {
  id: "mesa-1",
  title: "Mesa industrial",
  description: "Estrutura de aço e tampo de madeira maciça",
  department: "Mesas",
  price: 850,
  width: 120,
  height: 75,
  image: "/mesa.jpg",
  featured: false,
  ironColors: ["Preto"],
  woodColors: ["Natural"],
  woodTypes: ["Maciça"],
  upholsteryColors: [],
};

it("detects available materials from product options and description", () => {
  expect(productMaterialOptions([product])).toEqual(["Aço", "Madeira"]);
});

it("filters products by material, price and dimensions", () => {
  expect(matchesProductFilters(product, {
    ...EMPTY_PRODUCT_FILTERS,
    material: "Madeira",
    minPrice: "500",
    maxPrice: "900",
    maxWidth: "130",
    maxHeight: "80",
  })).toBe(true);

  expect(matchesProductFilters(product, { ...EMPTY_PRODUCT_FILTERS, maxPrice: "800" })).toBe(false);
  expect(matchesProductFilters(product, { ...EMPTY_PRODUCT_FILTERS, maxWidth: "100" })).toBe(false);
});
