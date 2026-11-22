import type { Product } from "./models";

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function matchesProductSearch(product: Product, query: string): boolean {
  const terms = normalizeSearchText(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;

  const searchableText = normalizeSearchText(`${product.title} ${product.department} ${product.description}`);
  return terms.every((term) => searchableText.includes(term));
}
