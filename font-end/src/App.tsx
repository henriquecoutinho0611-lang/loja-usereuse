import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { AccountProfile, Banner, MerchantOrder, OrderRequest, Product, ProductRequest, ProductSelection, ShippingQuote, StoreOrder, StoreSettings } from "./app/models";
import { storeApi } from "./app/store-api.service";
import { brazilianZipCodeDigits, formatBrazilianDateInput, formatBrazilianZipCode, formatDateForInput, parseDateInput, parseProductOptions } from "./app/form-formatters";
import { matchesProductSearch } from "./app/product-search";

type StoreScreen = "home" | "department" | "product" | "cart" | "checkout" | "payment" | "success" | "account" | "register" | "admin";
type UserRole = "customer" | "merchant";
interface CartLine { product: Product; quantity: number; selection: ProductSelection; }
type OrderForm = { name: string; email: string; phone: string; zipCode: string; address: string; quantity: number };
const EMPTY_SELECTION: ProductSelection = { ironColor: null, woodColor: null, woodType: null, upholsteryColor: null };
const PRODUCT_OPTION_FIELDS = [
  { field: "ironColors", selection: "ironColor", label: "Cor do ferro" },
  { field: "woodColors", selection: "woodColor", label: "Cor da madeira" },
  { field: "woodTypes", selection: "woodType", label: "Tipo da madeira" },
  { field: "upholsteryColors", selection: "upholsteryColor", label: "Cor do estofado" },
] as const;

const PROMO_BANNERS: Banner[] = [
  {
    eyebrow: "FERRO, MADEIRA E PERSONALIDADE",
    title: "Móveis com\nforça e propósito.",
    text: "Design industrial para transformar seus espaços e durar por muitos anos.",
    cta: "Ver coleção industrial",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1800&q=90",
    tag: "ATÉ 30% OFF",
  },
  {
    eyebrow: "FEITO PARA FICAR",
    title: "Estrutura forte.\nEstilo de sobra.",
    text: "Peças que unem metal, madeira e funcionalidade para o dia a dia.",
    cta: "Conhecer os móveis",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=90",
    tag: "NOVA COLEÇÃO",
  },
];

const ORDER_STATUSES = [
  ["RECEIVED", "Pedido recebido"],
  ["IN_PRODUCTION", "Em produção"],
  ["READY_FOR_SHIPPING", "Pronto para envio"],
  ["SHIPPED", "Saiu para entrega"],
  ["DELIVERED", "Entregue"],
  ["CANCELLED", "Cancelado"],
] as const;

const EMPTY_PRODUCT: ProductRequest = {
  title: "",
  description: "",
  department: "",
  price: 0,
  oldPrice: null,
  width: 0,
  height: 0,
  image: "",
  ambientImage: null,
  featured: false,
  ironColors: [],
  woodColors: [],
  woodTypes: [],
  upholsteryColors: [],
};
const EMPTY_PRODUCT_OPTION_DRAFTS = {
  ironColors: "",
  woodColors: "",
  woodTypes: "",
  upholsteryColors: "",
};
const EMPTY_PRODUCT_NUMERIC_DRAFTS = { price: "", oldPrice: "", width: "", height: "" };
const DEFAULT_STORE_SETTINGS: StoreSettings = {
  whatsappNumber: "",
  saoPauloCityPrice: null,
  saoPauloStatePrice: null,
  deliveryOutsideStateMessage: "Para entregas fora do estado de São Paulo, entre em contato para combinar o frete e o prazo.",
  paymentMessage: "A loja combinará o pagamento após o envio do pedido.",
};
type StoreSettingsDraft = Omit<StoreSettings, "saoPauloCityPrice" | "saoPauloStatePrice"> & {
  saoPauloCityPrice: string;
  saoPauloStatePrice: string;
};

function toStoreSettingsDraft(settings: StoreSettings): StoreSettingsDraft {
  return {
    ...settings,
    saoPauloCityPrice: settings.saoPauloCityPrice == null ? "" : String(settings.saoPauloCityPrice),
    saoPauloStatePrice: settings.saoPauloStatePrice == null ? "" : String(settings.saoPauloStatePrice),
  };
}

function readSavedRole(): UserRole | null {
  const role = sessionStorage.getItem("loja_user_role");
  return role === "customer" || role === "merchant" ? role : null;
}

function readSavedAccount(role: UserRole | null): AccountProfile | null {
  if (!role || !sessionStorage.getItem("loja_access_token")) return null;
  return {
    id: "",
    role: role.toUpperCase(),
    email: sessionStorage.getItem("loja_user_email") || "",
    name: sessionStorage.getItem("loja_user_name") || "",
    phone: sessionStorage.getItem("loja_user_phone") || "",
  };
}

function readSavedCart(): CartLine[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem("loja_cart") || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.flatMap((item: unknown) => {
      if (!item || typeof item !== "object" || !("product" in item) || !("quantity" in item)) return [];
      const line = item as { product: Product; quantity: unknown };
      const quantity = Number(line.quantity);
      if (!line.product?.id || !Number.isFinite(quantity) || quantity <= 0) return [];
      const saved = line as { product: Product; quantity: unknown; selection?: Partial<ProductSelection> };
      return [{
        product: line.product,
        quantity: Math.min(99, Math.floor(quantity)),
        selection: { ...EMPTY_SELECTION, ...saved.selection },
      }];
    });
  } catch {
    return [];
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function money(value: number | null | undefined): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function statusLabel(status: string): string {
  return ORDER_STATUSES.find(([code]) => code === status)?.[1] || status;
}

function formatOrderDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatDeliveryDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(`${value}T00:00:00`));
}

function cartLineKey(line: CartLine): string {
  return `${line.product.id}:${JSON.stringify(line.selection)}`;
}

function hasRequiredSelections(product: Product, selection: ProductSelection): boolean {
  return PRODUCT_OPTION_FIELDS.every(({ field, selection: key }) => {
    const options = product[field] || [];
    return options.length === 0 || (selection[key] !== null && options.includes(selection[key] || ""));
  });
}

function PriceLine({ product }: { product: Product }) {
  return (
    <div className="price-line">
      {product.oldPrice ? <span className="old-price">{money(product.oldPrice)}</span> : null}
      <strong>{money(product.price)}</strong>
    </div>
  );
}

function ProductCard({
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
        <span className="quick-view">Ver produto ↗</span>
      </button>
      {onWishlist ? <button className="wishlist-button" aria-label={`Favoritar ${product.title}`} onClick={onWishlist}>☆</button> : null}
      <div className="product-info">
        <div className="product-category">{product.department}</div>
        <button className="product-title" onClick={() => onSelect(product)}>{product.title}</button>
        {onWishlist ? <div className="rating">★★★★★ <span>Design industrial</span></div> : null}
        <PriceLine product={product} />
      </div>
    </article>
  );
}

