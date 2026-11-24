import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { AccountProfile, OrderRequest, Product, ProductSelection, ShippingQuote, StoreOrder } from "../../app/models";
import { storeApi } from "../../services/api";
import { brazilianZipCodeDigits, formatBrazilianZipCode } from "../../app/form-formatters";
import { EMPTY_SELECTION, hasRequiredSelections, isUuid } from "../cart/cartUtils";
import { clearPendingOrderAttempt, getOrCreateOrderAttempt, readPendingOrderAttempt } from "./orderAttempt";
import type { CartLine } from "../cart/cartTypes";
import type { OrderForm } from "./checkoutTypes";
import type { StoreScreen, UserRole } from "../../routes/types";

interface UseCheckoutProps {
  role: UserRole;
  account: AccountProfile | null;
  products: Product[];
  productLoading: boolean;
  productError: string;
  cartItems: CartLine[];
  cartTotal: number;
  setCartItems: React.Dispatch<React.SetStateAction<CartLine[]>>;
  showNotice: (message: string) => void;
  setScreen: (screen: StoreScreen) => void;
  setReturnScreen: (screen: StoreScreen) => void;
  onOrderSuccess: (order: StoreOrder) => void;
}

export function useCheckout({
  role,
  account,
  products,
  productLoading,
  productError,
  cartItems,
  cartTotal,
  setCartItems,
  showNotice,
  setScreen,
  setReturnScreen,
  onOrderSuccess,
}: UseCheckoutProps) {
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [checkoutSelection, setCheckoutSelection] = useState<ProductSelection>(EMPTY_SELECTION);
  const [checkoutFromCart, setCheckoutFromCart] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<ProductSelection>(EMPTY_SELECTION);

  const [orderForm, setOrderForm] = useState<OrderForm>({
    name: "",
    email: "",
    phone: "",
    zipCode: "",
    address: "",
    quantity: 1,
  });

  const [shippingZip, setShippingZip] = useState("");
  const [shippingResult, setShippingResult] = useState<ShippingQuote | null>(null);
  const [shippingBusy, setShippingBusy] = useState(false);

  const [checkoutShipping, setCheckoutShipping] = useState<ShippingQuote | null>(null);
  const [checkoutShippingBusy, setCheckoutShippingBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const orderAttemptRestored = useRef(false);

  useEffect(() => {
    if (orderAttemptRestored.current || role !== "customer" || !account?.email || productLoading || productError) return;
    orderAttemptRestored.current = true;

    let attempt: ReturnType<typeof readPendingOrderAttempt>;
    try {
      attempt = readPendingOrderAttempt(account.email);
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "Não foi possível restaurar a tentativa de pedido."));
      return;
    }
    if (!attempt) return;

    const restoredLines = attempt.request.items.flatMap((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      return product && product.active !== false
        ? [{ product, quantity: item.quantity, selection: item.selection }]
        : [];
    });
    if (restoredLines.length !== attempt.request.items.length) {
      showNotice("Um ou mais produtos não estão mais disponíveis. Revise sua sacola antes de tentar novamente.");
      return;
    }

    const firstLine = restoredLines[0];
    if (!firstLine) return;
    setCheckoutProduct(firstLine.product);
    setCheckoutSelection(firstLine.selection);
    setCheckoutFromCart(attempt.fromCart);
    setCheckoutShipping(null);
    setReturnScreen(attempt.fromCart ? "cart" : "home");
    setOrderForm({
      name: account.name,
      email: account.email,
      phone: account.phone,
      zipCode: formatBrazilianZipCode(attempt.request.zipCode),
      address: attempt.request.address,
      quantity: firstLine.quantity,
    });
    if (attempt.fromCart) setCartItems(restoredLines);
    setScreen("checkout");
    showNotice("Encontramos um pedido ainda não confirmado. Confira os dados e envie novamente para reutilizar a mesma tentativa.");
  }, [account, productError, productLoading, products, role]);

  const checkoutTotal = checkoutFromCart
    ? cartTotal
    : Number(checkoutProduct?.price || 0) * Number(orderForm.quantity || 1);

  const checkoutOptionsValid = checkoutFromCart
    ? cartItems.length > 0 && cartItems.every((line) => hasRequiredSelections(line.product, line.selection))
    : checkoutProduct !== null && hasRequiredSelections(checkoutProduct, checkoutSelection);

  function openCheckout(product: Product): void {
    if (!isUuid(product.id)) {
      showNotice("Este item é apenas demonstrativo. Atualize o catálogo para comprar.");
      return;
    }
    clearPendingOrderAttempt();
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
    if (role !== "customer" || !account) {
      setScreen("account");
      showNotice("Entre ou crie uma conta de cliente para continuar a compra e acompanhar o pedido.");
      return;
    }
    setScreen("checkout");
  }

  function beginCartCheckout(): void {
    if (!cartItems.length) {
      showNotice("Sua sacola está vazia. Escolha um móvel para continuar.");
      return;
    }
    clearPendingOrderAttempt();
    setCheckoutFromCart(true);
    setCheckoutProduct(cartItems[0].product);
    setCheckoutSelection(cartItems[0].selection);
    setCheckoutShipping(null);
    setOrderForm({
      name: account?.name || "",
      email: account?.email || "",
      phone: account?.phone || "",
      zipCode: "",
      address: "",
      quantity: 1,
    });
    if (role === "customer" && account) {
      setScreen("checkout");
    } else {
      setScreen("account");
      showNotice("Entre ou crie uma conta para concluir a compra da sua sacola.");
    }
  }

  async function calculateShipping(event: FormEvent<HTMLFormElement>, activeProduct: Product | null): Promise<void> {
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
      setScreen("account");
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
    setCheckoutBusy(true);
    try {
      const attempt = getOrCreateOrderAttempt(request, account.email, checkoutFromCart);
      const createdOrder = await storeApi.createOrder(request, attempt.idempotencyKey);
      clearPendingOrderAttempt();
      if (checkoutFromCart) setCartItems([]);
      setCheckoutFromCart(false);
      setCheckoutProduct(null);
      onOrderSuccess(createdOrder);
      setScreen("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "O backend recusou o pedido. Confira os dados e tente novamente."));
    } finally {
      setCheckoutBusy(false);
    }
  }

  function updateOrderField<K extends keyof OrderForm>(field: K, value: OrderForm[K]): void {
    setOrderForm((current) => ({ ...current, [field]: value }));
  }

  function resetCheckoutState() {
    clearPendingOrderAttempt();
    setCheckoutProduct(null);
    setCheckoutFromCart(false);
  }

  return {
    checkoutProduct,
    setCheckoutProduct,
    checkoutSelection,
    setCheckoutSelection,
    checkoutFromCart,
    setCheckoutFromCart,
    selectedOptions,
    setSelectedOptions,
    orderForm,
    setOrderForm,
    updateOrderField,
    shippingZip,
    setShippingZip,
    shippingResult,
    setShippingResult,
    shippingBusy,
    checkoutShipping,
    setCheckoutShipping,
    checkoutShippingBusy,
    checkoutBusy,
    checkoutTotal,
    checkoutOptionsValid,
    openCheckout,
    beginCartCheckout,
    calculateShipping,
    calculateCheckoutShipping,
    submitOrder,
    resetCheckoutState,
  };
}
