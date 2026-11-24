import type { Product, ProductSelection } from "../../app/models";

export interface CartLine {
  product: Product;
  quantity: number;
  selection: ProductSelection;
}

/** Chave estável e determinística: ordena as propriedades da seleção
 *  em ordem fixa para que o mesmo item gere sempre o mesmo hash,
 *  independentemente da ordem de criação do objeto. */
export function cartLineKey(line: CartLine): string {
  const { ironColor, woodColor, woodType, upholsteryColor } = line.selection;
  const sel = `${ironColor ?? ""}|${woodColor ?? ""}|${woodType ?? ""}|${upholsteryColor ?? ""}`;
  return `${line.product.id}:${sel}`;
}
