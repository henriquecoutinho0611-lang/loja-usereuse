import type { PropsWithChildren } from "react";

export function MainLayout({ children }: PropsWithChildren) {
  return <div className="main-layout">{children}</div>;
}
