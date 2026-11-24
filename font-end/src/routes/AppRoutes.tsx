import type { ReactNode } from "react";
import type { StoreScreen } from "./types";

type AppRoutesProps = {
  screen: StoreScreen;
  pages: Partial<Record<StoreScreen, ReactNode>>;
};

export function AppRoutes({ screen, pages }: AppRoutesProps) {
  return <>{pages[screen] ?? null}</>;
}
