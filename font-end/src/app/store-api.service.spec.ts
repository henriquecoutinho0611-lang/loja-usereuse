import { expect, it, vi } from "vitest";
import { storeApi } from "./store-api.service";

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
