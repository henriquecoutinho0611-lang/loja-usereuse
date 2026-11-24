import type { Product } from "../../../app/models";
import { storeApi } from "../../../services/api";

function formatPrice(value: number | null | undefined): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

export function ProductCard({
  product,
  onSelect,
  onWishlist,
}: {
  product: Product;
  onSelect: (product: Product) => void;
  onWishlist?: () => void;
}) {
  return (
    <article className="product-card">
      <button className="product-image" onClick={() => onSelect(product)} aria-label={`Ver ${product.title}`}>
        <img src={storeApi.imageUrl(product.image)} alt={product.title} loading="lazy" />
        <span className="product-badge">{product.featured ? "Em destaque" : "Móvel industrial"}</span>
        <span className="quick-view">Ver produto →</span>
      </button>
      {onWishlist ? <button className="wishlist-button" aria-label={`Favoritar ${product.title}`} onClick={onWishlist}>☆</button> : null}
      <div className="product-info">
        <div className="product-category">{product.department}</div>
        <button className="product-title" onClick={() => onSelect(product)}>{product.title}</button>
        {onWishlist ? <div className="rating">★★★★★ <span>Design industrial</span></div> : null}
        <div className="price-line">
          {product.oldPrice ? <span className="old-price">{formatPrice(product.oldPrice)}</span> : null}
          <strong>{formatPrice(product.price)}</strong>
        </div>
      </div>
    </article>
  );
}