function ProductSelectionFields({
  product,
  selection,
  onChange,
  heading,
  className = "",
}: {
  product: Product;
  selection: ProductSelection;
  onChange: (field: keyof ProductSelection, value: string | null) => void;
  heading?: string;
  className?: string;
}) {
  const fields = PRODUCT_OPTION_FIELDS.filter(({ field }) => (product[field] || []).length > 0);
  if (!fields.length) return null;
  return (
    <div className={`product-options ${className}`}>
      {heading ? <strong className="product-options-heading">{heading}</strong> : null}
      {fields.map(({ field, selection: key, label }) => (
        <label key={field}>{label}
          <select value={selection[key] || ""} onChange={(event) => onChange(key, event.currentTarget.value || null)}>
            <option value="">Escolha uma opção</option>
            {(product[field] || []).map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>(PROMO_BANNERS);
  const [screen, setScreen] = useState<StoreScreen>(() => readSavedRole() === "merchant" ? "admin" : "home");
  const [returnScreen, setReturnScreen] = useState<StoreScreen>("home");
  const [selectedDepartment, setSelectedDepartment] = useState("Todos os departamentos");
  const [search, setSearch] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [activeShowroomIndex, setActiveShowroomIndex] = useState(0);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<ProductSelection>(EMPTY_SELECTION);
  const [checkoutSelection, setCheckoutSelection] = useState<ProductSelection>(EMPTY_SELECTION);
  const [checkoutFromCart, setCheckoutFromCart] = useState(false);
  const [cartItems, setCartItems] = useState<CartLine[]>(readSavedCart);
  const [role, setRole] = useState<UserRole | null>(readSavedRole);
  const [account, setAccount] = useState<AccountProfile | null>(() => readSavedAccount(readSavedRole()));
  const [notice, setNotice] = useState("");
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState("");
  const [departmentMenuOpen, setDepartmentMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState("featured");
  const [shippingZip, setShippingZip] = useState("");
  const [shippingResult, setShippingResult] = useState<ShippingQuote | null>(null);
  const [shippingBusy, setShippingBusy] = useState(false);
  const [checkoutShipping, setCheckoutShipping] = useState<ShippingQuote | null>(null);
  const [checkoutShippingBusy, setCheckoutShippingBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [registerBusy, setRegisterBusy] = useState(false);
  const [deleteAccountBusy, setDeleteAccountBusy] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [customerLoginError, setCustomerLoginError] = useState("");
  const [merchantLoginError, setMerchantLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [adminOrders, setAdminOrders] = useState<MerchantOrder[]>([]);
  const [deliveryDateBusy, setDeliveryDateBusy] = useState("");
  const [deliveryDateDrafts, setDeliveryDateDrafts] = useState<Record<string, string>>({});
  const [loadingAdminOrders, setLoadingAdminOrders] = useState(false);
  const [lastOrder, setLastOrder] = useState<StoreOrder | null>(null);
  const [productForm, setProductForm] = useState<ProductRequest>(EMPTY_PRODUCT);
  const [productOptionDrafts, setProductOptionDrafts] = useState(EMPTY_PRODUCT_OPTION_DRAFTS);
  const [productNumericDrafts, setProductNumericDrafts] = useState(EMPTY_PRODUCT_NUMERIC_DRAFTS);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [storeSettingsDraft, setStoreSettingsDraft] = useState<StoreSettingsDraft>(() => toStoreSettingsDraft(DEFAULT_STORE_SETTINGS));
  const [storeSettingsBusy, setStoreSettingsBusy] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [ambientImageFile, setAmbientImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState("");
  const [ambientImagePreview, setAmbientImagePreview] = useState("");
  const [orderForm, setOrderForm] = useState<OrderForm>({ name: "", email: "", phone: "", zipCode: "", address: "", quantity: 1 });
  const [customerLogin, setCustomerLogin] = useState({ email: "", password: "" });
  const [merchantLogin, setMerchantLogin] = useState({ email: "", password: "", cpf: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "", password: "" });

  const lastOrderRef = useRef<StoreOrder | null>(null);
  const ordersLoadingRef = useRef(false);
  const adminOrdersLoadingRef = useRef(false);
  const noticeTimer = useRef<number | undefined>(undefined);
  const idempotencyPayload = useRef("");
  const idempotencyKey = useRef("");
  const imagePreviewUrls = useRef<string[]>([]);
  const showroomObserver = useRef<IntersectionObserver | null>(null);

  const departments = ["Todos os departamentos", ...new Set(products.map((product) => product.department).filter(Boolean))];
  const visibleProducts = products.filter((product) => {
    const inDepartment = selectedDepartment === "Todos os departamentos" || product.department === selectedDepartment;
    return inDepartment && matchesProductSearch(product, search);
  });
  const departmentProducts = products
    .filter((product) => product.department === selectedDepartment && (!featuredOnly || product.featured))
    .sort((a, b) => {
      if (sortOrder === "price-asc") return a.price - b.price;
      if (sortOrder === "price-desc") return b.price - a.price;
      if (sortOrder === "name") return a.title.localeCompare(b.title, "pt-BR");
      return Number(b.featured) - Number(a.featured);
    });
  const featuredProducts = products.filter((product) => product.featured);
  const showroomProducts = (featuredProducts.length ? featuredProducts : products).slice(0, 5);
  const showroomProduct = showroomProducts.length ? showroomProducts[activeShowroomIndex % showroomProducts.length] : null;
  const highlightedProduct = departmentProducts.find((product) => product.featured) || departmentProducts[0] || null;
  const relatedProducts = activeProduct
    ? products.filter((product) => product.id !== activeProduct.id && product.department === activeProduct.department)
    : [];
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const checkoutTotal = checkoutFromCart
    ? cartTotal
    : Number(checkoutProduct?.price || 0) * Number(orderForm.quantity || 1);
  const checkoutOptionsValid = checkoutFromCart
    ? cartItems.length > 0 && cartItems.every((line) => hasRequiredSelections(line.product, line.selection))
    : checkoutProduct !== null && hasRequiredSelections(checkoutProduct, checkoutSelection);
  const whatsappNumber = storeSettings.whatsappNumber.replace(/\D/g, "");
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre os produtos da loja.")}`
    : "";
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const catalog = await storeApi.products();
        if (!active) return;
        setProducts(catalog);
        setCartItems((current) => current.map((line) => {
          const currentProduct = catalog.find((product) => product.id === line.product.id);
          return currentProduct ? { ...line, product: currentProduct } : line;
        }).filter((line) => line.product.active !== false));
        setProductError("");
      } catch (error) {
        if (active) setProductError(storeApi.errorMessage(error, "Não foi possível carregar o catálogo do banco de dados."));
      } finally {
        if (active) setProductLoading(false);
      }

      try {
        const remoteBanners = await storeApi.banners();
        if (active && remoteBanners.length) setBanners(remoteBanners);
      } catch {
        // Keep the presentation banners while the API is offline.
      }

      try {
        const settings = await storeApi.storeSettings();
        if (active) setStoreSettings(settings);
      } catch {
        // Keep the default customer-facing store information when settings are unavailable.
      }
    })();

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (role !== "customer") return;
    void refreshProfile(false);
  }, [role]);

  useEffect(() => {
    if (role === "merchant") {
      setScreen("admin");
      void loadMerchantSettings();
    }
  }, [role]);

  useEffect(() => {
    localStorage.setItem("loja_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setBannerIndex((current) => (current + 1) % banners.length), 6500);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (!window.IntersectionObserver || screen !== "home") return;
    const timer = window.setTimeout(() => {
      const steps = document.querySelectorAll<HTMLElement>("[data-showroom-index]");
      if (!steps.length) return;
      const observer = new IntersectionObserver((entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (active) setActiveShowroomIndex(Number((active.target as HTMLElement).dataset["showroomIndex"] || 0));
      }, { rootMargin: "-32% 0px -32% 0px", threshold: [0, 0.12, 0.24, 0.36, 0.48] });
      steps.forEach((step) => observer.observe(step));
      showroomObserver.current = observer;
    }, 60);
    return () => {
      window.clearTimeout(timer);
      showroomObserver.current?.disconnect();
    };
  }, [screen, products]);

  useEffect(() => {
    if (role === "customer" && (screen === "account" || screen === "success")) {
      const timer = window.setInterval(() => { void loadOrders(false); }, 10000);
      return () => window.clearInterval(timer);
    }
    if (role === "merchant" && screen === "admin") {
      const timer = window.setInterval(() => { void loadAdminOrders(false); }, 10000);
      return () => window.clearInterval(timer);
    }
    return undefined;
  }, [role, screen]);

  useEffect(() => () => {
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    showroomObserver.current?.disconnect();
    imagePreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

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
    setSelectedDepartment("Todos os departamentos");
    setActiveProduct(null);
    setCheckoutProduct(null);
    setCheckoutFromCart(false);
    setSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseDepartment(department: string): void {
    setSelectedDepartment(department);
    setSearch("");
    setFeaturedOnly(false);
    setSortOrder("featured");
    setDepartmentMenuOpen(false);
    setScreen(department === "Todos os departamentos" ? "home" : "department");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectProduct(product: Product, selection: ProductSelection = EMPTY_SELECTION): void {
    if (screen === "home" || screen === "department" || screen === "cart") setReturnScreen(screen);
    setActiveProduct(product);
    setSelectedOptions(selection);
    goToScreen("product");
  }

  function backToCatalog(): void {
    setScreen(returnScreen);
    setActiveProduct(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addToCart(product: Product, selection: ProductSelection = EMPTY_SELECTION): void {
    if (!isUuid(product.id)) {
      showNotice("Este item é demonstrativo e não pode ser adicionado à sacola.");
      return;
    }
    if (!hasRequiredSelections(product, selection)) {
      showNotice("Escolha as opções disponíveis do produto antes de continuar.");
      return;
    }
    setCartItems((current) => {
      const key = `${product.id}:${JSON.stringify(selection)}`;
      const existing = current.find((line) => cartLineKey(line) === key);
      return existing
        ? current.map((line) => cartLineKey(line) === key ? { ...line, quantity: Math.min(99, line.quantity + 1) } : line)
        : [...current, { product, quantity: 1, selection }];
    });
    showNotice(`${product.title} foi adicionado à sacola.`);
  }

  function setCartQuantity(key: string, value: number): void {
    const quantity = Math.max(1, Math.min(99, Math.floor(Number(value) || 1)));
    setCartItems((current) => current.map((line) => cartLineKey(line) === key ? { ...line, quantity } : line));
  }

  function removeCartItem(key: string): void {
    setCartItems((current) => current.filter((line) => cartLineKey(line) !== key));
  }

  function updateCartSelection(key: string, field: keyof ProductSelection, value: string | null): void {
    setCartItems((current) => {
      const updated = current.map((line) => cartLineKey(line) === key
        ? { ...line, selection: { ...line.selection, [field]: value } }
        : line);
      return updated.reduce<CartLine[]>((merged, line) => {
        const index = merged.findIndex((item) => cartLineKey(item) === cartLineKey(line));
        const existing = merged[index];
        if (existing) {
          merged[index] = { ...existing, quantity: Math.min(99, existing.quantity + line.quantity) };
        } else {
          merged.push(line);
        }
        return merged;
      }, []);
    });
  }

  function beginCartCheckout(): void {
    if (!cartItems.length) {
      showNotice("Sua sacola está vazia. Escolha um móvel para continuar.");
      return;
    }
    setCheckoutFromCart(true);
    setCheckoutProduct(cartItems[0].product);
    setCheckoutSelection(cartItems[0].selection);
    setCheckoutShipping(null);
    idempotencyPayload.current = "";
    idempotencyKey.current = "";
    setOrderForm({ name: account?.name || "", email: account?.email || "", phone: account?.phone || "", zipCode: "", address: "", quantity: 1 });
    if (role === "customer" && account) goToScreen("checkout");
    else {
      goToScreen("account");
      showNotice("Entre ou crie uma conta para concluir a compra da sua sacola.");
    }
  }

  function openCheckout(product: Product): void {
    if (!isUuid(product.id)) {
      showNotice("Este item é apenas demonstrativo. Atualize o catálogo para comprar.");
      return;
    }
    setCheckoutProduct(product);
    setCheckoutSelection(selectedOptions);
    setCheckoutFromCart(false);
    setShippingResult(null);
    setCheckoutShipping(null);
    setOrderForm({
      name: role === "customer" && account ? account.name : "",
      email: role === "customer" && account ? account.email : "",
      phone: role === "customer" && account ? account.phone || "" : "",
      zipCode: "",
      address: "",
      quantity: 1,
    });
    idempotencyPayload.current = "";
    idempotencyKey.current = "";
    if (role !== "customer" || !account) {
      goToScreen("account");
      showNotice("Entre ou crie uma conta de cliente para continuar a compra e acompanhar o pedido.");
      return;
    }
    goToScreen("checkout");
  }

  async function calculateShipping(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const zipCode = brazilianZipCodeDigits(shippingZip);
    if (!activeProduct || zipCode.length !== 8) {
      showNotice("Informe um CEP válido com 8 números.");
      return;
    }
    setShippingBusy(true);
    try {
      setShippingResult(await storeApi.shipping(zipCode, activeProduct.id));
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "Não foi possível calcular o frete."));
    } finally {
      setShippingBusy(false);
    }
  }

  async function calculateCheckoutShipping(): Promise<void> {
    const zipCode = brazilianZipCodeDigits(orderForm.zipCode);
    if (zipCode.length !== 8 || !checkoutProduct) {
      showNotice("Informe um CEP válido com 8 números.");
      return;
    }
    setCheckoutShippingBusy(true);
    try {
      setCheckoutShipping(await storeApi.shipping(zipCode, checkoutProduct.id));
    } catch (error) {
      setCheckoutShipping(null);
      showNotice(storeApi.errorMessage(error, "Não foi possível consultar o frete."));
    } finally {
      setCheckoutShippingBusy(false);
    }
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if ((!checkoutFromCart && !checkoutProduct) || (checkoutFromCart && !cartItems.length)) {
      showNotice("Não há produtos disponíveis para enviar neste pedido.");
      return;
    }
    if (role !== "customer" || !account) {
      goToScreen("account");
      showNotice("Entre na sua conta de cliente para enviar o pedido.");
      return;
    }
    if (!checkoutOptionsValid) {
      showNotice("Escolha todas as opções disponíveis dos produtos antes de enviar o pedido.");
      return;
    }
    const items = checkoutFromCart
      ? cartItems.map(({ product, quantity, selection }) => ({ productId: product.id, quantity, selection }))
      : checkoutProduct
        ? [{ productId: checkoutProduct.id, quantity: Number(orderForm.quantity), selection: checkoutSelection }]
        : [];
    if (!items.length) {
      showNotice("Não há produtos disponíveis para enviar neste pedido.");
      return;
    }
    const request: OrderRequest = {
      customer: null,
      zipCode: brazilianZipCodeDigits(orderForm.zipCode),
      address: orderForm.address.trim(),
      items,
    };
    const serialized = JSON.stringify(request);
    if (serialized !== idempotencyPayload.current) {
      idempotencyPayload.current = serialized;
      idempotencyKey.current = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
    setCheckoutBusy(true);
    try {
      const createdOrder = await storeApi.createOrder(request, idempotencyKey.current);
      lastOrderRef.current = createdOrder;
      setLastOrder(createdOrder);
      idempotencyPayload.current = "";
      idempotencyKey.current = "";
      if (checkoutFromCart) setCartItems([]);
      setOrders((current) => [createdOrder, ...current.filter((order) => order.id !== createdOrder.id)]);
      setCheckoutFromCart(false);
      setCheckoutProduct(null);
      setScreen("payment");
      void loadOrders(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "O backend recusou o pedido. Confira os dados e tente novamente."));
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function startItauPayment(): Promise<void> {
    if (!lastOrder) return;
    setPaymentBusy(true);
    try {
      const intent = await storeApi.createPaymentIntent(lastOrder.id, `itau-${lastOrder.id}`);
      if (!intent.checkoutUrl) throw new Error("O Itaú não retornou o endereço para pagamento.");
      window.location.assign(intent.checkoutUrl);
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "O pagamento on-line está indisponível. Consulte as orientações da loja."));
    } finally {
      setPaymentBusy(false);
    }
  }

  function saveSession(response: { accessToken: string; role: string; email: string; name: string; phone?: string }): void {
    sessionStorage.setItem("loja_access_token", response.accessToken);
    sessionStorage.setItem("loja_user_role", response.role);
    sessionStorage.setItem("loja_user_email", response.email);
    sessionStorage.setItem("loja_user_name", response.name || "");
    sessionStorage.setItem("loja_user_phone", response.phone || "");
  }

  async function loginCustomer(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setCustomerLoginError("");
    setLoginBusy(true);
    try {
      const response = await storeApi.customerLogin(customerLogin.email.trim(), customerLogin.password);
      saveSession(response);
      setRole("customer");
      const customer: AccountProfile = { id: "", name: response.name, email: response.email, phone: response.phone || "", role: "CUSTOMER" };
      setAccount(customer);
      setCustomerLogin((current) => ({ ...current, password: "" }));
      if (checkoutProduct || checkoutFromCart) {
        setOrderForm((current) => ({ ...current, name: customer.name, email: customer.email, phone: customer.phone }));
        goToScreen("checkout");
        showNotice("Conta conectada. Confira o endereço de entrega para continuar.");
      } else {
        goToScreen("account");
        showNotice("Bem-vindo(a) à sua conta.");
      }
      void refreshProfile(true);
      void loadOrders(true, true);
    } catch (error) {
      setCustomerLoginError(storeApi.errorMessage(error, "E-mail ou senha inválidos. Confira os dados e tente novamente."));
    } finally {
      setLoginBusy(false);
    }
  }

  async function loginMerchant(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMerchantLoginError("");
    setLoginBusy(true);
    try {
      const response = await storeApi.merchantLogin(merchantLogin.email, merchantLogin.password, merchantLogin.cpf.replace(/\D/g, ""));
      saveSession(response);
      setRole("merchant");
      setAccount({ id: "", name: response.name, email: response.email, phone: "", role: "MERCHANT" });
      setScreen("admin");
      setMerchantLogin((current) => ({ ...current, password: "" }));
      showNotice("Acesso administrativo liberado.");
      void Promise.all([loadAdminProducts(), loadAdminOrders(true, true)]);
    } catch (error) {
      setMerchantLoginError(storeApi.errorMessage(error, "E-mail, senha ou CPF do lojista inválidos. Confira os dados e tente novamente."));
    } finally {
      setLoginBusy(false);
    }
  }

  async function registerCustomer(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setRegisterError("");
    setRegisterBusy(true);
    const credentials = { email: registerForm.email.trim(), password: registerForm.password };
    try {
      await storeApi.register(registerForm);
      setCustomerLogin((current) => ({ ...current, email: credentials.email }));
      setRegisterForm({ name: "", email: "", phone: "", password: "" });
      await finishCustomerLogin(credentials.email, credentials.password, "Cadastro criado. Você já entrou na sua conta.");
    } catch (error) {
      if (isRequestConflict(error)) {
        setCustomerLogin((current) => ({ ...current, email: credentials.email }));
        try {
          await finishCustomerLogin(credentials.email, credentials.password, "Essa conta já existia e você entrou nela.");
        } catch {
          goToScreen("account");
          setCustomerLoginError("Este e-mail já está cadastrado. Confira a senha da sua conta e tente entrar.");
        }
      } else {
        setRegisterError(storeApi.errorMessage(error, "Não foi possível criar a conta. Confira os dados e tente novamente."));
      }
    } finally {
      setRegisterBusy(false);
    }
  }

  async function finishCustomerLogin(email: string, password: string, message: string): Promise<void> {
    try {
      const response = await storeApi.customerLogin(email, password);
      saveSession(response);
      setRole("customer");
      const customer: AccountProfile = { id: "", name: response.name, email: response.email, phone: response.phone || "", role: "CUSTOMER" };
      setAccount(customer);
      if (checkoutProduct || checkoutFromCart) {
        setOrderForm((current) => ({ ...current, name: customer.name, email: customer.email, phone: customer.phone }));
        goToScreen("checkout");
      } else {
        goToScreen("account");
      }
      void refreshProfile(true);
      void loadOrders(true, true);
      showNotice(message);
    } catch (error) {
      goToScreen("account");
      setCustomerLoginError(`Cadastro realizado, mas não foi possível entrar automaticamente. ${storeApi.errorMessage(error, "Entre com seu e-mail e senha.")}`);
      throw error;
    }
  }

  async function refreshProfile(showError: boolean): Promise<void> {
    try {
      const profile = await storeApi.profile();
      setAccount(profile);
      sessionStorage.setItem("loja_user_email", profile.email);
      sessionStorage.setItem("loja_user_name", profile.name);
      sessionStorage.setItem("loja_user_phone", profile.phone || "");
    } catch (error) {
      if (showError) showNotice(storeApi.errorMessage(error, "Não foi possível carregar sua conta."));
    }
  }

  async function loadOrders(showError = true, force = false): Promise<void> {
    if (ordersLoadingRef.current || (!force && role !== "customer")) return;
    ordersLoadingRef.current = true;
    setLoadingOrders(true);
    try {
      const fetchedOrders = await storeApi.orders();
      const pendingOrder = lastOrderRef.current;
      const matchingOrder = pendingOrder ? fetchedOrders.find((order) => order.id === pendingOrder.id) : undefined;
      if (matchingOrder) {
        lastOrderRef.current = matchingOrder;
        setLastOrder(matchingOrder);
      }
      setOrders(pendingOrder && !matchingOrder
        ? [pendingOrder, ...fetchedOrders]
        : fetchedOrders);
    } catch (error) {
      if (showError) showNotice(storeApi.errorMessage(error, "Não foi possível carregar os pedidos."));
    } finally {
      ordersLoadingRef.current = false;
      setLoadingOrders(false);
    }
  }

  async function loadAdminOrders(showError = true, force = false): Promise<void> {
    if (adminOrdersLoadingRef.current || (!force && role !== "merchant")) return;
    adminOrdersLoadingRef.current = true;
    setLoadingAdminOrders(true);
    try {
      setAdminOrders(await storeApi.merchantOrders());
    } catch (error) {
      if (showError) showNotice(storeApi.errorMessage(error, "Não foi possível carregar as vendas."));
    } finally {
      adminOrdersLoadingRef.current = false;
      setLoadingAdminOrders(false);
    }
  }

  async function loadAdminProducts(): Promise<void> {
    setAdminBusy(true);
    try {
      setAdminProducts(await storeApi.adminProducts());
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "Não foi possível carregar os produtos do lojista."));
    } finally {
      setAdminBusy(false);
    }
  }

  async function loadMerchantSettings(): Promise<void> {
    try {
      const settings = await storeApi.storeSettings();
      setStoreSettings(settings);
      setStoreSettingsDraft(toStoreSettingsDraft(settings));
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "Não foi possível carregar as configurações da loja."));
    }
  }

  function updateStoreSettingsField<K extends keyof StoreSettingsDraft>(field: K, value: StoreSettingsDraft[K]): void {
    setStoreSettingsDraft((current) => ({ ...current, [field]: value }));
  }

  async function saveStoreSettings(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsePrice = (value: string): number | null => {
      let normalized = value.trim().replace(/\s/g, "");
      if (normalized.includes(",")) normalized = normalized.replace(/\./g, "").replace(",", ".");
      if (!normalized) return null;
      const price = Number(normalized);
      if (!Number.isFinite(price) || price < 0) throw new Error("Informe valores de frete válidos e não negativos.");
      return Math.round(price * 100) / 100;
    };

    let payload: StoreSettings;
    try {
      payload = {
        whatsappNumber: storeSettingsDraft.whatsappNumber.trim(),
        saoPauloCityPrice: parsePrice(storeSettingsDraft.saoPauloCityPrice),
        saoPauloStatePrice: parsePrice(storeSettingsDraft.saoPauloStatePrice),
        deliveryOutsideStateMessage: storeSettingsDraft.deliveryOutsideStateMessage.trim(),
        paymentMessage: storeSettingsDraft.paymentMessage.trim(),
      };
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Confira os valores informados.");
      return;
    }

    setStoreSettingsBusy(true);
    try {
      const saved = await storeApi.updateStoreSettings(payload);
      setStoreSettings(saved);
      setStoreSettingsDraft(toStoreSettingsDraft(saved));
      showNotice("Configurações da loja salvas.");
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "Não foi possível salvar as configurações da loja."));
    } finally {
      setStoreSettingsBusy(false);
    }
  }

  function showAccount(): void {
    goToScreen("account");
    if (role === "customer") {
      void refreshProfile(true);
      void loadOrders();
    }
  }

  function enterAdmin(): void {
    goToScreen("admin");
    if (role === "merchant") {
      void Promise.all([loadAdminProducts(), loadAdminOrders()]);
    }
  }

  async function logout(): Promise<void> {
    ["loja_access_token", "loja_user_role", "loja_user_email", "loja_user_name", "loja_user_phone"]
      .forEach((key) => sessionStorage.removeItem(key));
    lastOrderRef.current = null;
    setLastOrder(null);
    setAccount(null);
    setRole(null);
    setOrders([]);
    setAdminOrders([]);
    setScreen("home");
    setSelectedDepartment("Todos os departamentos");
    setActiveProduct(null);
    showNotice("Você saiu da sua conta.");
  }

  async function updateOrderStatus(order: MerchantOrder, status: string): Promise<void> {
    try {
      const updated = await storeApi.updateOrderStatus(order.id, status);
      setAdminOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
      showNotice(`Status do pedido ${updated.orderNumber} atualizado.`);
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "Não foi possível atualizar o status do pedido."));
    }
  }

  async function updateDeliveryDate(order: MerchantOrder, deliveryDate: string | null): Promise<void> {
    setDeliveryDateBusy(order.id);
    try {
      const updated = await storeApi.updateDeliveryDate(order.id, deliveryDate);
      setAdminOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
      setDeliveryDateDrafts((current) => ({ ...current, [order.id]: formatDateForInput(updated.deliveryDate) }));
      showNotice(deliveryDate ? `Previsão de entrega do pedido ${updated.orderNumber} atualizada.` : "Previsão de entrega removida.");
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "Não foi possível atualizar a data de entrega."));
    } finally {
      setDeliveryDateBusy("");
    }
  }

  function saveDeliveryDate(order: MerchantOrder): void {
    const draft = deliveryDateDrafts[order.id] ?? formatDateForInput(order.deliveryDate);
    if (!draft.trim()) {
      void updateDeliveryDate(order, null);
      return;
    }
    const date = parseDateInput(draft);
    if (!date) {
      showNotice("Digite uma data válida no formato DD/MM/AAAA.");
      return;
    }
    void updateDeliveryDate(order, date);
  }

  async function deleteCustomerAccount(): Promise<void> {
    if (role !== "customer" || !account) return;
    if (!window.confirm("Excluir sua conta permanentemente? Seus dados pessoais serão removidos e o acesso aos pedidos será encerrado.")) return;
    setDeleteAccountBusy(true);
    try {
      await storeApi.deleteAccount();
      await logout();
      showNotice("Sua conta foi excluída e os dados pessoais foram removidos.");
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "Não foi possível excluir sua conta."));
    } finally {
      setDeleteAccountBusy(false);
    }
  }

  function beginEdit(product: Product): void {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      description: product.description,
      department: product.department,
      price: Number(product.price),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
      width: Number(product.width),
      height: Number(product.height),
      image: product.image,
      ambientImage: product.ambientImage || null,
      featured: product.featured,
      ironColors: product.ironColors || [],
      woodColors: product.woodColors || [],
      woodTypes: product.woodTypes || [],
      upholsteryColors: product.upholsteryColors || [],
    });
    setProductNumericDrafts({
      price: String(product.price),
      oldPrice: product.oldPrice == null ? "" : String(product.oldPrice),
      width: String(product.width),
      height: String(product.height),
    });
    setProductOptionDrafts({
      ironColors: (product.ironColors || []).join(", "),
      woodColors: (product.woodColors || []).join(", "),
      woodTypes: (product.woodTypes || []).join(", "),
      upholsteryColors: (product.upholsteryColors || []).join(", "),
    });
    setMainImageFile(null);
    setAmbientImageFile(null);
    setMainImagePreview(storeApi.imageUrl(product.image));
    setAmbientImagePreview(storeApi.imageUrl(product.ambientImage || product.image));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit(): void {
    imagePreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    imagePreviewUrls.current = [];
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setProductNumericDrafts(EMPTY_PRODUCT_NUMERIC_DRAFTS);
    setProductOptionDrafts(EMPTY_PRODUCT_OPTION_DRAFTS);
    setMainImageFile(null);
    setAmbientImageFile(null);
    setMainImagePreview("");
    setAmbientImagePreview("");
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>, type: "main" | "ambient"): void {
    const input = event.currentTarget;
    const file = input.files?.[0] || null;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showNotice("Escolha um arquivo de imagem.");
      input.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotice("A imagem deve ter até 10 MB.");
      input.value = "";
      return;
    }
    const preview = URL.createObjectURL(file);
    imagePreviewUrls.current.push(preview);
    if (type === "main") {
      setMainImageFile(file);
      setMainImagePreview(preview);
    } else {
      setAmbientImageFile(file);
      setAmbientImagePreview(preview);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAdminBusy(true);
    try {
      let image = productForm.image;
      let ambientImage = productForm.ambientImage;
      if (mainImageFile) image = (await storeApi.uploadProductImage(mainImageFile)).url;
      if (!image) throw new Error("Escolha a imagem principal do produto.");
      if (ambientImageFile) ambientImage = (await storeApi.uploadProductImage(ambientImageFile)).url;
      const payload: ProductRequest = {
        ...productForm,
        price: Number(productNumericDrafts.price),
        oldPrice: productNumericDrafts.oldPrice.trim() ? Number(productNumericDrafts.oldPrice) : null,
        width: Number(productNumericDrafts.width),
        height: Number(productNumericDrafts.height),
        image,
        ambientImage: ambientImage || image,
        ironColors: parseProductOptions(productOptionDrafts.ironColors),
        woodColors: parseProductOptions(productOptionDrafts.woodColors),
        woodTypes: parseProductOptions(productOptionDrafts.woodTypes),
        upholsteryColors: parseProductOptions(productOptionDrafts.upholsteryColors),
      };
      const saved = editingProduct
        ? await storeApi.updateProduct(editingProduct.id, payload)
        : await storeApi.createProduct(payload);
      setAdminProducts((current) => [saved, ...current.filter((product) => product.id !== saved.id)]);
      setProducts((current) => [saved, ...current.filter((product) => product.id !== saved.id)]);
      cancelEdit();
      showNotice("Produto salvo e publicado no catálogo.");
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "Não foi possível salvar o produto."));
    } finally {
      setAdminBusy(false);
    }
  }

  async function deleteProduct(product: Product): Promise<void> {
    if (!window.confirm(`Excluir “${product.title}” da vitrine?`)) return;
    try {
      await storeApi.deleteProduct(product.id);
      setAdminProducts((current) => current.filter((item) => item.id !== product.id));
      setProducts((current) => current.filter((item) => item.id !== product.id));
      if (editingProduct?.id === product.id) cancelEdit();
      showNotice("Produto removido da vitrine.");
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "Não foi possível excluir o produto."));
    }
  }

  function updateProductField<K extends keyof ProductRequest>(field: K, value: ProductRequest[K]): void {
    setProductForm((current) => ({ ...current, [field]: value }));
  }

  function updateOrderField<K extends keyof OrderForm>(field: K, value: OrderForm[K]): void {
    setOrderForm((current) => ({ ...current, [field]: value }));
  }

  function updateCustomerLogin(field: keyof typeof customerLogin, value: string): void {
    setCustomerLogin((current) => ({ ...current, [field]: value }));
  }

  function updateMerchantLogin(field: keyof typeof merchantLogin, value: string): void {
    setMerchantLogin((current) => ({ ...current, [field]: value }));
  }

  function updateRegisterForm(field: keyof typeof registerForm, value: string): void {
    setRegisterForm((current) => ({ ...current, [field]: value }));
  }

  function scrollToCatalog(): void {
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  }

  function scrollToMerchantSection(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  }

  function clearFilters(): void {
    setSearch("");
    setSelectedDepartment("Todos os departamentos");
  }

  function imageUrl(path: string | null | undefined): string {
    return storeApi.imageUrl(path);
  }

  function isRequestConflict(error: unknown): boolean {
    return Boolean(error && typeof error === "object" && "status" in error && error.status === 409);
  }

  function retryCatalog(): void {
    setProductLoading(true);
    setProductError("");
    void (async () => {
      try {
        const catalog = await storeApi.products();
        setProducts(catalog);
        setCartItems((current) => current.map((line) => {
          const currentProduct = catalog.find((product) => product.id === line.product.id);
          return currentProduct ? { ...line, product: currentProduct } : line;
        }).filter((line) => line.product.active !== false));
      } catch (error) {
        setProductError(storeApi.errorMessage(error, "Não foi possível carregar o catálogo do banco de dados."));
      } finally {
        setProductLoading(false);
      }
    })();
  }

  return (
    <div className="app-shell">
      <div className="announcement">{role === "merchant" ? <><span>PAINEL DO LOJISTA</span> gestão da Casa & Forma</> : <><span>MÓVEIS INDUSTRIAIS</span> direto do lojista <span className="announcement-dot">•</span> Consulte prazo e entrega na compra</>}</div>

      <header className={`site-header${role === "merchant" ? " merchant-header" : ""}`}>
        {role !== "merchant" ? <button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? "×" : "☰"}</button> : null}
        <button className="brand" aria-label="Casa e Forma, início" onClick={goHome}><span className="brand-mark">c.</span><span>casa<span className="brand-light">&forma</span></span></button>
        {role === "merchant" ? <nav className={`main-nav merchant-nav${mobileMenuOpen ? " nav-open" : ""}`}>
          <button onClick={() => scrollToMerchantSection("merchant-products")}>Produtos</button>
          <button onClick={() => scrollToMerchantSection("merchant-sales")}>Pedidos e vendas</button>
          <button onClick={() => scrollToMerchantSection("merchant-settings")}>Configurações</button>
        </nav> : <nav className={`main-nav${mobileMenuOpen ? " nav-open" : ""}`}>
          <button className="nav-department" onClick={() => setDepartmentMenuOpen((open) => !open)}>Departamentos <span>{departmentMenuOpen ? "⌃" : "⌄"}</span></button>
          <button onClick={() => chooseDepartment("Todos os departamentos")}>Novidades</button>
          <button onClick={() => chooseDepartment("Todos os departamentos")}>Mais vendidos</button>
        </nav>}
        {role === "merchant" ? <div className="header-actions"><span className="connected-pill">{account?.name || "Lojista"}</span><button className="text-link" onClick={() => void logout()}>Sair</button></div> : <div className="header-actions">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.currentTarget.value);
                setSelectedDepartment("Todos os departamentos");
                setScreen("home");
              }}
              placeholder="O que você procura?"
              aria-label="Buscar produtos"
            />
            {search ? <button aria-label="Limpar busca" onClick={() => setSearch("")}>×</button> : null}
          </label>
          <button className="icon-button user-action" aria-label="Minha conta" title="Minha conta" onClick={showAccount}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path></svg>
          </button>
          <button className="icon-button bag-action" aria-label="Abrir sacola" title="Sacola" onClick={() => goToScreen("cart")}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z"></path><path d="M9 9V6a3 3 0 0 1 6 0v3"></path></svg>
            {cartCount ? <span className="bag-count">{cartCount}</span> : null}
          </button>
        </div>}
        {role !== "merchant" && departmentMenuOpen ? (
          <div className="department-popover">
            {departments.map((department) => <button key={department} onClick={() => chooseDepartment(department)}>{department}<span>↗</span></button>)}
          </div>
        ) : null}
      </header>

      <main>
        {screen === "home" ? (
          <>
            <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(29,39,32,.76) 0%, rgba(29,39,32,.33) 43%, rgba(29,39,32,0) 100%), url("${banners[bannerIndex]?.image || PROMO_BANNERS[0].image}")` }}>
              <div className="hero-content">
                <div className="eyebrow hero-eyebrow"><span className="eyebrow-line"></span>{banners[bannerIndex]?.eyebrow || "CASA LEVE, VIDA LEVE"}</div>
                <h1>{banners[bannerIndex]?.title || "Descubra nossa coleção."}</h1>
                <p>{banners[bannerIndex]?.text}</p>
                <button className="button button-cream" onClick={scrollToCatalog}>{banners[bannerIndex]?.cta || "Descobrir a coleção"} <span>→</span></button>
              </div>
              <span className="hero-tag">{banners[bannerIndex]?.tag || "NOVIDADES"}</span>
              {banners.length > 1 ? (
                <div className="hero-controls">
                  <button aria-label="Promoção anterior" onClick={() => setBannerIndex((bannerIndex - 1 + banners.length) % banners.length)}>‹</button>
                  <span>{String(bannerIndex + 1).padStart(2, "0")} <i></i> {String(banners.length).padStart(2, "0")}</span>
                  <button aria-label="Próxima promoção" onClick={() => setBannerIndex((bannerIndex + 1) % banners.length)}>›</button>
                </div>
              ) : null}
            </section>

            <div className="benefit-strip">
              <div><span className="benefit-icon">↗</span><span><b>Atendimento em todo o Brasil</b><small>Frete fora de SP sob consulta</small></span></div>
              <div><span className="benefit-icon">✓</span><span><b>Compra segura</b><small>Seus dados protegidos</small></span></div>
              <div><span className="benefit-icon">◎</span><span><b>Feito com cuidado</b><small>Qualidade em cada detalhe</small></span></div>
              <div><span className="benefit-icon">⌂</span><span><b>Design que acolhe</b><small>Peças para viver bem</small></span></div>
            </div>

            {showroomProducts.length ? (
              <section className="ambient-section" id="showroom">
                <div className="ambient-heading">
                  <div><div className="eyebrow"><span className="eyebrow-line"></span>MÓVEIS NO SEU AMBIENTE</div><h2>Role e descubra cada detalhe.</h2><p>Enquanto você percorre a página, veja os destaques em diferentes ambientes.</p></div>
                  <span className="ambient-count">{String(activeShowroomIndex + 1).padStart(2, "0")} / {String(showroomProducts.length).padStart(2, "0")}</span>
                </div>
                <div className="ambient-layout">
                  <aside className="ambient-stage" aria-live="polite">
                    {showroomProduct ? (
                      <>
                        <div className="ambient-stage-photo"><img src={imageUrl(showroomProduct.ambientImage || showroomProduct.image)} alt={`${showroomProduct.title} em ambiente decorado`} /></div>
                        <div className="ambient-stage-shade"></div>
                        <div className="ambient-stage-content">
                          <span>{showroomProduct.department} · EM DESTAQUE</span><h3>{showroomProduct.title}</h3>
                          <PriceLine product={showroomProduct} />
                          <button className="button button-cream" onClick={() => selectProduct(showroomProduct)}>Conhecer produto <span>↗</span></button>
                        </div>
                        <div className="ambient-progress" aria-label="Produtos em destaque">
                          {showroomProducts.map((product, index) => <button key={product.id} className={index === activeShowroomIndex ? "active" : ""} aria-label={`Ver destaque: ${product.title}`} onClick={() => setActiveShowroomIndex(index)} />)}
                        </div>
                      </>
                    ) : null}
                  </aside>
                  <div className="ambient-steps">
                    {showroomProducts.map((product, index) => (
                      <article key={product.id} className={`ambient-step${activeShowroomIndex === index ? " is-active" : ""}`} data-showroom-index={index}>
                        <div className="ambient-step-kicker"><span>{String(index + 1).padStart(2, "0")}</span><span>{product.department}</span></div>
                        <h3>{product.title}</h3><p>{product.description}</p>
                        <div className="ambient-step-bottom"><PriceLine product={product} /><button className="text-link" onClick={() => selectProduct(product)}>Ver produto <span>→</span></button></div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            <section className="catalog-section" id="catalogo">
              <div className="section-heading">
                <div><div className="eyebrow"><span className="eyebrow-line"></span>ESCOLHAS COM INTENÇÃO</div><h2>{search ? "Resultados da busca" : "Encontre seu próximo favorito"}</h2><p>{search ? `Produtos encontrados para “${search}”` : "Peças especiais para cada cantinho da sua casa."}</p></div>
                <button className="text-link" onClick={clearFilters}>Ver coleção completa <span>→</span></button>
              </div>
              <div className="catalog-tools"><div className="department-chips">{departments.map((department) => <button key={department} className={`chip${selectedDepartment === department ? " active" : ""}`} onClick={() => chooseDepartment(department)}>{department}</button>)}</div><span className="product-count">{visibleProducts.length} produtos</span></div>
              {productLoading ? <div className="empty-state"><h3>Carregando catálogo...</h3></div>
                : productError ? <div className="empty-state"><span>!</span><h3>Não foi possível abrir o catálogo</h3><p>{productError}</p><button className="button button-dark" onClick={retryCatalog}>Tentar novamente</button></div>
                  : visibleProducts.length ? <div className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} onSelect={selectProduct} onWishlist={() => showNotice("Favorito salvo nesta sessão.")} />)}</div>
                    : <div className="empty-state"><span>⌕</span><h3>{products.length ? "Nenhum produto encontrado" : "Ainda não há produtos publicados"}</h3><p>{products.length ? "Tente outro termo ou escolha um departamento." : "Os produtos serão exibidos aqui assim que o lojista cadastrar os móveis no painel."}</p>{products.length ? <button className="button button-dark" onClick={clearFilters}>Limpar filtros</button> : null}</div>}
            </section>

            <section className="newsletter">
              <div><div className="eyebrow"><span className="eyebrow-line"></span>UM POUCO DE INSPIRAÇÃO</div><h2>Design industrial<br />para viver bem.</h2><p>Novidades, ideias e condições especiais direto na sua caixa de entrada.</p></div>
              <form onSubmit={(event) => { event.preventDefault(); showNotice("Cadastro recebido! Em breve você terá novidades."); }}>
                <label htmlFor="newsletter-email">Seu melhor e-mail</label><div className="newsletter-input"><input id="newsletter-email" type="email" placeholder="voce@email.com" required /><button aria-label="Assinar novidades">→</button></div><small>Ao se cadastrar, você concorda em receber novidades da loja.</small>
              </form>
            </section>
          </>
        ) : null}

        {screen === "department" ? (
          <section className="department-page">
            <button className="back-link" onClick={goHome}>← Voltar para a loja</button>
            <div className="department-heading"><div className="eyebrow"><span className="eyebrow-line"></span>COLEÇÃO CASA & FORMA</div><h1>{selectedDepartment}</h1><p>Peças industriais escolhidas para trazer presença e funcionalidade ao seu espaço.</p></div>
            {highlightedProduct ? <article className="department-highlight"><img src={imageUrl(highlightedProduct.image)} alt={highlightedProduct.title} /><div className="department-highlight-copy"><div className="eyebrow"><span className="eyebrow-line"></span>DESTAQUE DO DEPARTAMENTO</div><h2>{highlightedProduct.title}</h2><p>{highlightedProduct.description}</p><PriceLine product={highlightedProduct} /><button className="button button-dark" onClick={() => selectProduct(highlightedProduct)}>Conhecer produto →</button></div></article> : null}
            <div className="department-toolbar"><div><h2>Todos os produtos</h2><span>{departmentProducts.length} itens</span></div><div className="department-filters"><button className={`chip${featuredOnly ? " active" : ""}`} onClick={() => setFeaturedOnly((current) => !current)}>✧ Em destaque</button><label className="sort-select">Ordenar por<select value={sortOrder} onChange={(event) => setSortOrder(event.currentTarget.value)}><option value="featured">Destaques primeiro</option><option value="price-desc">Maior preço</option><option value="price-asc">Menor preço</option><option value="name">Nome</option></select></label></div></div>
            {departmentProducts.length ? <div className="department-product-grid">{departmentProducts.map((product) => <ProductCard key={product.id} product={product} onSelect={selectProduct} />)}</div> : <div className="empty-state"><h3>Não há produtos neste departamento</h3><p>Quando o lojista publicar itens nessa coleção, eles aparecerão aqui.</p></div>}
          </section>
        ) : null}

        {screen === "product" && activeProduct ? (
          <section className="detail-page">
            <button className="back-link" onClick={backToCatalog}>← Voltar para a loja</button>
            <div className="detail-layout">
              <div className="detail-image"><img src={imageUrl(activeProduct.image)} alt={activeProduct.title} /></div>
              <div className="detail-info">
                <div className="eyebrow"><span className="eyebrow-line"></span>{activeProduct.department}</div><h1>{activeProduct.title}</h1>
                <div className="rating detail-rating">★★★★★ <span>Peça selecionada</span></div>
                <div className="detail-price">{activeProduct.oldPrice ? <span className="old-price">{money(activeProduct.oldPrice)}</span> : null}<strong>{money(activeProduct.price)}</strong></div>
                <p className="detail-description">{activeProduct.description}</p>
                <ProductSelectionFields product={activeProduct} selection={selectedOptions} onChange={(field, value) => setSelectedOptions((current) => ({ ...current, [field]: value }))} heading="Escolha as opções deste produto" />
                <div className="dimension-box"><span>Dimensões aproximadas</span><b>{activeProduct.width} cm <i>largura</i> <span>×</span> {activeProduct.height} cm <i>altura</i></b></div>
                <div className="product-buy-actions"><button className="button button-outline" onClick={() => addToCart(activeProduct, selectedOptions)}>Adicionar à sacola</button><button className="button button-dark buy-button" onClick={() => openCheckout(activeProduct)}>Comprar agora <span>→</span></button></div>
                <div className="shipping-box"><div className="shipping-title"><span>⌖</span><span>Consulte o frete e a região de entrega</span></div><form onSubmit={(event) => void calculateShipping(event)}><input value={shippingZip} onChange={(event) => { setShippingZip(formatBrazilianZipCode(event.currentTarget.value)); setShippingResult(null); }} inputMode="numeric" maxLength={9} autoComplete="postal-code" placeholder="00000-000" aria-label="CEP para cálculo de frete" /><button disabled={shippingBusy}>{shippingBusy ? "Consultando..." : "Consultar"}</button></form><a className="text-link zip-link" href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noreferrer">Não sei meu CEP</a>{shippingResult ? <div className="shipping-result"><strong>{shippingResult.city} — {shippingResult.state}</strong>{shippingResult.price != null ? <span>Frete: {money(shippingResult.price)}</span> : null}{shippingResult.estimatedDays != null ? <span>Prazo estimado: {shippingResult.estimatedDays} dias</span> : null}<small>{shippingResult.message}</small></div> : null}</div>
                <div className="secure-note">✓ Compra segura <span></span> Atendimento humanizado</div>
              </div>
            </div>
            {relatedProducts.length ? <section className="related-section"><div className="related-heading"><div><div className="eyebrow"><span className="eyebrow-line"></span>RECOMENDADOS PARA VOCÊ</div><h2>Produtos relacionados</h2><p>Outros móveis de {activeProduct.department.toLocaleLowerCase("pt-BR")}.</p></div></div><div className="related-grid">{relatedProducts.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} onSelect={selectProduct} />)}</div></section> : null}
          </section>
        ) : null}

        {screen === "cart" ? (
          <section className="form-page cart-page"><button className="back-link" onClick={goHome}>← Voltar para a loja</button><div className="eyebrow"><span className="eyebrow-line"></span>SUA SELEÇÃO</div><h1>Sacola de compras</h1>
            {cartItems.length ? <div className="cart-layout"><div className="cart-lines">{cartItems.map((line) => <article key={cartLineKey(line)} className="cart-line"><button className="cart-product-image" onClick={() => selectProduct(line.product, line.selection)}><img src={imageUrl(line.product.image)} alt={line.product.title} /></button><div className="cart-line-info"><span>{line.product.department}</span><button className="cart-product-title" onClick={() => selectProduct(line.product, line.selection)}>{line.product.title}</button><strong>{money(line.product.price)}</strong><div className="cart-product-selections">{PRODUCT_OPTION_FIELDS.map(({ selection, label }) => line.selection[selection] ? <span key={selection}>{label}: {line.selection[selection]}</span> : null)}</div><div className="cart-quantity"><label>Quantidade<input type="number" min="1" max="99" value={line.quantity} onChange={(event) => setCartQuantity(cartLineKey(line), Number(event.currentTarget.value))} /></label><button className="text-link danger-link" onClick={() => removeCartItem(cartLineKey(line))}>Remover</button></div></div><b className="cart-line-total">{money(line.product.price * line.quantity)}</b></article>)}</div><aside className="cart-summary"><div className="eyebrow"><span className="eyebrow-line"></span>RESUMO</div><div className="summary-row"><span>{cartCount} {cartCount === 1 ? "item" : "itens"}</span><b>{money(cartTotal)}</b></div><div className="summary-total"><span>Subtotal</span><b>{money(cartTotal)}</b></div><small>Frete e prazo serão confirmados com a loja.</small><button className="button button-dark cart-checkout-button" onClick={beginCartCheckout}>Continuar para entrega →</button></aside></div>
              : <div className="cart-empty"><span>sua sacola está vazia</span><p>Veja os móveis disponíveis e adicione os que gostar.</p><button className="button button-dark" onClick={goHome}>Ver produtos →</button></div>}
          </section>
        ) : null}

        {screen === "checkout" && checkoutProduct ? (
          <section className="form-page checkout-page"><button className="back-link" onClick={() => selectProduct(checkoutProduct, checkoutSelection)}>← Voltar ao produto</button><div className="checkout-layout"><div><div className="eyebrow"><span className="eyebrow-line"></span>FINALIZE SEU PEDIDO</div><h1>Seus dados de entrega</h1>
            {role === "customer" && account ? <div className="form-card"><div className="eyebrow"><span className="eyebrow-line"></span>CONTA DO CLIENTE</div><h2>{account.name}</h2><p>{account.email} · {account.phone}</p><p className="backend-note">O pedido será vinculado à sua conta; seus dados de contato não precisam ser digitados novamente.</p></div> : <p className="form-intro">Para comprar e acompanhar a produção e a entrega, entre na sua conta ou crie um cadastro de cliente.</p>}
            <form className="form-card" onSubmit={(event) => void submitOrder(event)}><div className="form-grid">{!(role === "customer" && account) ? <p className="full-field account-required">Sua conta é necessária para vincular e acompanhar este pedido. <button type="button" className="text-link" onClick={() => goToScreen("account")}>Entrar / criar conta</button></p> : null}
              <label>CEP<input value={orderForm.zipCode} onChange={(event) => { updateOrderField("zipCode", formatBrazilianZipCode(event.currentTarget.value)); setCheckoutShipping(null); }} inputMode="numeric" required minLength={8} maxLength={9} autoComplete="postal-code" placeholder="00000-000" /></label>
              <label className="full-field">Endereço de entrega<input value={orderForm.address} onChange={(event) => updateOrderField("address", event.currentTarget.value)} autoComplete="street-address" required placeholder="Rua, número, complemento e cidade" /></label>
              <label>Quantidade<input value={orderForm.quantity} onChange={(event) => updateOrderField("quantity", Number(event.currentTarget.value))} type="number" min="1" max="99" required /></label>
              {checkoutFromCart ? cartItems.map((line, index) => <ProductSelectionFields key={`${line.product.id}-${index}`} product={line.product} selection={line.selection} className="full-field" heading={`Opções — ${line.product.title}`} onChange={(field, value) => updateCartSelection(cartLineKey(line), field, value)} />) : <ProductSelectionFields product={checkoutProduct} selection={checkoutSelection} className="full-field" heading={`Opções — ${checkoutProduct.title}`} onChange={(field, value) => { setCheckoutSelection((current) => ({ ...current, [field]: value })); setSelectedOptions((current) => ({ ...current, [field]: value })); }} />}
            </div>{!checkoutOptionsValid ? <p className="form-error">Escolha todas as opções disponíveis antes de continuar.</p> : null}<button type="button" className="text-link checkout-shipping-button" onClick={() => void calculateCheckoutShipping()} disabled={checkoutShippingBusy}>{checkoutShippingBusy ? "Consultando CEP..." : "Consultar frete e prazo"}</button>{checkoutShipping ? <div className="shipping-result"><strong>{checkoutShipping.city} — {checkoutShipping.state}</strong>{checkoutShipping.price != null ? <span>Frete: {money(checkoutShipping.price)}</span> : null}{checkoutShipping.estimatedDays != null ? <span>Prazo estimado: {checkoutShipping.estimatedDays} dias</span> : null}<small>{checkoutShipping.message}</small></div> : null}<div className="privacy-note">✓ Seus dados serão usados para processar o pedido e entrar em contato sobre a entrega.</div><button className="button button-dark form-submit" disabled={checkoutBusy}>{checkoutBusy ? "Enviando pedido..." : "Enviar pedido"} →</button><p className="backend-note">{storeSettings.paymentMessage}</p></form>
          </div><aside className="order-summary"><div className="eyebrow"><span className="eyebrow-line"></span>RESUMO</div>{checkoutFromCart ? cartItems.map((line) => <div key={cartLineKey(line)} className="summary-product"><img src={imageUrl(line.product.image)} alt={line.product.title} /><div><strong>{line.product.title}</strong><span>{line.quantity} × {money(line.product.price)}</span>{PRODUCT_OPTION_FIELDS.map(({ selection, label }) => line.selection[selection] ? <span key={selection}>{label}: {line.selection[selection]}</span> : null)}<b>{money(line.product.price * line.quantity)}</b></div></div>) : <div className="summary-product"><img src={imageUrl(checkoutProduct.image)} alt={checkoutProduct.title} /><div><strong>{checkoutProduct.title}</strong><span>{checkoutProduct.department}</span>{PRODUCT_OPTION_FIELDS.map(({ selection, label }) => checkoutSelection[selection] ? <span key={selection}>{label}: {checkoutSelection[selection]}</span> : null)}<b>{money(checkoutProduct.price * orderForm.quantity)}</b></div></div>}<div className="summary-row"><span>Subtotal</span><b>{money(checkoutTotal)}</b></div><div className="summary-row"><span>Frete</span><span>{checkoutShipping?.price != null ? money(checkoutShipping.price) : checkoutShipping?.category === "CONTACT" ? "A combinar" : checkoutShipping ? "A combinar com a loja" : "Consulte pelo CEP"}</span></div><div className="summary-total"><span>Total estimado</span><b>{money(checkoutTotal + (checkoutShipping?.price || 0))}</b></div><small>{checkoutShipping?.message || "Consulte o frete e o prazo pelo CEP."}</small></aside></div></section>
        ) : null}

        {screen === "payment" && lastOrder ? <section className="form-page payment-page"><div className="eyebrow"><span className="eyebrow-line"></span>PAGAMENTO DO PEDIDO</div><h1>Pedido {lastOrder.orderNumber}</h1><p>Frete: <strong>{lastOrder.shippingCost > 0 ? money(lastOrder.shippingCost) : "A combinar com a loja"}</strong></p><p>Total do pedido: <strong>{money(lastOrder.total)}</strong></p><div className="payment-status"><strong>Como pagar</strong><p>{storeSettings.paymentMessage}</p></div><div className="payment-actions"><button className="button button-dark" disabled={paymentBusy} onClick={() => void startItauPayment()}>{paymentBusy ? "Conectando ao Itaú..." : "Pagar pelo Itaú"}</button><button className="text-link" onClick={() => setScreen("success")}>Continuar sem pagamento on-line</button><button className="text-link" onClick={showAccount}>Ver meus pedidos</button></div></section> : null}

        {screen === "success" ? <section className="form-page success-page"><div className="success-icon">✓</div><div className="eyebrow"><span className="eyebrow-line"></span>PEDIDO RECEBIDO</div><h1>Obrigado pela sua compra.</h1><p>Pedido {lastOrder?.orderNumber} registrado com sucesso. Status atual: <strong>{statusLabel(lastOrder?.status || "RECEIVED")}</strong>.</p><button className="button button-dark" onClick={showAccount}>Acompanhar pedido →</button><button className="text-link" onClick={goHome}>Voltar para a loja</button></section> : null}

        {screen === "account" ? (
          <section className="form-page account-page"><button className="back-link" onClick={goHome}>← Voltar para a loja</button>
            {role === "customer" && account ? <div className="customer-dashboard"><div className="customer-dashboard-heading"><div><div className="eyebrow"><span className="eyebrow-line"></span>MINHA CONTA</div><h1>Olá, {account.name}.</h1><p>{account.email} · {account.phone}</p></div><button className="text-link" onClick={() => void logout()}>Sair da conta</button></div><section className="orders-panel"><div className="orders-heading"><h2>Meus pedidos</h2><button className="text-link" disabled={loadingOrders} onClick={() => void loadOrders()}>{loadingOrders ? "Atualizando..." : "Atualizar"}</button></div>{loadingOrders && !orders.length ? <p className="account-empty">Carregando seus pedidos...</p> : orders.length ? <div className="orders-list">{orders.map((order) => <article key={order.id} className="order-row"><div className="order-main"><span>{order.orderNumber}<small>{formatOrderDate(order.createdAt)}</small></span><span className="order-status">{statusLabel(order.status)}</span><strong>{money(order.total)}</strong></div>{order.items?.length ? <ul className="order-items">{order.items.map((item) => <li key={`${order.id}-${item.productId}`}><span>{item.quantity} × {item.title}</span><strong>{money(item.lineTotal)}</strong></li>)}</ul> : null}</article>)}</div> : <p className="account-empty">Seus pedidos aparecerão aqui depois da primeira compra.</p>}</section></div>
              : <div className="account-card"><div className="eyebrow"><span className="eyebrow-line"></span>MINHA CONTA</div><h1>Entre na sua conta</h1><p className="form-intro">Acesse seus pedidos e use seus dados salvos para comprar.</p><form className="form-card" onSubmit={(event) => void loginCustomer(event)}><label>E-mail<input value={customerLogin.email} onChange={(event) => updateCustomerLogin("email", event.currentTarget.value)} type="email" autoComplete="username" required placeholder="voce@email.com" /></label><label>Senha<input value={customerLogin.password} onChange={(event) => updateCustomerLogin("password", event.currentTarget.value)} type="password" autoComplete="current-password" required placeholder="Sua senha" /></label>{customerLoginError ? <p className="form-error" role="alert">{customerLoginError}</p> : null}<button className="button button-dark form-submit" disabled={loginBusy}>{loginBusy ? "Entrando..." : "Entrar"} →</button></form><div className="account-switch"><span>Ainda não tem cadastro?</span><button onClick={() => goToScreen("register")}>Criar conta de cliente</button></div></div>}
          </section>
        ) : null}

        {screen === "account" && role === "customer" && account ? <section className="form-page account-actions-page"><div className="orders-panel"><div className="orders-heading"><h2>Previsões de entrega</h2></div>{orders.length ? <div className="orders-list">{orders.map((order) => <article key={order.id} className="order-row"><div className="order-main"><span>{order.orderNumber}</span>{order.deliveryDate ? <strong>{formatDeliveryDate(order.deliveryDate)}</strong> : <span className="order-status">A combinar com a loja</span>}</div></article>)}</div> : <p className="account-empty">As datas informadas pela loja aparecerão aqui.</p>}</div><div className="account-delete-panel"><h2>Excluir minha conta</h2><p>A exclusão remove seus dados pessoais e encerra o acesso à conta. Os registros de pedidos permanecem apenas de forma anonimizada.</p><button className="button button-outline danger-button" disabled={deleteAccountBusy} onClick={() => void deleteCustomerAccount()}>{deleteAccountBusy ? "Excluindo..." : "Excluir conta permanentemente"}</button></div></section> : null}

        {screen === "register" ? <section className="form-page account-page"><button className="back-link" onClick={() => goToScreen("account")}>← Voltar para entrar</button><div className="account-card"><div className="eyebrow"><span className="eyebrow-line"></span>BEM-VINDA(O)</div><h1>Crie sua conta</h1><p className="form-intro">Acompanhe seus pedidos e use seus dados na próxima compra.</p><form className="form-card" onSubmit={(event) => void registerCustomer(event)}><label>Nome completo<input value={registerForm.name} onChange={(event) => updateRegisterForm("name", event.currentTarget.value)} autoComplete="name" required placeholder="Seu nome" /></label><label>E-mail<input value={registerForm.email} onChange={(event) => updateRegisterForm("email", event.currentTarget.value)} type="email" autoComplete="email" required placeholder="voce@email.com" /></label><label>Telefone / WhatsApp<input value={registerForm.phone} onChange={(event) => updateRegisterForm("phone", event.currentTarget.value)} type="tel" autoComplete="tel" required minLength={10} placeholder="(11) 99999-9999" /></label><label>Senha<input value={registerForm.password} onChange={(event) => updateRegisterForm("password", event.currentTarget.value)} type="password" autoComplete="new-password" minLength={8} required placeholder="Mínimo de 8 caracteres" /></label>{registerError ? <p className="form-error" role="alert">{registerError}</p> : null}<button className="button button-dark form-submit" disabled={registerBusy}>{registerBusy ? "Criando conta..." : "Criar minha conta"} →</button></form></div></section> : null}

        {screen === "admin" ? <section className="form-page admin-page"><button className="back-link" onClick={goHome}>{role === "merchant" ? "← Painel principal" : "← Voltar para a loja"}</button>
          {role !== "merchant" ? <div className="account-card"><div className="admin-icon">LOJA</div><div className="eyebrow"><span className="eyebrow-line"></span>ÁREA RESTRITA</div><h1>Entrada do lojista</h1><p className="form-intro">Use os dados de acesso da loja.</p><form className="form-card" onSubmit={(event) => void loginMerchant(event)}><label>E-mail<input value={merchantLogin.email} onChange={(event) => updateMerchantLogin("email", event.currentTarget.value)} type="email" autoComplete="username" required placeholder="seu@email.com" /></label><label>Senha<input value={merchantLogin.password} onChange={(event) => updateMerchantLogin("password", event.currentTarget.value)} type="password" autoComplete="current-password" required placeholder="Sua senha" /></label><label>CPF cadastrado<input value={merchantLogin.cpf} onChange={(event) => updateMerchantLogin("cpf", event.currentTarget.value)} inputMode="numeric" maxLength={14} required placeholder="Somente números ou com pontuação" /></label>{merchantLoginError ? <p className="form-error" role="alert">{merchantLoginError}</p> : null}<button className="button button-dark form-submit" disabled={loginBusy}>{loginBusy ? "Validando..." : "Entrar no painel"} →</button></form><p className="backend-note">O acesso é administrado pelo responsável da loja.</p></div>
            : <div className="admin-content"><div className="admin-heading"><div><div className="eyebrow"><span className="eyebrow-line"></span>PAINEL DO LOJISTA</div><h1>Gerenciar produtos</h1><p>Publique, edite preços e atualize o catálogo.</p></div><div className="admin-session"><span className="connected-pill">Conta autenticada</span><button className="text-link" onClick={() => void logout()}>Sair</button></div></div>
              <form id="merchant-products" className="form-card product-admin-form" onSubmit={(event) => void saveProduct(event)}><div className="admin-form-heading"><h2>{editingProduct ? "Editar produto" : "Adicionar produto"}</h2>{editingProduct ? <button type="button" className="text-link" onClick={cancelEdit}>Cancelar edição</button> : null}</div><div className="form-grid">
                <label className="full-field">Título do produto<input value={productForm.title} onChange={(event) => updateProductField("title", event.currentTarget.value)} required maxLength={140} placeholder="Ex.: Estante Linha Bruta" /></label>
                <label className="full-field">Descrição<textarea value={productForm.description} onChange={(event) => updateProductField("description", event.currentTarget.value)} required rows={4} placeholder="Materiais, cuidados e características do móvel." /></label>
                <label>Departamento<input value={productForm.department} onChange={(event) => updateProductField("department", event.currentTarget.value)} required placeholder="Ex.: Estantes" /></label>
                <label>Preço atual (R$)<input value={productNumericDrafts.price} onChange={(event) => { const value = event.currentTarget.value; setProductNumericDrafts((current) => ({ ...current, price: value })); }} type="number" min="0.01" step="0.01" required /></label>
                <label>Preço anterior (R$)<input value={productNumericDrafts.oldPrice} onChange={(event) => { const value = event.currentTarget.value; setProductNumericDrafts((current) => ({ ...current, oldPrice: value })); }} type="number" min="0" step="0.01" placeholder="Opcional" /></label>
                <label>Largura (cm)<input value={productNumericDrafts.width} onChange={(event) => { const value = event.currentTarget.value; setProductNumericDrafts((current) => ({ ...current, width: value })); }} type="number" min="0.01" step="0.1" required /></label>
                <label>Altura (cm)<input value={productNumericDrafts.height} onChange={(event) => { const value = event.currentTarget.value; setProductNumericDrafts((current) => ({ ...current, height: value })); }} type="number" min="0.01" step="0.1" required /></label>
                <label>Opções de cor do ferro<textarea value={productOptionDrafts.ironColors} onChange={(event) => { const value = event.currentTarget.value; setProductOptionDrafts((current) => ({ ...current, ironColors: value })); }} rows={2} placeholder="Preto, branco, dourado (opcional)" /><small>Digite uma opção por linha ou separe por vírgulas. Espaços dentro do nome são aceitos.</small></label>
                <label>Opções de cor da madeira<textarea value={productOptionDrafts.woodColors} onChange={(event) => { const value = event.currentTarget.value; setProductOptionDrafts((current) => ({ ...current, woodColors: value })); }} rows={2} placeholder="Natural, nogueira (opcional)" /><small>Digite uma opção por linha ou separe por vírgulas. Espaços dentro do nome são aceitos.</small></label>
                <label>Tipos de madeira<textarea value={productOptionDrafts.woodTypes} onChange={(event) => { const value = event.currentTarget.value; setProductOptionDrafts((current) => ({ ...current, woodTypes: value })); }} rows={2} placeholder="Pinus, eucalipto (opcional)" /><small>Digite uma opção por linha ou separe por vírgulas. Espaços dentro do nome são aceitos.</small></label>
                <label>Opções de cor do estofado<textarea value={productOptionDrafts.upholsteryColors} onChange={(event) => { const value = event.currentTarget.value; setProductOptionDrafts((current) => ({ ...current, upholsteryColors: value })); }} rows={2} placeholder="Cinza, bege (opcional)" /><small>Digite uma opção por linha ou separe por vírgulas. Espaços dentro do nome são aceitos.</small></label>
                <label className="full-field image-upload-field">Imagem principal do produto<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => chooseImage(event, "main")} required={!editingProduct} /><small>JPG, PNG, WEBP ou GIF; até 10 MB.</small>{mainImagePreview ? <img className="upload-preview" src={mainImagePreview} alt="Prévia da imagem principal" /> : null}</label>
                <label className="full-field image-upload-field">Imagem do móvel no ambiente (opcional)<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => chooseImage(event, "ambient")} /><small>Se não escolher outra, será usada a imagem principal.</small>{ambientImagePreview ? <img className="upload-preview" src={ambientImagePreview} alt="Prévia da imagem no ambiente" /> : null}</label>
                <label className="featured-toggle full-field"><input checked={productForm.featured} onChange={(event) => updateProductField("featured", event.currentTarget.checked)} type="checkbox" /><span><strong>Destacar este produto</strong><small>Exibe no showroom dinâmico e no filtro de destaques.</small></span></label>
              </div><div className="admin-form-bottom"><span>Os campos e as imagens serão atualizados na loja.</span><button className="button button-dark" disabled={adminBusy}>{adminBusy ? "Enviando..." : editingProduct ? "Salvar alterações" : "Publicar produto"} ✓</button></div></form>
              <section className="admin-products-panel"><div className="admin-products-heading"><h2>Produtos publicados</h2><span>{adminProducts.length} itens</span></div>{adminBusy && !adminProducts.length ? <p className="account-empty">Carregando...</p> : adminProducts.length ? <div className="admin-products-list">{adminProducts.map((product) => <article key={product.id} className="admin-product-row"><img src={imageUrl(product.image)} alt={product.title} /><div className="admin-product-copy"><span>{product.department}</span><strong>{product.title}</strong><small>{product.width} × {product.height} cm</small></div><div className="admin-product-price"><strong>{money(product.price)}</strong></div><div className="admin-product-actions"><button type="button" className="text-link" onClick={() => beginEdit(product)}>Editar</button><button type="button" className="text-link danger-link" onClick={() => void deleteProduct(product)}>Excluir</button></div></article>)}</div> : <p className="account-empty">Ainda não há produtos cadastrados. Use o formulário para publicar o primeiro.</p>}</section>
              <section id="merchant-sales" className="admin-products-panel sales-panel"><div className="admin-products-heading"><div><h2>Painel de vendas</h2><p>Acompanhe os pedidos, previsão de entrega e cada etapa para o cliente.</p></div><button className="text-link" disabled={loadingAdminOrders} onClick={() => void loadAdminOrders()}>{loadingAdminOrders ? "Atualizando..." : "Atualizar vendas"}</button></div>{loadingAdminOrders && !adminOrders.length ? <p className="account-empty">Carregando vendas...</p> : adminOrders.length ? <div className="sales-list">{adminOrders.map((order) => <article key={order.id} className="sale-row"><div className="sale-heading"><div><strong>{order.orderNumber}</strong><span>{formatOrderDate(order.createdAt)}</span></div><b>{money(order.total)}</b></div><div className="sale-customer"><strong>{order.customerName}</strong><span>{order.customerEmail} · {order.customerPhone}</span><span>{order.address} — CEP {order.zipCode}</span></div><ul className="sale-items">{order.items.map((item) => <li key={`${order.id}-${item.productId}`}>{item.quantity} × {item.title}{PRODUCT_OPTION_FIELDS.map(({ selection, label }) => item.selection?.[selection] ? ` · ${label}: ${item.selection[selection]}` : "")}<span>{money(item.lineTotal)}</span></li>)}</ul><label className="sale-status">Status do pedido<select value={order.status} onChange={(event) => void updateOrderStatus(order, event.currentTarget.value)}>{ORDER_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><div className="delivery-date-editor"><label>Previsão de entrega (DD/MM/AAAA)<input type="text" value={deliveryDateDrafts[order.id] ?? formatDateForInput(order.deliveryDate)} onChange={(event) => { const value = formatBrazilianDateInput(event.currentTarget.value); setDeliveryDateDrafts((current) => ({ ...current, [order.id]: value })); }} placeholder="DD/MM/AAAA" inputMode="numeric" maxLength={10} disabled={deliveryDateBusy === order.id} /></label><button className="text-link" disabled={deliveryDateBusy === order.id} onClick={() => saveDeliveryDate(order)}>{deliveryDateBusy === order.id ? "Salvando..." : "Salvar data"}</button>{order.deliveryDate ? <button className="text-link danger-link" disabled={deliveryDateBusy === order.id} onClick={() => void updateDeliveryDate(order, null)}>Remover previsão</button> : null}</div></article>)}</div> : <p className="account-empty">Ainda não há vendas registradas.</p>}</section>
              <section id="merchant-settings" className="admin-products-panel merchant-settings-panel"><div className="eyebrow"><span className="eyebrow-line"></span>CONFIGURAÇÕES DA LOJA</div><h2>Informações para seus clientes</h2><p>Atualize o contato, o frete e as orientações de pagamento exibidos na loja.</p>
                <form className="merchant-settings-form" onSubmit={(event) => void saveStoreSettings(event)}><div className="form-grid">
                  <label className="full-field">WhatsApp da loja<input type="tel" value={storeSettingsDraft.whatsappNumber} onChange={(event) => updateStoreSettingsField("whatsappNumber", event.currentTarget.value)} maxLength={24} placeholder="5511999999999" /><small>Inclua o código do país e o DDD. Deixe vazio para ocultar o botão de WhatsApp.</small></label>
                  <label>Frete na cidade de São Paulo (R$)<input type="text" inputMode="decimal" value={storeSettingsDraft.saoPauloCityPrice} onChange={(event) => updateStoreSettingsField("saoPauloCityPrice", event.currentTarget.value)} placeholder="Ex.: 50,00" /><small>Deixe vazio para combinar com o cliente.</small></label>
                  <label>Frete nas demais cidades de SP (R$)<input type="text" inputMode="decimal" value={storeSettingsDraft.saoPauloStatePrice} onChange={(event) => updateStoreSettingsField("saoPauloStatePrice", event.currentTarget.value)} placeholder="Ex.: 80,00" /><small>Deixe vazio para combinar com o cliente.</small></label>
                  <label className="full-field">Mensagem de entrega fora de SP<textarea value={storeSettingsDraft.deliveryOutsideStateMessage} onChange={(event) => updateStoreSettingsField("deliveryOutsideStateMessage", event.currentTarget.value)} rows={3} required maxLength={500} /></label>
                  <label className="full-field">Orientações de pagamento<textarea value={storeSettingsDraft.paymentMessage} onChange={(event) => updateStoreSettingsField("paymentMessage", event.currentTarget.value)} rows={3} required maxLength={500} /></label>
                </div><div className="admin-form-bottom"><span>As alterações serão exibidas para quem visitar a loja.</span><button className="button button-dark" disabled={storeSettingsBusy}>{storeSettingsBusy ? "Salvando..." : "Salvar configurações"} ✓</button></div></form>
              </section>
            </div>}
        </section> : null}
      </main>

      <footer className="site-footer"><button className="brand footer-brand" onClick={goHome}><span className="brand-mark">c.</span><span>casa<span className="brand-light">&forma</span></span></button><p>{role === "merchant" ? "Área administrativa da Casa & Forma." : "Móveis industriais para morar com personalidade."}</p>{role === "merchant" ? <div className="footer-links"><button onClick={() => scrollToMerchantSection("merchant-products")}>Produtos</button><button onClick={() => scrollToMerchantSection("merchant-sales")}>Pedidos e vendas</button><button onClick={() => scrollToMerchantSection("merchant-settings")}>Configurações</button><button onClick={() => void logout()}>Sair</button></div> : <div className="footer-links"><button onClick={showAccount}>Minha conta</button><button onClick={() => goToScreen("cart")}>Sacola</button><button onClick={() => showNotice("Entre em contato pelo WhatsApp para receber ajuda.")}>Atendimento</button><button onClick={enterAdmin}>Área do lojista</button></div>}<div className="footer-bottom"><span>© 2026 Casa & Forma. Todos os direitos reservados.</span><span>Feito para viver bem.</span></div></footer>
      {role !== "merchant" ? whatsappUrl ? <a className="whatsapp-fab" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Fale conosco pelo WhatsApp"><span>◉</span><span>Fale com a gente</span></a> : <button className="whatsapp-fab" onClick={() => showNotice("Configure VITE_WHATSAPP_NUMBER no arquivo .env para ativar o WhatsApp.")} aria-label="Configurar WhatsApp"><span>◉</span><span>Fale com a gente</span></button> : null}
      {notice ? <div className="toast" role="status">{notice}<button aria-label="Fechar aviso" onClick={() => setNotice("")}>×</button></div> : null}
    </div>
  );
}
