import type { FormEvent } from "react";
import type { Product, ProductSelection, ShippingQuote } from "../../../app/models";
import { storeApi } from "../../../services/api";
import { ProductSelectionFields } from "../components/ProductSelectionFields";
import { ProductPage } from "./ProductPage";

export function ProductDetailPage({
  product,
  relatedProducts,
  selection,
  shippingZip,
  shippingResult,
  shippingBusy,
  imageUrl,
  money,
  onBack,
  onSelectionChange,
  onAddToCart,
  onCheckout,
  onShippingZipChange,
  onCalculateShipping,
  onSelectRelated,
}: {
  product: Product;
  relatedProducts: Product[];
  selection: ProductSelection;
  shippingZip: string;
  shippingResult: ShippingQuote | null;
  shippingBusy: boolean;
  imageUrl: (path: string | null | undefined) => string;
  money: (amount: number | null | undefined) => string;
  onBack: () => void;
  onSelectionChange: (field: keyof ProductSelection, value: string | null) => void;
  onAddToCart: () => void;
  onCheckout: () => void;
  onShippingZipChange: (value: string) => void;
  onCalculateShipping: (event: FormEvent<HTMLFormElement>) => void;
  onSelectRelated: (product: Product) => void;
}) {
  return (
    <section className="detail-page">
      <button className="back-link" onClick={onBack}>← Voltar para a loja</button>
      <div className="detail-layout">
        <div className="detail-image">
          <img src={imageUrl(product.image)} alt={product.title} />
          {product.ambientImage ? <img className="detail-ambient-photo" src={imageUrl(product.ambientImage)} alt={`${product.title} em ambiente`} /> : null}
        </div>
        <div className="detail-info">
          <div className="eyebrow"><span className="eyebrow-line"></span>{product.department}</div>
          <h1>{product.title}</h1>
          <div className="rating detail-rating">★★★★★ <span>Peça selecionada</span></div>
          <div className="detail-price">{product.oldPrice ? <span className="old-price">{money(product.oldPrice)}</span> : null}<strong>{money(product.price)}</strong></div>
          <p className="detail-description">{product.description}</p>
          <ProductSelectionFields
            product={product}
            selection={selection}
            heading="Escolha as opções deste produto"
            onChange={onSelectionChange}
          />
          <ProductPage product={product} />
          <div className="product-buy-actions">
            <button className="button button-outline" onClick={onAddToCart}>Adicionar à sacola</button>
            <button className="button button-dark buy-button" onClick={onCheckout}>Comprar agora <span>→</span></button>
          </div>
          <div className="shipping-box">
            <div className="shipping-title"><span>⌖</span><span>Consulte o frete e a região de entrega</span></div>
            <form onSubmit={onCalculateShipping}>
              <input value={shippingZip} onChange={(event) => onShippingZipChange(event.currentTarget.value)} inputMode="numeric" maxLength={9} autoComplete="postal-code" placeholder="00000-000" aria-label="CEP para cálculo de frete" />
              <button disabled={shippingBusy}>{shippingBusy ? "Consultando..." : "Consultar"}</button>
            </form>
            <a className="text-link zip-link" href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noreferrer">Não sei meu CEP</a>
            {shippingResult ? (
              <div className="shipping-result">
                <strong>{shippingResult.city} — {shippingResult.state}</strong>
                {shippingResult.price != null ? <span>Frete: {money(shippingResult.price)}</span> : null}
                {shippingResult.estimatedDays != null ? <span>Prazo estimado: {shippingResult.estimatedDays} dias</span> : null}
                <small>{shippingResult.message}</small>
              </div>
            ) : null}
          </div>
          <div className="secure-note">✓ Compra segura <span></span> Atendimento humanizado</div>
        </div>
      </div>
      {relatedProducts.length ? (
        <section className="related-section">
          <div className="related-heading"><div><div className="eyebrow"><span className="eyebrow-line"></span>RECOMENDADOS PARA VOCÊ</div><h2>Produtos relacionados</h2><p>Outros móveis de {product.department.toLocaleLowerCase("pt-BR")}.</p></div></div>
          <div className="related-grid">
            {relatedProducts.slice(0, 3).map((relatedProduct) => (
              <article key={relatedProduct.id} className="product-card">
                <button className="product-image" onClick={() => onSelectRelated(relatedProduct)} aria-label={`Ver ${relatedProduct.title}`}>
                  <img src={storeApi.imageUrl(relatedProduct.image)} alt={relatedProduct.title} loading="lazy" />
                </button>
                <div className="product-info"><div className="product-category">{relatedProduct.department}</div><button className="product-title" onClick={() => onSelectRelated(relatedProduct)}>{relatedProduct.title}</button><strong>{money(relatedProduct.price)}</strong></div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
