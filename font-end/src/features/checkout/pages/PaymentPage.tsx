import type { StoreOrder, StoreSettings } from "../../../app/models";

interface PaymentPageProps {
  order: StoreOrder;
  storeSettings: StoreSettings;
  money: (value: number | null | undefined) => string;
  onContinue: () => void;
  onViewOrders: () => void;
}

export function PaymentPage({ order, storeSettings, money, onContinue, onViewOrders }: PaymentPageProps) {
  return (
    <section className="form-page payment-page">
      <div className="eyebrow"><span className="eyebrow-line"></span>PAGAMENTO DO PEDIDO</div>
      <h1>Pedido {order.orderNumber}</h1>
      <p>Frete: <strong>{order.shippingCost > 0 ? money(order.shippingCost) : "A combinar com a loja"}</strong></p>
      <p>Total do pedido: <strong>{money(order.total)}</strong></p>
      <div className="payment-status">
        <strong>Como pagar</strong>
        <p>{storeSettings.paymentMessage || "A loja entrará em contato para combinar os detalhes do pagamento e da entrega."}</p>
      </div>
      <div className="payment-actions">
        <button className="button button-dark" type="button" onClick={onContinue}>
          Finalizar e confirmar pedido →
        </button>
        <button className="text-link" type="button" onClick={onViewOrders}>
          Ver meus pedidos
        </button>
      </div>
    </section>
  );
}

interface OrderSuccessPageProps {
  order: StoreOrder | null;
  statusLabel: (status: string) => string;
  onViewOrders: () => void;
  onHome: () => void;
}

export function OrderSuccessPage({ order, statusLabel, onViewOrders, onHome }: OrderSuccessPageProps) {
  return (
    <section className="form-page success-page">
      <div className="success-icon">✓</div>
      <div className="eyebrow"><span className="eyebrow-line"></span>PEDIDO RECEBIDO</div>
      <h1>Obrigado pela sua compra.</h1>
      <p>Pedido {order?.orderNumber} registrado com sucesso. Status atual: <strong>{statusLabel(order?.status || "RECEIVED")}</strong>.</p>
      <button className="button button-dark" onClick={onViewOrders}>Acompanhar pedido →</button>
      <button className="text-link" onClick={onHome}>Voltar para a loja</button>
    </section>
  );
}
