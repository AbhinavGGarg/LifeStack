"use client";

import { ProductAppProvider } from "@/components/ProductAppProvider";
import SidebarNav from "@/components/SidebarNav";

export default function ProductShell({ children }) {
  return (
    <ProductAppProvider>
      <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.2),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(45,212,191,0.16),transparent_28%),#020617] md:flex">
        <SidebarNav />
        <main className="w-full px-4 py-5 md:px-8 md:py-8">{children}</main>
      </div>
    </ProductAppProvider>
  );
}
