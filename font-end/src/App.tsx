import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Product, ProductSelection } from "./app/models";
import { formatBrazilianDateInput, formatBrazilianZipCode, formatDateForInput } from "./app/form-formatters";
import { AppRoutes } from "./routes/AppRoutes";
import type { StoreScreen } from "./routes/types";
import { useAuth } from "./hooks/useAuth";
import { AdminLayout } from "./layouts/AdminLayout";
import { MainLayout } from "./layouts/MainLayout";
import { CatalogPage } from "./features/catalog/pages/CatalogPage";
import { DepartmentPage } from "./features/catalog/pages/DepartmentPage";
import { ProductDetailPage } from "./features/catalog/pages/ProductDetailPage";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Toast } from "./components/Toast";
import { CartPage } from "./features/cart/pages/CartPage";
import { useCart } from "./features/cart/CartContext";
import { cartLineKey } from "./features/cart/cartTypes";
import { EMPTY_SELECTION } from "./features/cart/cartUtils";
import { CheckoutPage } from "./features/checkout/pages/CheckoutPage";
import { OrderSuccessPage, PaymentPage } from "./features/checkout/pages/PaymentPage";
import { AccountPage } from "./features/auth/pages/AccountPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { Dashboard } from "./features/admin/pages/Dashboard";
import { MerchantLoginPage } from "./features/admin/pages/MerchantLoginPage";
import { imageUrl, money, useCatalog } from "./features/catalog/useCatalog";
import { useCustomerAccount } from "./features/auth/useCustomerAccount";
import { useCheckout } from "./features/checkout/useCheckout";
import { ORDER_STATUSES, statusLabel, useMerchantAdmin } from "./features/admin/useMerchantAdmin";

function formatOrderDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatDeliveryDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(`${value}T00:00:00`));
}

