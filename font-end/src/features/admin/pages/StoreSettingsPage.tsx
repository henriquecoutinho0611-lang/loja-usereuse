import type { FormEvent } from "react";
import type { StoreSettingsDraft } from "../adminTypes";

interface StoreSettingsPageProps {
  settings: StoreSettingsDraft;
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: <K extends keyof StoreSettingsDraft>(field: K, value: StoreSettingsDraft[K]) => void;
}

export function StoreSettingsPage({ settings, busy, onSubmit, onChange }: StoreSettingsPageProps) {
  return (
    <section id="merchant-settings" className="admin-products-panel merchant-settings-panel">
      <div className="eyebrow"><span className="eyebrow-line"></span>CONFIGURAÇÕES DA LOJA</div>
      <h2>Informações para seus clientes</h2>
      <p>Atualize o contato, o frete e as orientações de pagamento exibidos na loja.</p>
      <form className="merchant-settings-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="full-field">
            WhatsApp da loja
            <input type="tel" value={settings.whatsappNumber} onChange={(event) => onChange("whatsappNumber", event.currentTarget.value)} maxLength={24} placeholder="5511999999999" />
            <small>Inclua o código do país e o DDD. Deixe vazio para ocultar o botão de WhatsApp.</small>
          </label>
          <label>
            Frete na cidade de São Paulo (R$)
            <input type="text" inputMode="decimal" value={settings.saoPauloCityPrice} onChange={(event) => onChange("saoPauloCityPrice", event.currentTarget.value)} placeholder="Ex.: 50,00" />
            <small>Deixe vazio para combinar com o cliente.</small>
          </label>
          <label>
            Frete nas demais cidades de SP (R$)
            <input type="text" inputMode="decimal" value={settings.saoPauloStatePrice} onChange={(event) => onChange("saoPauloStatePrice", event.currentTarget.value)} placeholder="Ex.: 80,00" />
            <small>Deixe vazio para combinar com o cliente.</small>
          </label>
          <label className="full-field">
            Mensagem de entrega fora de SP
            <textarea value={settings.deliveryOutsideStateMessage} onChange={(event) => onChange("deliveryOutsideStateMessage", event.currentTarget.value)} rows={3} required maxLength={500} />
          </label>
          <label className="full-field">
            Orientações de pagamento
            <textarea value={settings.paymentMessage} onChange={(event) => onChange("paymentMessage", event.currentTarget.value)} rows={3} required maxLength={500} />
          </label>
        </div>
        <div className="admin-form-bottom">
          <span>As alterações serão exibidas para quem visitar a loja.</span>
          <button className="button button-dark" disabled={busy}>{busy ? "Salvando..." : "Salvar configurações"} ✓</button>
        </div>
      </form>
    </section>
  );
}
