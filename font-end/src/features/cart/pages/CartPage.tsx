import type { CartLine } from "../cartTypes";
import { CartItem } from "../components/CartItem";

interface CartPageProps {
  items: CartLine[];
  itemCount: number;
  total: number;
  imageUrl: (path: string | null | undefined) => string;
  money: (value: number | null | undefined) => string;
  itemKey: (line: CartLine) => string;
  onHome: () => void;
  onSelectProduct: (line: CartLine) => void;
  onQuantityChange: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
  onCheckout: () => void;
}

export function CartPage({
  items,
  itemCount,
  total,
  imageUrl,
  money,
  itemKey,
  onHome,
  onSelectProduct,
  onQuantityChange,
  onRemove,
  onCheckout,
}: CartPageProps) {
  return (
    <section className="form-page cart-page">
      <button className="back-link" onClick={onHome}>← Voltar para a loja</button>
      <div className="eyebrow"><span className="eyebrow-line"></span>SUA SELEÇÃO</div>
      <h1>Sacola de compras</h1>
      {items.length ? (
        <div className="cart-layout">
          <div className="cart-lines">
            {items.map((line) => (
              <CartItem
                key={itemKey(line)}
                line={line}
                imageUrl={imageUrl}
                money={money}
                itemKey={itemKey}
                onSelect={onSelectProduct}
                onQuantityChange={onQuantityChange}
                onRemove={onRemove}
              />
            ))}
          </div>
          <aside className="cart-summary">
            <div className="eyebrow"><span className="eyebrow-line"></span>RESUMO</div>
            <div className="summary-row">
              <span>{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
              <b>{money(total)}</b>
            </div>
            <div className="summary-total"><span>Subtotal</span><b>{money(total)}</b></div>
            <small>Frete e prazo serão confirmados com a loja.</small>
            <button className="button button-dark cart-checkout-button" onClick={onCheckout}>
              Continuar para entrega →
            </button>
          </aside>
        </div>
      ) : (
        <div className="cart-empty">
          <span>sua sacola está vazia</span>
          <p>Veja os móveis disponíveis e adicione os que gostar.</p>
          <button className="button button-dark" onClick={onHome}>Ver produtos →</button>
        </div>
      )}
    </section>
  );
}
