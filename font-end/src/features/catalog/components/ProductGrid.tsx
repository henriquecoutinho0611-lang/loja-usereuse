import type { Product } from "../../../app/models";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  onSelect,
  onWishlist,
  className = "product-grid",
}: {
  products: Product[];
  onSelect: (product: Product) => void;
  onWishlist?: (product: Product) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={onSelect}
          onWishlist={onWishlist ? () => onWishlist(product) : undefined}
        />
      ))}
    </div>
  );
}
