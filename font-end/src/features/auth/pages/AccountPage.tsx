import type { FormEvent } from "react";
import type { AccountProfile, StoreOrder } from "../../../app/models";

interface AccountPageProps {
  account: AccountProfile | null;
  orders: StoreOrder[];
  loadingOrders: boolean;
  login: { email: string; password: string };
  loginError: string;
  loginBusy: boolean;
  deleteBusy: boolean;
  money: (value: number | null | undefined) => string;
  formatOrderDate: (value: string) => string;
  formatDeliveryDate: (value: string) => string;
  statusLabel: (status: string) => string;
  onHome: () => void;
  onLogout: () => void;
  onRefreshOrders: () => void;
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  onLoginChange: (field: "email" | "password", value: string) => void;
  onRegister: () => void;
  onDeleteAccount: () => void;
}

export function AccountPage({
  account,
  orders,
  loadingOrders,
  login,
  loginError,
  loginBusy,
  deleteBusy,
  money,
  formatOrderDate,
  formatDeliveryDate,
  statusLabel,
  onHome,
  onLogout,
  onRefreshOrders,
  onLogin,
  onLoginChange,
  onRegister,
  onDeleteAccount,
}: AccountPageProps) {
  return (
    <>
      <section className="form-page account-page">
        <button className="back-link" onClick={onHome}>← Voltar para a loja</button>
        {account ? (
          <div className="customer-dashboard">
            <div className="customer-dashboard-heading">
              <div>
                <div className="eyebrow"><span className="eyebrow-line"></span>MINHA CONTA</div>
                <h1>Olá, {account.name}.</h1>
                <p>{account.email} · {account.phone}</p>
              </div>
              <button className="text-link" onClick={onLogout}>Sair da conta</button>
            </div>
            <section className="orders-panel">
              <div className="orders-heading">
                <h2>Meus pedidos</h2>
                <button className="text-link" disabled={loadingOrders} onClick={onRefreshOrders}>
                  {loadingOrders ? "Atualizando..." : "Atualizar"}
                </button>
              </div>
              {loadingOrders && !orders.length ? (
                <p className="account-empty">Carregando seus pedidos...</p>
              ) : orders.length ? (
                <div className="orders-list">
                  {orders.map((order) => (
                    <article key={order.id} className="order-row">
                      <div className="order-main">
                        <span>{order.orderNumber}<small>{formatOrderDate(order.createdAt)}</small></span>
                        <span className="order-status">{statusLabel(order.status)}</span>
                        <strong>{money(order.total)}</strong>
                      </div>
                      {order.items?.length ? (
                        <ul className="order-items">
                          {order.items.map((item, index) => (
                                    <li key={`${order.id}-${index}`}>
                              <span>{item.quantity} × {item.title}</span>
                              <strong>{money(item.lineTotal)}</strong>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="account-empty">Seus pedidos aparecerão aqui depois da primeira compra.</p>
              )}
            </section>
          </div>
        ) : (
          <div className="account-card">
            <div className="eyebrow"><span className="eyebrow-line"></span>MINHA CONTA</div>
            <h1>Entre na sua conta</h1>
            <p className="form-intro">Acesse seus pedidos e use seus dados salvos para comprar.</p>
            <form className="form-card" onSubmit={onLogin}>
              <label>
                E-mail
                <input
                  value={login.email}
                  onChange={(event) => onLoginChange("email", event.currentTarget.value)}
                  type="email"
                  autoComplete="username"
                  required
                  maxLength={180}
                  placeholder="voce@email.com"
                />
              </label>
              <label>
                Senha
                <input
                  value={login.password}
                  onChange={(event) => onLoginChange("password", event.currentTarget.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={72}
                  placeholder="Sua senha"
                />
              </label>
              {loginError ? <p className="form-error" role="alert">{loginError}</p> : null}
              <button className="button button-dark form-submit" disabled={loginBusy}>
                {loginBusy ? "Entrando..." : "Entrar"} →
              </button>
            </form>
            <div className="account-switch">
              <span>Ainda não tem cadastro?</span>
              <button onClick={onRegister}>Criar conta de cliente</button>
            </div>
          </div>
        )}
      </section>
      {account ? (
        <section className="form-page account-actions-page">
          <div className="orders-panel">
            <div className="orders-heading"><h2>Previsões de entrega</h2></div>
            {orders.length ? (
              <div className="orders-list">
                {orders.map((order) => (
                  <article key={order.id} className="order-row">
                    <div className="order-main">
                      <span>{order.orderNumber}</span>
                      {order.deliveryDate
                        ? <strong>{formatDeliveryDate(order.deliveryDate)}</strong>
                        : <span className="order-status">A combinar com a loja</span>}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="account-empty">As datas informadas pela loja aparecerão aqui.</p>
            )}
          </div>
          <div className="account-delete-panel">
            <h2>Excluir minha conta</h2>
            <p>A exclusão remove seus dados pessoais e encerra o acesso à conta. Os registros de pedidos permanecem apenas de forma anonimizada.</p>
            <button className="button button-outline danger-button" disabled={deleteBusy} onClick={onDeleteAccount}>
              {deleteBusy ? "Excluindo..." : "Excluir conta permanentemente"}
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}
