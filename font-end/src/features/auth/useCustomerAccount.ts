import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { AccountProfile, AuthResponse, StoreOrder } from "../../app/models";
import { storeApi } from "../../services/api";
import type { StoreScreen, UserRole } from "../../routes/types";

interface UseCustomerAccountProps {
  role: UserRole;
  account: AccountProfile | null;
  saveSession: (response: AuthResponse) => AccountProfile;
  updateAccount: (profile: AccountProfile) => void;
  showNotice: (message: string) => void;
  onLoginSuccess: (customer: AccountProfile) => void;
  onLogout: () => void;
  screen: StoreScreen;
  setScreen: (screen: StoreScreen) => void;
}

function isRequestConflict(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "status" in error && (error as { status: number }).status === 409);
}

export function useCustomerAccount({
  role,
  account,
  saveSession,
  updateAccount,
  showNotice,
  onLoginSuccess,
  onLogout,
  screen,
  setScreen,
}: UseCustomerAccountProps) {
  const [customerLogin, setCustomerLogin] = useState({ email: "", password: "" });
  const [customerLoginError, setCustomerLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [registerError, setRegisterError] = useState("");
  const [registerBusy, setRegisterBusy] = useState(false);

  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [lastOrder, setLastOrder] = useState<StoreOrder | null>(null);
  const [deleteAccountBusy, setDeleteAccountBusy] = useState(false);

  const ordersLoadingRef = useRef(false);
  const lastOrderRef = useRef<StoreOrder | null>(null);

  useEffect(() => {
    if (role !== "customer") return;
    void refreshProfile(false);
  }, [role]);

  useEffect(() => {
    if (role === "customer" && (screen === "account" || screen === "success")) {
      const timer = window.setInterval(() => { void loadOrders(false); }, 10000);
      return () => window.clearInterval(timer);
    }
    return undefined;
  }, [role, screen]);

  async function refreshProfile(showError: boolean): Promise<void> {
    try {
      const profile = await storeApi.profile();
      updateAccount(profile);
    } catch (error) {
      if (showError) showNotice(storeApi.errorMessage(error, "Não foi possível carregar sua conta."));
    }
  }

  async function loadOrders(showError = true): Promise<void> {
    if (ordersLoadingRef.current) return;
    if (role !== "customer") return;
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

  async function loginCustomer(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setCustomerLoginError("");
    setLoginBusy(true);
    try {
      const response = await storeApi.customerLogin(customerLogin.email.trim(), customerLogin.password);
      const customer = saveSession(response);
      setCustomerLogin((current) => ({ ...current, password: "" }));
      onLoginSuccess(customer);
      void refreshProfile(true);
      void loadOrders(true);
    } catch (error) {
      setCustomerLoginError(storeApi.errorMessage(error, "E-mail ou senha inválidos. Confira os dados e tente novamente."));
    } finally {
      setLoginBusy(false);
    }
  }

  async function registerCustomer(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setRegisterError("");
    setRegisterBusy(true);
    let registrationSucceeded = false;
    const credentials = { email: registerForm.email.trim(), password: registerForm.password };
    try {
      await storeApi.register(registerForm);
      registrationSucceeded = true;
      setCustomerLogin((current) => ({ ...current, email: credentials.email }));
      setRegisterForm({ name: "", email: "", phone: "", password: "" });
      await finishCustomerLogin(credentials.email, credentials.password, "Cadastro criado. Você já entrou na sua conta.");
    } catch (error) {
      if (isRequestConflict(error)) {
        setCustomerLogin((current) => ({ ...current, email: credentials.email }));
        try {
          await finishCustomerLogin(credentials.email, credentials.password, "Essa conta já existia e você entrou nela.");
        } catch (loginError) {
          setScreen("account");
          setCustomerLoginError(`A conta já existe, mas não foi possível entrar automaticamente. ${storeApi.errorMessage(loginError, "Confira seu e-mail e senha.")}`);
        }
      } else if (registrationSucceeded) {
        setScreen("account");
        setCustomerLoginError(`Cadastro realizado, mas não foi possível entrar automaticamente. ${storeApi.errorMessage(error, "Entre com seu e-mail e senha.")}`);
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
      const customer = saveSession(response);
      onLoginSuccess(customer);
      void refreshProfile(true);
      void loadOrders(true);
      showNotice(message);
    } catch (error) {
      setScreen("account");
      setCustomerLoginError(`Cadastro realizado, mas não foi possível entrar automaticamente. ${storeApi.errorMessage(error, "Entre com seu e-mail e senha.")}`);
      throw error;
    }
  }

  async function deleteCustomerAccount(): Promise<void> {
    if (role !== "customer" || !account) return;
    if (!window.confirm("Excluir sua conta permanentemente? Seus dados pessoais serão removidos e o acesso aos pedidos será encerrado.")) return;
    setDeleteAccountBusy(true);
    try {
      await storeApi.deleteAccount();
      onLogout();
      showNotice("Sua conta foi excluída e os dados pessoais foram removidos.");
    } catch (error) {
      showNotice(storeApi.errorMessage(error, "Não foi possível excluir sua conta."));
    } finally {
      setDeleteAccountBusy(false);
    }
  }

  function handleOrderCreated(order: StoreOrder) {
    lastOrderRef.current = order;
    setLastOrder(order);
    setOrders((current) => [order, ...current.filter((o) => o.id !== order.id)]);
  }

  function resetCustomerState() {
    lastOrderRef.current = null;
    setLastOrder(null);
    setOrders([]);
  }

  return {
    customerLogin,
    setCustomerLogin,
    customerLoginError,
    loginBusy,
    registerForm,
    setRegisterForm,
    registerError,
    registerBusy,
    orders,
    loadingOrders,
    lastOrder,
    setLastOrder,
    deleteAccountBusy,
    loginCustomer,
    registerCustomer,
    refreshProfile,
    loadOrders,
    deleteCustomerAccount,
    handleOrderCreated,
    resetCustomerState,
  };
}
