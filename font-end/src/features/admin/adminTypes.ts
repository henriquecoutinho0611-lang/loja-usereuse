import type { ProductRequest, StoreSettings } from "../../app/models";

export type ProductNumericDrafts = Pick<Record<keyof ProductRequest, string>, "price" | "oldPrice" | "width" | "height">;
export type ProductOptionDrafts = Pick<Record<keyof ProductRequest, string>, "ironColors" | "woodColors" | "woodTypes" | "upholsteryColors">;

export type StoreSettingsDraft = Omit<StoreSettings, "saoPauloCityPrice" | "saoPauloStatePrice"> & {
  saoPauloCityPrice: string;
  saoPauloStatePrice: string;
};
