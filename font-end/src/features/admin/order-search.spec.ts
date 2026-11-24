import { expect, it } from "vitest";
import { matchesOrderNumber } from "./order-search";

it("matches generated order codes regardless of hyphens or letter case", () => {
  expect(matchesOrderNumber("PED-A1B2C3D4", "ped-a1b")).toBe(true);
  expect(matchesOrderNumber("PED-A1B2C3D4", "a1b2c3d4")).toBe(true);
  expect(matchesOrderNumber("PED-A1B2C3D4", "PED-Z9")).toBe(false);
  expect(matchesOrderNumber("PED-A1B2C3D4", "   ")).toBe(true);
});
