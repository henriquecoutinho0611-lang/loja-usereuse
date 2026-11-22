import { expect, it } from "vitest";
import {
  brazilianZipCodeDigits,
  formatBrazilianDateInput,
  formatBrazilianZipCode,
  formatDateForInput,
  parseDateInput,
  parseProductOptions,
} from "./form-formatters";

it("keeps spaces while separating product options by comma, semicolon, or line", () => {
  expect(parseProductOptions("Madeira clara, nogueira escura; Carvalho\nPreto fosco"))
    .toEqual(["Madeira clara", "nogueira escura", "Carvalho", "Preto fosco"]);
});

it("formats eight postal-code digits with a hyphen and accepts pasted formatted values", () => {
  expect(formatBrazilianZipCode("01001000")).toBe("01001-000");
  expect(formatBrazilianZipCode("01001-000")).toBe("01001-000");
  expect(brazilianZipCodeDigits("01001-000")).toBe("01001000");
});

it("formats and validates delivery dates typed as DD/MM/YYYY", () => {
  expect(formatBrazilianDateInput("21112026")).toBe("21/11/2026");
  expect(parseDateInput("21/11/2026")).toBe("2026-11-21");
  expect(formatDateForInput("2026-11-21")).toBe("21/11/2026");
  expect(parseDateInput("31/02/2026")).toBeNull();
});
