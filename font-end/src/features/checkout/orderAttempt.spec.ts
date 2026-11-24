import { beforeEach, expect, it } from "vitest";
import type { OrderRequest } from "../../app/models";
import {
  clearPendingOrderAttempt,
  getOrCreateOrderAttempt,
  readPendingOrderAttempt,
} from "./orderAttempt";

const request: OrderRequest = {
  customer: null,
  zipCode: "01001000",
  address: "Rua das Flores, 10",
  items: [{
    productId: "d14e65bb-35b4-40a6-8bb5-e1730df1e014",
    quantity: 1,
    selection: { ironColor: null, woodColor: null, woodType: null, upholsteryColor: null },
  }],
};

beforeEach(() => {
  clearPendingOrderAttempt();
});

it("reuses the persisted key after a reload and creates a new key for a new purchase", () => {
  const first = getOrCreateOrderAttempt(request, "cliente@example.com", false);
  const restored = readPendingOrderAttempt(" CLIENTE@example.com ");

  expect(restored).toEqual(first);
  expect(getOrCreateOrderAttempt(request, "cliente@example.com", false).idempotencyKey)
    .toBe(first.idempotencyKey);

  clearPendingOrderAttempt();
  expect(getOrCreateOrderAttempt(request, "cliente@example.com", false).idempotencyKey)
    .not.toBe(first.idempotencyKey);
});

it("reuses a key when the same cart items are submitted in a different order", () => {
  const cartRequest: OrderRequest = {
    ...request,
    items: [
      request.items[0]!,
      {
        productId: "a14e65bb-35b4-40a6-8bb5-e1730df1e014",
        quantity: 2,
        selection: { ironColor: "Preto", woodColor: null, woodType: null, upholsteryColor: null },
      },
    ],
  };
  const first = getOrCreateOrderAttempt(cartRequest, "cliente@example.com", true);
  const reordered = getOrCreateOrderAttempt({
    ...cartRequest,
    items: [...cartRequest.items].reverse(),
  }, "cliente@example.com", true);

  expect(reordered.idempotencyKey).toBe(first.idempotencyKey);
});

it("uses a new key for a changed request, customer, or explicitly new cart purchase", () => {
  const first = getOrCreateOrderAttempt(request, "cliente@example.com", false);
  const changedRequest = { ...request, address: "Rua das Flores, 20" };

  expect(getOrCreateOrderAttempt(changedRequest, "cliente@example.com", false).idempotencyKey)
    .not.toBe(first.idempotencyKey);
  expect(getOrCreateOrderAttempt(changedRequest, "outra@example.com", false).idempotencyKey)
    .not.toBe(first.idempotencyKey);
  expect(getOrCreateOrderAttempt(changedRequest, "outra@example.com", true).idempotencyKey)
    .not.toBe(first.idempotencyKey);
});
