import type { OrderRequest, ProductSelection } from "../../app/models";

const STORAGE_KEY = "loja_pending_order_attempt";

export interface PendingOrderAttempt {
  idempotencyKey: string;
  ownerEmail: string;
  fromCart: boolean;
  request: OrderRequest;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSelection(value: unknown): value is ProductSelection {
  return isRecord(value) && ["ironColor", "woodColor", "woodType", "upholsteryColor"]
    .every((field) => value[field] === null || typeof value[field] === "string");
}

function isOrderRequest(value: unknown): value is OrderRequest {
  return isRecord(value)
    && value["customer"] === null
    && typeof value["zipCode"] === "string"
    && typeof value["address"] === "string"
    && Array.isArray(value["items"])
    && value["items"].length > 0
    && value["items"].every((item) => isRecord(item)
      && typeof item["productId"] === "string"
      && Number.isInteger(item["quantity"])
      && Number(item["quantity"]) >= 1
      && Number(item["quantity"]) <= 99
      && isSelection(item["selection"]));
}

function readStoredAttempt(): PendingOrderAttempt | null {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  try {
    const value: unknown = JSON.parse(saved);
    if (!isRecord(value)
      || typeof value["idempotencyKey"] !== "string"
      || !value["idempotencyKey"]
      || value["idempotencyKey"].length > 100
      || typeof value["ownerEmail"] !== "string"
      || typeof value["fromCart"] !== "boolean"
      || !isOrderRequest(value["request"])) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      idempotencyKey: value["idempotencyKey"],
      ownerEmail: value["ownerEmail"],
      fromCart: value["fromCart"],
      request: value["request"],
    };
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function canonicalRequest(request: OrderRequest): string {
  const items = request.items.map(({ productId, quantity, selection }) => {
    const choices = [
      selection.ironColor || "",
      selection.woodColor || "",
      selection.woodType || "",
      selection.upholsteryColor || "",
    ].join("|");
    return `${productId}:${quantity}:${choices}`;
  }).sort();
  return [
    request.zipCode.replace(/\D/g, ""),
    request.address.trim(),
    items.join(","),
  ].join("\n");
}

function createIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readPendingOrderAttempt(ownerEmail: string): PendingOrderAttempt | null {
  const attempt = readStoredAttempt();
  if (!attempt) return null;
  if (normalizeEmail(attempt.ownerEmail) === normalizeEmail(ownerEmail)) return attempt;
  clearPendingOrderAttempt();
  return null;
}

export function getOrCreateOrderAttempt(
  request: OrderRequest,
  ownerEmail: string,
  fromCart: boolean,
): PendingOrderAttempt {
  const existing = readPendingOrderAttempt(ownerEmail);
  if (existing
    && existing.fromCart === fromCart
    && canonicalRequest(existing.request) === canonicalRequest(request)) {
    return existing;
  }

  const attempt: PendingOrderAttempt = {
    idempotencyKey: createIdempotencyKey(),
    ownerEmail: normalizeEmail(ownerEmail),
    fromCart,
    request,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
  return attempt;
}

export function clearPendingOrderAttempt(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
