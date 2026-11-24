import { useState } from "react";
import type { MerchantOrder } from "../../../app/models";
import { matchesOrderNumber } from "../order-search";

interface OrdersPageProps {
  orders: MerchantOrder[];
  loading: boolean;
  dateBusy: string;
  dateDrafts: Record<string, string>;
  orderStatuses: readonly (readonly [string, string])[];
  money: (value: number | null | undefined) => string;
  formatOrderDate: (value: string) => string;
  formatDateForInput: (value: string | null) => string;
  formatBrazilianDateInput: (value: string) => string;
  onRefresh: () => void;
  onStatusChange: (order: MerchantOrder, status: string) => void;
  onDateDraftChange: (orderId: string, value: string) => void;
  onSaveDate: (order: MerchantOrder) => void;
  onRemoveDate: (order: MerchantOrder) => void;
}

const ORDER_OPTIONS = [
  ["ironColor", "Cor do ferro"],
  ["woodColor", "Cor da madeira"],
  ["woodType", "Tipo da madeira"],
  ["upholsteryColor", "Cor do estofado"],
] as const;

export function OrdersPage({
  orders,
  loading,
  dateBusy,
  dateDrafts,
  orderStatuses,
  money,
  formatOrderDate,
  formatDateForInput,
  formatBrazilianDateInput,
  onRefresh,
  onStatusChange,
  onDateDraftChange,
  onSaveDate,
  onRemoveDate,
}: OrdersPageProps) {
  const [orderSearch, setOrderSearch] = useState("");
  const filteredOrders = orders.filter((order) => matchesOrderNumber(order.orderNumber, orderSearch));

  return (
    <section id="merchant-sales" className="admin-products-panel sales-panel">
      <div className="admin-products-heading">
        <div><h2>Painel de vendas</h2><p>Acompanhe os pedidos, previsão de entrega e cada etapa para o cliente.</p></div>
        <button className="text-link" disabled={loading} onClick={onRefresh}>{loading ? "Atualizando..." : "Atualizar vendas"}</button>
      </div>
      <label className="sale-search">
        Buscar pedido pelo código
        <input
          type="search"
          value={orderSearch}
          onChange={(event) => setOrderSearch(event.currentTarget.value)}
          placeholder="Ex.: PED-A1B2C3D4"
          aria-label="Buscar pedido pelo código"
        />
      </label>
      {loading && !orders.length ? <p className="account-empty">Carregando vendas...</p> : orders.length ? (
        filteredOrders.length ? <div className="sales-list">
          {filteredOrders.map((order) => (
            <article key={order.id} className="sale-row">
              <div className="sale-heading">
                <div><strong>{order.orderNumber}</strong><span>{formatOrderDate(order.createdAt)}</span></div>
                <b>{money(order.total)}</b>
              </div>
              <div className="sale-customer">
                <strong>{order.customerName}</strong>
                <span>{order.customerEmail} · {order.customerPhone}</span>
                <span>{order.address} — CEP {order.zipCode}</span>
              </div>
              <ul className="sale-items">
                {order.items.map((item, index) => (
                  <li key={`${order.id}-${item.productId}-${index}`}>
                    {item.quantity} × {item.title}
                    {ORDER_OPTIONS.map(([key, label]) => {
                      const choice = item.selection?.[key];
                      return choice ? ` · ${label}: ${choice}` : "";
                    })}
                    <span>{money(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <label className="sale-status">
                Status do pedido
                <select value={order.status} onChange={(event) => onStatusChange(order, event.currentTarget.value)}>
                  {orderStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <div className="delivery-date-editor">
                <label>
                  Previsão de entrega (DD/MM/AAAA)
                  <input
                    type="text"
                    value={dateDrafts[order.id] ?? formatDateForInput(order.deliveryDate)}
                    onChange={(event) => onDateDraftChange(order.id, formatBrazilianDateInput(event.currentTarget.value))}
                    placeholder="DD/MM/AAAA"
                    inputMode="numeric"
                    maxLength={10}
                    disabled={dateBusy === order.id}
                  />
                </label>
                <button className="text-link" disabled={dateBusy === order.id} onClick={() => onSaveDate(order)}>
                  {dateBusy === order.id ? "Salvando..." : "Salvar data"}
                </button>
                {order.deliveryDate ? (
                  <button className="text-link danger-link" disabled={dateBusy === order.id} onClick={() => onRemoveDate(order)}>
                    Remover previsão
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div> : <p className="account-empty">Nenhum pedido encontrado com esse código.</p>
      ) : <p className="account-empty">Ainda não há vendas registradas.</p>}
    </section>
  );
}
