import { expect, it } from "vitest";
import type { Product } from "./models";
import { matchesProductSearch } from "./product-search";

const product: Product = {
  id: "product-1",
  title: "Mesa de jantar",
  description: "Madeira maciça para a sala de jantar",
  department: "Mesas e cadeiras",
  price: 250,
  width: 120,
  height: 75,
  image: "/mesa.png",
  featured: false,
  ironColors: [],
  woodColors: [],
  woodTypes: [],
  upholsteryColors: [],
};

it("finds products without requiring accents or exact word order", () => {
  expect(matchesProductSearch(product, "JANTAR mesa")).toBe(true);
  expect(matchesProductSearch(product, "macica madeira")).toBe(true);
});

it("matches category and description and ignores empty search terms", () => {
  expect(matchesProductSearch(product, "mesas cadeiras")).toBe(true);
  expect(matchesProductSearch(product, "   ")).toBe(true);
  expect(matchesProductSearch(product, "estante")).toBe(false);
});
