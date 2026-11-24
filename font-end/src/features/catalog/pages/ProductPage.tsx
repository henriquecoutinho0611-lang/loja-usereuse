import type { Product } from "../../../app/models";
import { productMaterialOptions } from "../catalogService";

export function ProductPage({ product }: { product: Product }) {
  const finishes = [
    ...product.woodTypes,
    ...product.woodColors,
    ...product.ironColors,
    ...product.upholsteryColors,
  ];

  return (
    <section className="product-specification-list" aria-label="Detalhes do produto">
      <div className="dimension-box">
        <span>Dimensões aproximadas</span>
        <b>{product.width} cm <i>largura</i> <span>×</span> {product.height} cm <i>altura</i></b>
      </div>
      <dl className="product-specifications">
        <div><dt>Materiais</dt><dd>{productMaterialOptions([product]).join(" + ") || "Consulte a loja"}</dd></div>
        <div><dt>Acabamento</dt><dd>{finishes.join(", ") || "Consulte as opções disponíveis"}</dd></div>
        <div><dt>Disponibilidade</dt><dd>{product.active === false ? "Indisponível" : "Confirme a disponibilidade com a loja"}</dd></div>
        <div><dt>Prazo</dt><dd>Consulte o prazo de fabricação e entrega</dd></div>
      </dl>
    </section>
  );
}
