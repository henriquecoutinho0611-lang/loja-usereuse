import type { FormEvent } from "react";
import type { AccountProfile, Product, ProductSelection, ShippingQuote, StoreSettings } from "../../../app/models";
import { ProductSelectionFields } from "../../catalog/components/ProductSelectionFields";
import type { CartLine } from "../../cart/cartTypes";
import type { OrderForm } from "../checkoutTypes";

interface CheckoutPageProps {
  product: Product | null;
  fromCart: boolean;
  cartItems: CartLine[];
  account: AccountProfile | null;
  orderForm: OrderForm;
  selection: ProductSelection;
  shipping: ShippingQuote | null;
  shippingBusy: boolean;
  submitting: boolean;
  optionsValid: boolean;
  total: number;
  storeSettings: StoreSettings;
  itemKey: (line: CartLine) => string;
  imageUrl: (path: string | null | undefined) => string;
  money: (value: number | null | undefined) => string;
  onBack: () => void;
  onGoToAccount: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onZipCodeChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onSelectionChange: (field: keyof ProductSelection, value: string | null) => void;
  onCartSelectionChange: (line: CartLine, field: keyof ProductSelection, value: string | null) => void;
  onCalculateShipping: () => void;
}

export function CheckoutPage({
  product,
  fromCart,
  cartItems,
  account,
  orderForm,
  selection,
  shipping,
  shippingBusy,
  submitting,
  optionsValid,
  total,
  storeSettings,
  itemKey,
  imageUrl,
  money,
  onBack,
  onGoToAccount,
  onSubmit,
  onZipCodeChange,
  onAddressChange,
  onQuantityChange,
  onSelectionChange,
  onCartSelectionChange,
  onCalculateShipping,
}: CheckoutPageProps) {
  if (!product) return null;

  const orderLines = fromCart ? cartItems : [{
    product,
    quantity: orderForm.quantity,
    selection,
  }];

  return (
    <section className="form-page checkout-page">
      <button className="back-link" onClick={onBack}>{fromCart ? "← Voltar à sacola" : "← Voltar ao produto"}</button>
      <div className="checkout-layout">
        <div>
          <div className="eyebrow"><span className="eyebrow-line"></span>FINALIZE SEU PEDIDO</div>
          <h1>Seus dados de entrega</h1>
          {account ? (
            <div className="form-card">
              <div className="eyebrow"><span className="eyebrow-line"></span>CONTA DO CLIENTE</div>
              <h2>{account.name}</h2>
              <p>{account.email} · {account.phone}</p>
              <p className="backend-note">O pedido será vinculado à sua conta; seus dados de contato não precisam ser digitados novamente.</p>
            </div>
          ) : (
            <p className="form-intro">Para comprar e acompanhar a produção e a entrega, entre na sua conta ou crie um cadastro de cliente.</p>
          )}
          <form className="form-card" onSubmit={onSubmit}>
            <div className="form-grid">
              {!account ? (
                <p className="full-field account-required">
                  Sua conta é necessária para vincular e acompanhar este pedido.{" "}
                  <button type="button" className="text-link" onClick={onGoToAccount}>Entrar / criar conta</button>
                </p>
              ) : null}
              <label>
                CEP
                <input
                  value={orderForm.zipCode}
                  onChange={(event) => onZipCodeChange(event.currentTarget.value)}
                  inputMode="numeric"
                  required
                  minLength={8}
                  maxLength={9}
                  autoComplete="postal-code"
                  placeholder="00000-000"
                />
              </label>
              <label className="full-field">
                Endereço de entrega
                <input
                  value={orderForm.address}
                  onChange={(event) => onAddressChange(event.currentTarget.value)}
                  autoComplete="street-address"
                  required
                  maxLength={240}
                  placeholder="Rua, número, complemento e cidade"
                />
              </label>
              {!fromCart ? (
                <label>
                  Quantidade
                  <input
                    value={orderForm.quantity}
                    onChange={(event) => onQuantityChange(Number(event.currentTarget.value))}
                    type="number"
                    min="1"
                    max="99"
                    required
                  />
                </label>
              ) : null}
              {fromCart
                ? cartItems.map((line) => (
                    <ProductSelectionFields
                      key={itemKey(line)}
                      product={line.product}
                      selection={line.selection}
                      className="full-field"
                      heading={`Opções — ${line.product.title}`}
                      onChange={(field, value) => onCartSelectionChange(line, field, value)}
                    />
                  ))
                : (
                    <ProductSelectionFields
                      product={product}
                      selection={selection}
                      className="full-field"
                      heading={`Opções — ${product.title}`}
                      onChange={onSelectionChange}
                    />
                  )}
            </div>
            {!optionsValid ? <p className="form-error">Escolha todas as opções disponíveis antes de continuar.</p> : null}
            <button type="button" className="text-link checkout-shipping-button" onClick={onCalculateShipping} disabled={shippingBusy}>
              {shippingBusy ? "Consultando CEP..." : "Consultar frete e prazo"}
            </button>
            {shipping ? (
              <div className="shipping-result">
                {shipping.city && shipping.state ? <strong>{shipping.city} — {shipping.state}</strong> : null}
                {shipping.price != null ? <span>Frete: {money(shipping.price)}</span> : null}
                {shipping.estimatedDays != null ? <span>Prazo estimado: {shipping.estimatedDays} dias</span> : null}
                <small>{shipping.message}</small>
              </div>
            ) : null}
            <div className="privacy-note">✓ Seus dados serão usados para processar o pedido e entrar em contato sobre a entrega.</div>
            <button className="button button-dark form-submit" disabled={submitting}>
              {submitting ? "Enviando pedido..." : "Enviar pedido"} →
            </button>
            <p className="backend-note">{storeSettings.paymentMessage}</p>
          </form>
        </div>
        <aside className="order-summary">
          <div className="eyebrow"><span className="eyebrow-line"></span>RESUMO</div>
          {orderLines.map((line) => (
            <div key={itemKey(line)} className="summary-product">
              <img src={imageUrl(line.product.image)} alt={line.product.title} />
              <div>
                <strong>{line.product.title}</strong>
                <span>{line.quantity} × {money(line.product.price)}</span>
                {line.selection.ironColor ? <span>Cor do ferro: {line.selection.ironColor}</span> : null}
                {line.selection.woodColor ? <span>Cor da madeira: {line.selection.woodColor}</span> : null}
                {line.selection.woodType ? <span>Tipo da madeira: {line.selection.woodType}</span> : null}
                {line.selection.upholsteryColor ? <span>Cor do estofado: {line.selection.upholsteryColor}</span> : null}
                <b>{money(line.product.price * line.quantity)}</b>
              </div>
            </div>
          ))}
          <div className="summary-row"><span>Subtotal</span><b>{money(total)}</b></div>
          <div className="summary-row">
            <span>Frete</span>
            <span>{shipping?.price != null ? money(shipping.price) : shipping ? "A combinar com a loja" : "Consulte pelo CEP"}</span>
          </div>
          <div className="summary-total"><span>Total estimado</span><b>{money(total + (shipping?.price || 0))}</b></div>
          <small>{shipping?.message || "Consulte o frete e o prazo pelo CEP."}</small>
        </aside>
      </div>
    </section>
  );
}
