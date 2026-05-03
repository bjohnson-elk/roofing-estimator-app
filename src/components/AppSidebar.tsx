"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AppSidebarProps = {
  active?: string;
};

const navItems = [
  { label: "Start", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Estimates", href: "/estimates" },
  { label: "Customers", href: "/customers" },
  { label: "Measurements", href: "/measurements" },
  { label: "Proposals", href: "/proposals" },
  { label: "Orders", href: "/orders" },
  { label: "Pricing V2", href: "/pricing-v2" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

export default function AppSidebar({ active }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem("elkstone-sidebar-collapsed-v2");
    const shouldCollapse = saved === null ? true : saved === "true";

    setCollapsed(shouldCollapse);
    document.documentElement.style.setProperty(
      "--sidebar-width",
      shouldCollapse ? "3.75rem" : "16rem"
    );
  }, []);

  useEffect(() => {
    window.localStorage.setItem("elkstone-sidebar-collapsed-v2", String(collapsed));
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "3.75rem" : "16rem"
    );
  }, [collapsed]);

  return (
    <aside
      className={`fixed left-0 top-0 hidden h-screen flex-col bg-slate-950 text-white transition-all duration-200 lg:flex ${
        collapsed ? "w-[3.75rem]" : "w-64"
      }`}
    >
      <div
        className={`border-b border-white/10 ${
          collapsed ? "flex justify-center p-3" : "relative p-6"
        }`}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-lg font-black tracking-wide text-white hover:bg-white/10"
            title="Expand sidebar"
          >
            E
          </button>
        ) : (
          <>
            <div className="pr-10 text-2xl font-black tracking-wide">
              ELKSTONE
            </div>
            <div className="pr-10 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Roofing & Construction
            </div>

            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="absolute right-4 top-5 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-sm font-black text-slate-300 hover:bg-white/10 hover:text-white"
              title="Collapse sidebar"
            >
              {"<"}
            </button>
          </>
        )}
      </div>

      {!collapsed && (
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = active === item.label;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-4 py-3 text-sm font-semibold ${
                  isActive
                    ? "bg-blue-600/30 text-white"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </aside>
  );
}
