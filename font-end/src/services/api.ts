import { environment } from "../environment";
import type {
  AccountProfile,
  AuthResponse,
  Banner,
  MerchantOrder,
  OrderRequest,
  Product,
  ProductRequest,
  ShippingQuote,
  StoreSettings,
  StoreOrder,
} from "../app/models";

interface ApiErrorBody {
  message?: string;
  detail?: string;
  errors?: Record<string, string>;
}

class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody | null,
    message?: string,
    readonly authenticationRequest = false,
  ) {
    super(message || body?.message || "A solicitação não foi concluída.");
    this.name = "ApiRequestError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

class StoreApiService {
  private readonly base = environment.apiBaseUrl.replace(/\/$/, "");

  products(): Promise<Product[]> {
    return this.request<Product[]>("/products");
  }

  banners(): Promise<Banner[]> {
    return this.request<Banner[]>("/banners");
  }

  customerLogin(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", { method: "POST", body: { email, password }, timeoutMs: 10000 });
  }

  merchantLogin(email: string, password: string, cpf: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/admin/auth/login", { method: "POST", body: { email, password, cpf }, timeoutMs: 10000 });
  }

  register(data: { name: string; email: string; phone: string; password: string }): Promise<AccountProfile> {
    return this.request<AccountProfile>("/auth/register", { method: "POST", body: data, timeoutMs: 10000 });
  }

  profile(): Promise<AccountProfile> {
    return this.request<AccountProfile>("/account/profile");
  }

  orders(): Promise<StoreOrder[]> {
    return this.request<StoreOrder[]>("/account/orders");
  }

  deleteAccount(): Promise<void> {
    return this.request<void>("/account", { method: "DELETE" });
  }

  shipping(zipCode: string, productId: string): Promise<ShippingQuote> {
    return this.request("/shipping/quote", { method: "POST", body: { zipCode, productId } });
  }

  storeSettings(): Promise<StoreSettings> {
    return this.request<StoreSettings>("/store-settings");
  }

  updateStoreSettings(data: StoreSettings): Promise<StoreSettings> {
    return this.request<StoreSettings>("/admin/settings", { method: "PUT", body: data });
  }

  createOrder(data: OrderRequest, idempotencyKey?: string): Promise<StoreOrder> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return this.request<StoreOrder>("/orders", {
      method: "POST",
      body: data,
      headers,
      timeoutMs: 20000,
    });
  }

  adminProducts(): Promise<Product[]> {
    return this.request<Product[]>("/admin/products");
  }

  merchantOrders(): Promise<MerchantOrder[]> {
    return this.request<MerchantOrder[]>("/admin/orders");
  }

  updateOrderStatus(id: string, status: string): Promise<MerchantOrder> {
    return this.request<MerchantOrder>(`/admin/orders/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } });
  }

  updateDeliveryDate(id: string, deliveryDate: string | null): Promise<MerchantOrder> {
    return this.request<MerchantOrder>(`/admin/orders/${encodeURIComponent(id)}/delivery-date`, {
      method: "PATCH",
      body: { deliveryDate },
    });
  }

  createProduct(data: ProductRequest): Promise<Product> {
    return this.request<Product>("/admin/products", { method: "POST", body: data });
  }

  updateProduct(id: string, data: ProductRequest): Promise<Product> {
    return this.request<Product>(`/admin/products/${encodeURIComponent(id)}`, { method: "PUT", body: data });
  }

  deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/admin/products/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async uploadProductImage(file: File): Promise<{ url: string }> {
    const body = new FormData();
    body.append("file", file, file.name);
    return this.request<{ url: string }>("/admin/products/images", { method: "POST", body, timeoutMs: 30000 });
  }

  imageUrl(path: string | null | undefined): string {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const origin = environment.apiOrigin || window.location.origin;
    return new URL(path.startsWith("/") ? path : `/${path}`, origin).toString();
  }

  errorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.name === "TimeoutError") {
      return "O servidor demorou para responder. Confira se o backend está iniciado e tente novamente.";
    }
    if (!(error instanceof ApiRequestError)) {
      return error instanceof Error ? error.message : fallback;
    }
    if (error.status === 401 && !error.authenticationRequest) {
      return "Sua sessão expirou ou não é mais válida. Entre novamente para continuar.";
    }
    if (error.status === 403) return "Esta conta não tem permissão para executar esta ação.";
    if (error.status === 0) {
      return "Não foi possível conectar à API. Confira se o backend está iniciado e se VITE_API_BASE_URL está configurada corretamente.";
    }
    const fieldErrors = error.body?.errors;
    if (fieldErrors && Object.keys(fieldErrors).length) return Object.values(fieldErrors).join(" ");
    if (error.body?.message) return error.body.message;
    if (error.body?.detail) return error.body.detail;
    if (error.status === 404) return "Recurso ou rota não encontrada no servidor.";
    return error.message && error.message !== "A solicitação não foi concluída."
      ? error.message
      : `${fallback} (HTTP ${error.status}).`;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);
    const headers = new Headers({ Accept: "application/json", ...options.headers });
    const isAuthenticationRequest = /\/auth\/(login|register)$/.test(path);
    const token = sessionStorage.getItem("loja_access_token");
    if (token && !isAuthenticationRequest && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let body: BodyInit | undefined;
    if (options.body instanceof FormData) {
      body = options.body;
    } else if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${this.base}${path}`, {
        method: options.method ?? "GET",
        headers,
        body,
        signal: controller.signal,
      });
      if (response.status === 401 && token && !isAuthenticationRequest) {
        window.dispatchEvent(new Event("store:auth-expired"));
      }
      const text = await response.text();
      let payload: ApiErrorBody | null = null;
      if (text) {
        try {
          payload = JSON.parse(text) as ApiErrorBody;
        } catch {
          throw new ApiRequestError(response.status, null, "O servidor retornou uma resposta inválida.", isAuthenticationRequest);
        }
      }
      if (!response.ok) throw new ApiRequestError(response.status, payload, undefined, isAuthenticationRequest);
      if (response.status === 204 || !text) return undefined as T;
      return payload as T;
    } catch (error) {
      if (error instanceof ApiRequestError) throw error;
      if (controller.signal.aborted) {
        const timeoutError = new Error("A solicitação excedeu o tempo limite.");
        timeoutError.name = "TimeoutError";
        throw timeoutError;
      }
      throw new ApiRequestError(0, null, error instanceof Error ? error.message : undefined);
    } finally {
      window.clearTimeout(timeout);
    }
  }
}

export const storeApi = new StoreApiService();
