import type { Product, ProductSelection } from "../../app/models";
import type { CartLine } from "./cartTypes";

export const EMPTY_SELECTION: ProductSelection = {
  ironColor: null,
  woodColor: null,
  woodType: null,
  upholsteryColor: null,
};

const PRODUCT_OPTION_FIELDS = [
  { field: "ironColors", selection: "ironColor" },
  { field: "woodColors", selection: "woodColor" },
  { field: "woodTypes", selection: "woodType" },
  { field: "upholsteryColors", selection: "upholsteryColor" },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isProduct(value: unknown): value is Product {
  return isRecord(value)
    && typeof value["id"] === "string"
    && typeof value["title"] === "string"
    && typeof value["description"] === "string"
    && typeof value["department"] === "string"
    && typeof value["price"] === "number"
    && Number.isFinite(value["price"])
    && (value["oldPrice"] === undefined || value["oldPrice"] === null
      || (typeof value["oldPrice"] === "number" && Number.isFinite(value["oldPrice"])))
    && typeof value["width"] === "number"
    && Number.isFinite(value["width"])
    && typeof value["height"] === "number"
    && Number.isFinite(value["height"])
    && typeof value["image"] === "string"
    && typeof value["featured"] === "boolean"
    && (value["active"] === undefined || typeof value["active"] === "boolean")
    && (value["ambientImage"] === undefined || value["ambientImage"] === null || typeof value["ambientImage"] === "string")
    && isStringArray(value["ironColors"])
    && isStringArray(value["woodColors"])
    && isStringArray(value["woodTypes"])
    && isStringArray(value["upholsteryColors"]);
}

function readSelection(value: unknown): ProductSelection {
  if (!isRecord(value)) return EMPTY_SELECTION;
  return {
    ironColor: typeof value["ironColor"] === "string" ? value["ironColor"] : null,
    woodColor: typeof value["woodColor"] === "string" ? value["woodColor"] : null,
    woodType: typeof value["woodType"] === "string" ? value["woodType"] : null,
    upholsteryColor: typeof value["upholsteryColor"] === "string" ? value["upholsteryColor"] : null,
  };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function hasRequiredSelections(product: Product, selection: ProductSelection): boolean {
  return PRODUCT_OPTION_FIELDS.every(({ field, selection: key }) => {
    const options = product[field] || [];
    return options.length === 0 || (selection[key] !== null && options.includes(selection[key] || ""));
  });
}

export function readSavedCart(): CartLine[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem("loja_cart") || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.flatMap((item: unknown) => {
      if (!isRecord(item) || !isProduct(item["product"]) || !("quantity" in item)) return [];
      const quantity = Math.floor(Number(item["quantity"]));
      if (!Number.isFinite(quantity) || quantity < 1) return [];
      return [{
        product: item["product"],
        quantity: Math.min(99, quantity),
        selection: readSelection(item["selection"]),
      }];
    });
  } catch {
    return [];
  }
}
