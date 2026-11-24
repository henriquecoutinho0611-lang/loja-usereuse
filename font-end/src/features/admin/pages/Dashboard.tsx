import type { ChangeEvent, FormEvent } from "react";
import type { AccountProfile, MerchantOrder, Product, ProductRequest } from "../../../app/models";
import type { ProductNumericDrafts, ProductOptionDrafts, StoreSettingsDraft } from "../adminTypes";
import { OrdersPage } from "./OrdersPage";
import { ProductsPage } from "./ProductsPage";
import { StoreSettingsPage } from "./StoreSettingsPage";

interface DashboardProps {
  account: AccountProfile | null;
  products: Product[];
  productForm: ProductRequest;
  numericDrafts: ProductNumericDrafts;
  optionDrafts: ProductOptionDrafts;
  editingProduct: Product | null;
  mainImagePreview: string;
  ambientImagePreview: string;
  productBusy: boolean;
  orders: MerchantOrder[];
  loadingOrders: boolean;
  deliveryDateBusy: string;
  deliveryDateDrafts: Record<string, string>;
  orderStatuses: readonly (readonly [string, string])[];
  settings: StoreSettingsDraft;
  settingsBusy: boolean;
  imageUrl: (path: string | null | undefined) => string;
  money: (value: number | null | undefined) => string;
  formatOrderDate: (value: string) => string;
  formatDateForInput: (value: string | null) => string;
  formatBrazilianDateInput: (value: string) => string;
  onBack: () => void;
  onLogout: () => void;
  onProductSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onProductFieldChange: <K extends keyof ProductRequest>(field: K, value: ProductRequest[K]) => void;
  onNumericDraftChange: (field: keyof ProductNumericDrafts, value: string) => void;
  onOptionDraftChange: (field: keyof ProductOptionDrafts, value: string) => void;
  onChooseImage: (event: ChangeEvent<HTMLInputElement>, type: "main" | "ambient") => void;
  onBeginEdit: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onRefreshOrders: () => void;
  onOrderStatusChange: (order: MerchantOrder, status: string) => void;
  onDeliveryDateDraftChange: (orderId: string, value: string) => void;
  onSaveDeliveryDate: (order: MerchantOrder) => void;
  onRemoveDeliveryDate: (order: MerchantOrder) => void;
  onSettingsSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSettingsChange: <K extends keyof StoreSettingsDraft>(field: K, value: StoreSettingsDraft[K]) => void;
}

export function Dashboard({
  account,
  products,
  productForm,
  numericDrafts,
  optionDrafts,
  editingProduct,
  mainImagePreview,
  ambientImagePreview,
  productBusy,
  orders,
  loadingOrders,
  deliveryDateBusy,
  deliveryDateDrafts,
  orderStatuses,
  settings,
  settingsBusy,
  imageUrl,
  money,
  formatOrderDate,
  formatDateForInput,
  formatBrazilianDateInput,
  onBack,
  onLogout,
  onProductSubmit,
  onCancelEdit,
  onProductFieldChange,
  onNumericDraftChange,
  onOptionDraftChange,
  onChooseImage,
  onBeginEdit,
  onDeleteProduct,
  onRefreshOrders,
  onOrderStatusChange,
  onDeliveryDateDraftChange,
  onSaveDeliveryDate,
  onRemoveDeliveryDate,
  onSettingsSubmit,
  onSettingsChange,
}: DashboardProps) {
  return (
    <section className="form-page admin-page">
      <button className="back-link" onClick={onBack}>← Painel principal</button>
      <div className="admin-content">
        <div className="admin-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-line"></span>PAINEL DO LOJISTA</div>
            <h1>Gerenciar produtos</h1>
            <p>Publique, edite preços e atualize o catálogo.</p>
          </div>
          <div className="admin-session">
            <span className="connected-pill">{account?.name || "Conta autenticada"}</span>
            <button className="text-link" onClick={onLogout}>Sair</button>
          </div>
        </div>
        <ProductsPage
          products={products}
          form={productForm}
          numericDrafts={numericDrafts}
          optionDrafts={optionDrafts}
          editingProduct={editingProduct}
          mainImagePreview={mainImagePreview}
          ambientImagePreview={ambientImagePreview}
          busy={productBusy}
          imageUrl={imageUrl}
          money={money}
          onSubmit={onProductSubmit}
          onCancelEdit={onCancelEdit}
          onProductFieldChange={onProductFieldChange}
          onNumericDraftChange={onNumericDraftChange}
          onOptionDraftChange={onOptionDraftChange}
          onChooseImage={onChooseImage}
          onBeginEdit={onBeginEdit}
          onDelete={onDeleteProduct}
        />
        <OrdersPage
          orders={orders}
          loading={loadingOrders}
          dateBusy={deliveryDateBusy}
          dateDrafts={deliveryDateDrafts}
          orderStatuses={orderStatuses}
          money={money}
          formatOrderDate={formatOrderDate}
          formatDateForInput={formatDateForInput}
          formatBrazilianDateInput={formatBrazilianDateInput}
          onRefresh={onRefreshOrders}
          onStatusChange={onOrderStatusChange}
          onDateDraftChange={onDeliveryDateDraftChange}
          onSaveDate={onSaveDeliveryDate}
          onRemoveDate={onRemoveDeliveryDate}
        />
        <StoreSettingsPage settings={settings} busy={settingsBusy} onSubmit={onSettingsSubmit} onChange={onSettingsChange} />
      </div>
    </section>
  );
}
