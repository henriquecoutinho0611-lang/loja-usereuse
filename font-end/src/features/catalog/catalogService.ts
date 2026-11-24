import type { Product } from "../../app/models";

export interface ProductFilters {
  material: string;
  minPrice: string;
  maxPrice: string;
  maxWidth: string;
  maxHeight: string;
}

export const EMPTY_PRODUCT_FILTERS: ProductFilters = {
  material: "",
  minPrice: "",
  maxPrice: "",
  maxWidth: "",
  maxHeight: "",
};

function getMaterials(product: Product): string[] {
  const text = `${product.title} ${product.description}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const materials: string[] = [];

  if (product.ironColors.length || /\baco\b|\bmetal\b|\bferro\b/.test(text)) materials.push("Aço");
  if (product.woodTypes.length || product.woodColors.length || /\bmadeira\b|\bmdf\b/.test(text)) materials.push("Madeira");
  if (product.upholsteryColors.length || /\bestofad[oa]\b|\btecido\b/.test(text)) materials.push("Estofado");

  return materials;
}

export function productMaterialOptions(products: Product[]): string[] {
  return [...new Set(products.flatMap(getMaterials))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function matchesProductFilters(product: Product, filters: ProductFilters): boolean {
  const minPrice = filters.minPrice === "" ? null : Number(filters.minPrice);
  const maxPrice = filters.maxPrice === "" ? null : Number(filters.maxPrice);
  const maxWidth = filters.maxWidth === "" ? null : Number(filters.maxWidth);
  const maxHeight = filters.maxHeight === "" ? null : Number(filters.maxHeight);

  if (filters.material && !getMaterials(product).includes(filters.material)) return false;
  if (minPrice !== null && product.price < minPrice) return false;
  if (maxPrice !== null && product.price > maxPrice) return false;
  if (maxWidth !== null && product.width > maxWidth) return false;

  return maxHeight === null || product.height <= maxHeight;
}
