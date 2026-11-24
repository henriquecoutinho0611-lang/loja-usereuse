import type { PropsWithChildren } from "react";

export function AdminLayout({ children }: PropsWithChildren) {
  return <div className="admin-layout">{children}</div>;
}
