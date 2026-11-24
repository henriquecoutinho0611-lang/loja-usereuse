import { expect, it, vi } from "vitest";
import { storeApi } from "./api";

it("does not send an old access token when a customer logs in", async () => {
  sessionStorage.clear();
  sessionStorage.setItem("loja_access_token", "expired-token");
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ accessToken: "new-token" }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);

  await storeApi.customerLogin("cliente@example.com", "password");

  const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
  expect(new Headers(request.headers).get("Authorization")).toBeNull();
  expect(JSON.parse(String(request.body))).toEqual({ email: "cliente@example.com", password: "password" });
  vi.unstubAllGlobals();
});

it("sends the customer token and idempotency key with a new order", async () => {
  sessionStorage.clear();
  sessionStorage.setItem("loja_access_token", "customer-token");
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "order-id" }), { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  const order = {
    customer: null,
    zipCode: "12345678",
    address: "Rua das Flores, 10",
    items: [{
      productId: "product-id",
      quantity: 1,
      selection: { ironColor: null, woodColor: null, woodType: null, upholsteryColor: null },
    }],
  };

  await storeApi.createOrder(order, "order-idempotency-key");

  const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
  const headers = new Headers(request.headers);
  expect(headers.get("Authorization")).toBe("Bearer customer-token");
  expect(headers.get("Idempotency-Key")).toBe("order-idempotency-key");
  vi.unstubAllGlobals();
});

it("sends the merchant token and exact payloads when changing order status and delivery date", async () => {
  sessionStorage.clear();
  sessionStorage.setItem("loja_access_token", "merchant-token");
  const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(
    new Response(JSON.stringify({ id: "order-id" }), { status: 200 }),
  ));
  vi.stubGlobal("fetch", fetchMock);

  await storeApi.updateOrderStatus("order-id", "IN_PRODUCTION");
  await storeApi.updateDeliveryDate("order-id", "2026-11-23");

  const statusRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;
  expect(fetchMock.mock.calls[0]?.[0]).toContain("/api/admin/orders/order-id/status");
  expect(statusRequest.method).toBe("PATCH");
  expect(new Headers(statusRequest.headers).get("Authorization")).toBe("Bearer merchant-token");
  expect(JSON.parse(String(statusRequest.body))).toEqual({ status: "IN_PRODUCTION" });

  const dateRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
  expect(fetchMock.mock.calls[1]?.[0]).toContain("/api/admin/orders/order-id/delivery-date");
  expect(dateRequest.method).toBe("PATCH");
  expect(new Headers(dateRequest.headers).get("Authorization")).toBe("Bearer merchant-token");
  expect(JSON.parse(String(dateRequest.body))).toEqual({ deliveryDate: "2026-11-23" });
  vi.unstubAllGlobals();
});

it("clears stale merchant sessions when the backend returns an empty 401 response", async () => {
  sessionStorage.clear();
  sessionStorage.setItem("loja_access_token", "expired-token");
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
  vi.stubGlobal("fetch", fetchMock);
  const sessionExpired = vi.fn();
  window.addEventListener("store:auth-expired", sessionExpired);

  const error = await storeApi.updateOrderStatus("order-id", "IN_PRODUCTION").catch((failure: unknown) => failure);

  expect(sessionExpired).toHaveBeenCalledOnce();
  expect(storeApi.errorMessage(error, "Falha")).toBe("Sua sessão expirou ou não é mais válida. Entre novamente para continuar.");
  window.removeEventListener("store:auth-expired", sessionExpired);
  vi.unstubAllGlobals();
});

it("shows authentication errors instead of treating failed login as an expired session", async () => {
  sessionStorage.clear();
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    message: "E-mail ou senha inválidos.",
  }), { status: 401 }));
  vi.stubGlobal("fetch", fetchMock);

  const error = await storeApi.customerLogin("cliente@example.com", "wrong-password")
    .catch((failure: unknown) => failure);

  expect(storeApi.errorMessage(error, "Falha")).toBe("E-mail ou senha inválidos.");
  vi.unstubAllGlobals();
});

it("deletes the authenticated customer account", async () => {
  sessionStorage.clear();
  sessionStorage.setItem("loja_access_token", "customer-token");
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  await storeApi.deleteAccount();

  expect(fetchMock.mock.calls[0]?.[0]).toContain("/account");
  const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
  expect(request.method).toBe("DELETE");
  expect(new Headers(request.headers).get("Authorization")).toBe("Bearer customer-token");
  vi.unstubAllGlobals();
});

it("exposes backend validation details to the caller", async () => {
  sessionStorage.clear();
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    message: "Confira os dados informados.",
    errors: { phone: "Informe um telefone válido" },
  }), { status: 400 }));
  vi.stubGlobal("fetch", fetchMock);

  const error = await storeApi.register({
    name: "Cliente",
    email: "cliente@example.com",
    phone: "123",
    password: "password",
  }).catch((failure: unknown) => failure);

  expect(storeApi.errorMessage(error, "Falha")).toBe("Informe um telefone válido");
  vi.unstubAllGlobals();
});
