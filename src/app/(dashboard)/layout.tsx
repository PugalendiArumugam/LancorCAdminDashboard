"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  Package,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const sidebarItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Flats", href: "#", icon: Building2, disabled: true },
  { name: "Assets", href: "#", icon: Package, disabled: true },
];

const queryClient = new QueryClient();

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-6">
            <h1 className="text-xl font-bold text-blue-600">LancorC Admin</h1>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  item.disabled
                    ? "text-slate-400 cursor-not-allowed"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-200">
            <button className="flex items-center gap-3 px-3 py-2 w-full text-red-600 hover:bg-red-50 rounded-md transition-colors">
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header/Topbar */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Admin Portal
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">Pugal Arumugam</span>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                P
              </div>
            </div>
          </header>

          {/* Dynamic Page Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
            {children}
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}