export default function App() {
  const {
    items: cartItems,
    setItems: setCartItems,
    itemCount: cartCount,
    total: cartTotal,
    addItem,
    setQuantity: setCartQuantity,
    removeItem: removeCartItem,
    updateSelection: updateCartLineSelection,
  } = useCart();

  const { role, account, saveSession, updateAccount, clearSession } = useAuth();

  const [screen, setScreen] = useState<StoreScreen>(() => role === "merchant" ? "admin" : "home");
  const [returnScreen, setReturnScreen] = useState<StoreScreen>("home");
  const [departmentMenuOpen, setDepartmentMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [notice, setNotice] = useState("");

  const noticeTimer = useRef<number | undefined>(undefined);

  function showNotice(message: string): void {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 5000);
  }

  function goToScreen(next: StoreScreen): void {
    setScreen(role === "merchant" ? "admin" : next);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goHome(): void {
    setScreen(role === "merchant" ? "admin" : "home");
    catalog.setSelectedDepartment("Todos os departamentos");
    setActiveProduct(null);
    checkout.resetCheckoutState();
    catalog.setSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseDepartment(department: string): void {
    catalog.setSelectedDepartment(department);
    catalog.setSearch("");
    catalog.setFeaturedOnly(false);
    catalog.setSortOrder("featured");
    setDepartmentMenuOpen(false);
    setScreen(department === "Todos os departamentos" ? "home" : "department");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectProduct(product: Product, selection: ProductSelection = EMPTY_SELECTION): void {
    if (screen === "home" || screen === "department" || screen === "cart") setReturnScreen(screen);
    setActiveProduct(product);
    checkout.setSelectedOptions(selection);
    goToScreen("product");
  }

  function backToCatalog(): void {
    setScreen(returnScreen);
    setActiveProduct(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addToCart(product: Product, selection: ProductSelection = EMPTY_SELECTION): void {
    const result = addItem(product, selection);
    if (result === "invalid-product") {
      showNotice("Este item é demonstrativo e não pode ser adicionado à sacola.");
      return;
    }
    if (result === "missing-options") {
      showNotice("Escolha as opções disponíveis do produto antes de continuar.");
      return;
    }
    showNotice(`${product.title} foi adicionado à sacola.`);
  }

  // Hook 1: Catalog domain
  const catalog = useCatalog({
    isHomeScreen: screen === "home",
    onCatalogSynced(catalogProducts) {
      setCartItems((current) => current.map((line) => {
        const currentProduct = catalogProducts.find((p) => p.id === line.product.id);
        return currentProduct ? { ...line, product: currentProduct } : line;
      }).filter((line) => line.product.active !== false));
    },
  });

  // Hook 2: Customer Account & Orders domain
  const customer = useCustomerAccount({
    role,
    account,
    saveSession,
    updateAccount,
    showNotice,
    screen,
    setScreen,
    onLoginSuccess(loggedCustomer) {
      if (checkout.checkoutProduct || checkout.checkoutFromCart) {
        checkout.setOrderForm((current) => ({
          ...current,
          name: loggedCustomer.name,
          email: loggedCustomer.email,
          phone: loggedCustomer.phone,
        }));
        goToScreen("checkout");
        showNotice("Conta conectada. Confira o endereço de entrega para continuar.");
      } else {
        goToScreen("account");
        showNotice("Bem-vindo(a) à sua conta.");
      }
    },
    onLogout() {
      void logout();
    },
  });

  // Hook 3: Checkout domain
  const checkout = useCheckout({
    role,
    account,
    products: catalog.products,
    productLoading: catalog.productLoading,
    productError: catalog.productError,
    cartItems,
    cartTotal,
    setCartItems,
    showNotice,
    setScreen,
    setReturnScreen,
    onOrderSuccess(createdOrder) {
      customer.handleOrderCreated(createdOrder);
    },
  });

  // Hook 4: Merchant / Admin domain
  const merchant = useMerchantAdmin({
    role,
    storeSettings: catalog.storeSettings,
    setStoreSettings: catalog.setStoreSettings,
    saveSession,
    showNotice,
    screen,
    setScreen,
    onProductChange(product, isDelete) {
      if (isDelete) {
        catalog.setProducts((current) => current.filter((p) => p.id !== product.id));
      } else {
        catalog.setProducts((current) => [product, ...current.filter((p) => p.id !== product.id)]);
      }
    },
  });

  // Session expired event handler
  useEffect(() => {
    function handleExpiredSession(): void {
      const expiredRole = role;
      clearSession();
      setScreen(expiredRole === "merchant" ? "admin" : "account");
      showNotice("Sua sessão expirou. Entre novamente para continuar.");
    }

    window.addEventListener("store:auth-expired", handleExpiredSession);
    return () => window.removeEventListener("store:auth-expired", handleExpiredSession);
  }, [clearSession, role]);

  useEffect(() => () => {
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
  }, []);

  async function logout(): Promise<void> {
    clearSession();
    customer.resetCustomerState();
    merchant.resetAdminState();
    checkout.resetCheckoutState();
    setScreen("home");
    catalog.setSelectedDepartment("Todos os departamentos");
    setActiveProduct(null);
    showNotice("Você saiu da sua conta.");
  }

  function showAccount(): void {
    goToScreen("account");
    if (role === "customer") {
      void customer.refreshProfile(true);
      void customer.loadOrders();
    }
  }

  function enterAdmin(): void {
    goToScreen("admin");
    if (role === "merchant") {
      void Promise.all([merchant.loadAdminProducts(), merchant.loadAdminOrders()]);
    }
  }

  function scrollToCatalog(): void {
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  }

  function scrollToMerchantSection(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  }

  const pages: Partial<Record<StoreScreen, ReactNode>> = {
    home: (
      <CatalogPage
        banners={catalog.banners}
        bannerIndex={catalog.bannerIndex}
        onBannerChange={catalog.setBannerIndex}
        onScrollToCatalog={scrollToCatalog}
        showroomProducts={catalog.showroomProducts}
        activeShowroomIndex={catalog.activeShowroomIndex}
        onShowroomChange={catalog.setActiveShowroomIndex}
        showroomProduct={catalog.showroomProduct}
        imageUrl={imageUrl}
        onSelectProduct={selectProduct}
        search={catalog.search}
        departments={catalog.departments}
        materials={catalog.materials}
        selectedDepartment={catalog.selectedDepartment}
        filters={catalog.productFilters}
        onDepartmentChange={chooseDepartment}
        onFilterChange={(field, value) => catalog.setProductFilters((current) => ({ ...current, [field]: value }))}
        onClearFilters={() => {
          catalog.clearFilters();
          if (screen === "department") setScreen("home");
        }}
        visibleProducts={catalog.visibleProducts}
        productCount={catalog.products.length}
        productLoading={catalog.productLoading}
        productError={catalog.productError}
        onRetryCatalog={catalog.retryCatalog}
        onWishlist={() => showNotice("Favorito salvo nesta sessão.")}
        onSubscribe={() => showNotice("Cadastro recebido! Em breve você terá novidades.")}
      />
    ),
    department: (
      <DepartmentPage
        department={catalog.selectedDepartment}
        departments={catalog.departments}
        materials={catalog.materials}
        filters={catalog.productFilters}
        products={catalog.departmentProducts}
        highlightedProduct={catalog.highlightedProduct}
        imageUrl={imageUrl}
        featuredOnly={catalog.featuredOnly}
        sortOrder={catalog.sortOrder}
        onFilterChange={(field, value) => catalog.setProductFilters((current) => ({ ...current, [field]: value }))}
        onDepartmentChange={chooseDepartment}
        onClearFilters={() => {
          catalog.clearFilters();
          setScreen("home");
        }}
        onFeaturedChange={() => catalog.setFeaturedOnly((current) => !current)}
        onSortChange={catalog.setSortOrder}
        onSelectProduct={selectProduct}
        onBack={goHome}
      />
    ),
    product: activeProduct ? (
      <ProductDetailPage
        product={activeProduct}
        relatedProducts={catalog.products.filter((p) => p.id !== activeProduct.id && p.department === activeProduct.department)}
        selection={checkout.selectedOptions}
        shippingZip={checkout.shippingZip}
        shippingResult={checkout.shippingResult}
        shippingBusy={checkout.shippingBusy}
        imageUrl={imageUrl}
        money={money}
        onBack={backToCatalog}
        onSelectionChange={(field, value) => checkout.setSelectedOptions((current) => ({ ...current, [field]: value }))}
        onAddToCart={() => addToCart(activeProduct, checkout.selectedOptions)}
        onCheckout={() => checkout.openCheckout(activeProduct)}
        onShippingZipChange={(value) => {
          checkout.setShippingZip(formatBrazilianZipCode(value));
          checkout.setShippingResult(null);
        }}
        onCalculateShipping={(event) => void checkout.calculateShipping(event, activeProduct)}
        onSelectRelated={selectProduct}
      />
    ) : null,
    cart: (
      <CartPage
        items={cartItems}
        itemCount={cartCount}
        total={cartTotal}
        imageUrl={imageUrl}
        money={money}
        itemKey={cartLineKey}
        onHome={goHome}
        onSelectProduct={(line) => selectProduct(line.product, line.selection)}
        onQuantityChange={setCartQuantity}
        onRemove={removeCartItem}
        onCheckout={checkout.beginCartCheckout}
      />
    ),
    checkout: checkout.checkoutProduct ? (
      <CheckoutPage
        product={checkout.checkoutProduct}
        fromCart={checkout.checkoutFromCart}
        cartItems={cartItems}
        account={role === "customer" ? account : null}
        orderForm={checkout.orderForm}
        selection={checkout.checkoutSelection}
        shipping={checkout.checkoutShipping}
        shippingBusy={checkout.checkoutShippingBusy}
        submitting={checkout.checkoutBusy}
        optionsValid={checkout.checkoutOptionsValid}
        total={checkout.checkoutTotal}
        storeSettings={catalog.storeSettings}
        itemKey={cartLineKey}
        imageUrl={imageUrl}
        money={money}
        onBack={() => {
          if (checkout.checkoutFromCart) {
            goToScreen("cart");
            return;
          }
          selectProduct(checkout.checkoutProduct!, checkout.checkoutSelection);
        }}
        onGoToAccount={() => goToScreen("account")}
        onSubmit={(event) => void checkout.submitOrder(event)}
        onZipCodeChange={(value) => {
          checkout.updateOrderField("zipCode", formatBrazilianZipCode(value));
          checkout.setCheckoutShipping(null);
        }}
        onAddressChange={(value) => checkout.updateOrderField("address", value)}
        onQuantityChange={(value) => checkout.updateOrderField("quantity", value)}
        onSelectionChange={(field, value) => {
          checkout.setCheckoutSelection((current) => ({ ...current, [field]: value }));
          checkout.setSelectedOptions((current) => ({ ...current, [field]: value }));
        }}
        onCartSelectionChange={(line, field, value) => updateCartLineSelection(cartLineKey(line), field, value)}
        onCalculateShipping={() => void checkout.calculateCheckoutShipping()}
      />
    ) : null,
    payment: customer.lastOrder ? (
      <PaymentPage
        order={customer.lastOrder}
        storeSettings={catalog.storeSettings}
        money={money}
        onContinue={() => setScreen("success")}
        onViewOrders={showAccount}
      />
    ) : null,
    success: (
      <OrderSuccessPage
        order={customer.lastOrder}
        statusLabel={statusLabel}
        onViewOrders={showAccount}
        onHome={goHome}
      />
    ),
    account: (
      <AccountPage
        account={role === "customer" ? account : null}
        orders={customer.orders}
        loadingOrders={customer.loadingOrders}
        login={customer.customerLogin}
        loginError={customer.customerLoginError}
        loginBusy={customer.loginBusy}
        deleteBusy={customer.deleteAccountBusy}
        money={money}
        formatOrderDate={formatOrderDate}
        formatDeliveryDate={formatDeliveryDate}
        statusLabel={statusLabel}
        onHome={goHome}
        onLogout={() => void logout()}
        onRefreshOrders={() => void customer.loadOrders()}
        onLogin={(event) => void customer.loginCustomer(event)}
        onLoginChange={(field, value) => customer.setCustomerLogin((current) => ({ ...current, [field]: value }))}
        onRegister={() => goToScreen("register")}
        onDeleteAccount={() => void customer.deleteCustomerAccount()}
      />
    ),
    register: (
      <RegisterPage
        form={customer.registerForm}
        error={customer.registerError}
        busy={customer.registerBusy}
        onBack={() => goToScreen("account")}
        onSubmit={(event) => void customer.registerCustomer(event)}
        onChange={(field, value) => customer.setRegisterForm((current) => ({ ...current, [field]: value }))}
      />
    ),
    admin: role === "merchant" ? (
      <Dashboard
        account={account}
        products={merchant.adminProducts}
        productForm={merchant.productForm}
        numericDrafts={merchant.productNumericDrafts}
        optionDrafts={merchant.productOptionDrafts}
        editingProduct={merchant.editingProduct}
        mainImagePreview={merchant.mainImagePreview}
        ambientImagePreview={merchant.ambientImagePreview}
        productBusy={merchant.adminBusy}
        orders={merchant.adminOrders}
        loadingOrders={merchant.loadingAdminOrders}
        deliveryDateBusy={merchant.deliveryDateBusy}
        deliveryDateDrafts={merchant.deliveryDateDrafts}
        orderStatuses={ORDER_STATUSES}
        settings={merchant.storeSettingsDraft}
        settingsBusy={merchant.storeSettingsBusy}
        imageUrl={imageUrl}
        money={money}
        formatOrderDate={formatOrderDate}
        formatDateForInput={formatDateForInput}
        formatBrazilianDateInput={formatBrazilianDateInput}
        onBack={goHome}
        onLogout={() => void logout()}
        onProductSubmit={(event) => void merchant.saveProduct(event)}
        onCancelEdit={merchant.cancelEdit}
        onProductFieldChange={merchant.updateProductField}
        onNumericDraftChange={(field, value) => merchant.setProductNumericDrafts((current) => ({ ...current, [field]: value }))}
        onOptionDraftChange={(field, value) => merchant.setProductOptionDrafts((current) => ({ ...current, [field]: value }))}
        onChooseImage={merchant.chooseImage}
        onBeginEdit={merchant.beginEdit}
        onDeleteProduct={(product) => void merchant.deleteProduct(product)}
        onRefreshOrders={() => void merchant.loadAdminOrders()}
        onOrderStatusChange={(order, status) => void merchant.updateOrderStatus(order, status)}
        onDeliveryDateDraftChange={(orderId, value) => merchant.setDeliveryDateDrafts((current) => ({ ...current, [orderId]: value }))}
        onSaveDeliveryDate={merchant.saveDeliveryDate}
        onRemoveDeliveryDate={(order) => void merchant.updateDeliveryDate(order, null)}
        onSettingsSubmit={(event) => void merchant.saveStoreSettings(event)}
        onSettingsChange={merchant.updateStoreSettingsField}
      />
    ) : (
      <MerchantLoginPage
        form={merchant.merchantLogin}
        error={merchant.merchantLoginError}
        busy={merchant.loginBusy}
        onBack={goHome}
        onSubmit={(event) => void merchant.loginMerchant(event)}
        onChange={(field, value) => merchant.setMerchantLogin((current) => ({ ...current, [field]: value }))}
      />
    ),
  };

  const ScreenLayout = role === "merchant" ? AdminLayout : MainLayout;

  return (
    <ScreenLayout>
      <div className="app-shell">
        <Header
          role={role}
          account={account}
          mobileMenuOpen={mobileMenuOpen}
          departmentMenuOpen={departmentMenuOpen}
          search={catalog.search}
          cartCount={cartCount}
          departments={catalog.departments}
          onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
          onToggleDepartmentMenu={() => setDepartmentMenuOpen((open) => !open)}
          onSearchChange={(value) => {
            catalog.setSearch(value);
            catalog.setSelectedDepartment("Todos os departamentos");
            setScreen("home");
          }}
          onClearSearch={() => catalog.setSearch("")}
          onDepartmentSelect={chooseDepartment}
          onNavigate={goToScreen}
          onHome={goHome}
          onAccount={showAccount}
          onLogout={() => void logout()}
          onMerchantSection={scrollToMerchantSection}
        />

        <main>
          <AppRoutes screen={screen} pages={pages} />
        </main>

        <Footer
          isMerchant={role === "merchant"}
          whatsappUrl={catalog.whatsappUrl}
          onHome={goHome}
          onAccount={showAccount}
          onNavigate={goToScreen}
          onSupport={() => showNotice("Entre em contato pelo WhatsApp para receber ajuda.")}
          onAdmin={enterAdmin}
          onMerchantSection={scrollToMerchantSection}
          onLogout={() => void logout()}
          onMissingWhatsapp={() => showNotice("Configure VITE_WHATSAPP_NUMBER no arquivo .env para ativar o WhatsApp.")}
        />
        <Toast message={notice} onClose={() => setNotice("")} />
      </div>
    </ScreenLayout>
  );
}
