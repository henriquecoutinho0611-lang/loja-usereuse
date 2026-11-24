import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { AccountProfile, AuthResponse, MerchantOrder, Product, ProductRequest, StoreSettings } from "../../app/models";
import { storeApi } from "../../services/api";
import { formatDateForInput, parseDateInput, parseProductOptions } from "../../app/form-formatters";
import type { StoreSettingsDraft } from "./adminTypes";
import type { StoreScreen, UserRole } from "../../routes/types";

export const ORDER_STATUSES = [
  ["RECEIVED", "Pedido recebido"],
  ["IN_PRODUCTION", "Em produção"],
  ["READY_FOR_SHIPPING", "Pronto para envio"],
  ["SHIPPED", "Saiu para entrega"],
  ["DELIVERED", "Entregue"],
  ["CANCELLED", "Cancelado"],
] as const;

export function statusLabel(status: string): string {
  return ORDER_STATUSES.find(([code]) => code === status)?.[1] || status;
}

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

export function toStoreSettingsDraft(settings: StoreSettings): StoreSettingsDraft {
  return {
    ...settings,
    saoPauloCityPrice: settings.saoPauloCityPrice == null ? "" : String(settings.saoPauloCityPrice),
    saoPauloStatePrice: settings.saoPauloStatePrice == null ? "" : String(settings.saoPauloStatePrice),
  };
}

interface UseMerchantAdminProps {
  role: UserRole;
  storeSettings: StoreSettings;
  setStoreSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
  onProductChange: (product: Product, isDelete?: boolean) => void;
  saveSession: (response: AuthResponse) => AccountProfile;
  showNotice: (message: string) => void;
  screen: StoreScreen;
  setScreen: (screen: StoreScreen) => void;
}

export function useMerchantAdmin({
  role,
  storeSettings,
  setStoreSettings,
  onProductChange,
  saveSession,
  showNotice,
  screen,
  setScreen,
}: UseMerchantAdminProps) {
  const [merchantLogin, setMerchantLogin] = useState({ email: "", password: "", cpf: "" });
  const [merchantLoginError, setMerchantLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminOrders, setAdminOrders] = useState<MerchantOrder[]>([]);
  const [adminBusy, setAdminBusy] = useState(false);
  const [loadingAdminOrders, setLoadingAdminOrders] = useState(false);
  const [deliveryDateBusy, setDeliveryDateBusy] = useState("");
  const [deliveryDateDrafts, setDeliveryDateDrafts] = useState<Record<string, string>>({});

  const [productForm, setProductForm] = useState<ProductRequest>(EMPTY_PRODUCT);
  const [productOptionDrafts, setProductOptionDrafts] = useState(EMPTY_PRODUCT_OPTION_DRAFTS);
  const [productNumericDrafts, setProductNumericDrafts] = useState(EMPTY_PRODUCT_NUMERIC_DRAFTS);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [ambientImageFile, setAmbientImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState("");
  const [ambientImagePreview, setAmbientImagePreview] = useState("");

  const [storeSettingsDraft, setStoreSettingsDraft] = useState<StoreSettingsDraft>(() => toStoreSettingsDraft(storeSettings));
  const [storeSettingsBusy, setStoreSettingsBusy] = useState(false);

  const adminOrdersLoadingRef = useRef(false);
  const adminProductsLoadingRef = useRef(false);
  const imagePreviewUrls = useRef<string[]>([]);

  useEffect(() => {
    if (role === "merchant") {
      setScreen("admin");
      void loadMerchantSettings();
      void loadAdminProducts();
      void loadAdminOrders();
    }
  }, [role]);

  useEffect(() => {
    if (role === "merchant" && screen === "admin") {
      const timer = window.setInterval(() => { void loadAdminOrders(false); }, 10000);
      return () => window.clearInterval(timer);
    }
    return undefined;
  }, [role, screen]);

  useEffect(() => () => {
    imagePreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  async function loginMerchant(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMerchantLoginError("");
    setLoginBusy(true);
    try {
      const response = await storeApi.merchantLogin(merchantLogin.email, merchantLogin.password, merchantLogin.cpf.replace(/\D/g, ""));
      saveSession(response);
      setScreen("admin");
      setMerchantLogin((current) => ({ ...current, password: "" }));
      showNotice("Acesso administrativo liberado.");
    } catch (error) {
      setMerchantLoginError(storeApi.errorMessage(error, "E-mail, senha ou CPF do lojista inválidos. Confira os dados e tente novamente."));
    } finally {
      setLoginBusy(false);
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
    if (adminProductsLoadingRef.current) return;
    adminProductsLoadingRef.current = true;
    setAdminBusy(true);
    try {
      setAdminProducts(await storeApi.adminProducts());
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "Não foi possível carregar os produtos do lojista."));
    } finally {
      adminProductsLoadingRef.current = false;
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
    setAmbientImagePreview(product.ambientImage ? storeApi.imageUrl(product.ambientImage) : "");
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
        ambientImage: ambientImage || null,
        ironColors: parseProductOptions(productOptionDrafts.ironColors),
        woodColors: parseProductOptions(productOptionDrafts.woodColors),
        woodTypes: parseProductOptions(productOptionDrafts.woodTypes),
        upholsteryColors: parseProductOptions(productOptionDrafts.upholsteryColors),
      };
      const saved = editingProduct
        ? await storeApi.updateProduct(editingProduct.id, payload)
        : await storeApi.createProduct(payload);
      setAdminProducts((current) => [saved, ...current.filter((product) => product.id !== saved.id)]);
      onProductChange(saved, false);
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
      onProductChange(product, true);
      if (editingProduct?.id === product.id) cancelEdit();
      showNotice("Produto removido da vitrine.");
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "Não foi possível excluir o produto."));
    }
  }

  function updateProductField<K extends keyof ProductRequest>(field: K, value: ProductRequest[K]): void {
    setProductForm((current) => ({ ...current, [field]: value }));
  }

  function resetAdminState() {
    setAdminOrders([]);
  }

  return {
    merchantLogin,
    setMerchantLogin,
    merchantLoginError,
    loginBusy,
    adminProducts,
    adminOrders,
    adminBusy,
    loadingAdminOrders,
    deliveryDateBusy,
    deliveryDateDrafts,
    setDeliveryDateDrafts,
    productForm,
    productOptionDrafts,
    setProductOptionDrafts,
    productNumericDrafts,
    setProductNumericDrafts,
    editingProduct,
    mainImagePreview,
    ambientImagePreview,
    storeSettingsDraft,
    storeSettingsBusy,
    loginMerchant,
    loadAdminOrders,
    loadAdminProducts,
    saveStoreSettings,
    updateStoreSettingsField,
    updateOrderStatus,
    updateDeliveryDate,
    saveDeliveryDate,
    beginEdit,
    cancelEdit,
    chooseImage,
    saveProduct,
    deleteProduct,
    updateProductField,
    resetAdminState,
  };
}
