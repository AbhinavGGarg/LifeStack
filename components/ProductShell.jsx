"use client";

import { ProductAppProvider } from "@/components/ProductAppProvider";
import SidebarNav from "@/components/SidebarNav";

export default function ProductShell({ children }) {
  return (
    <ProductAppProvider>
      <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(16,185,129,0.1),transparent_28%),#f4f7fb]">
        <SidebarNav />
        <main className="w-full px-4 py-5 md:px-8 md:py-8">{children}</main>
      </div>
    </ProductAppProvider>
  );
}
