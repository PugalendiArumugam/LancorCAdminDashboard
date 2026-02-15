"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Lock, Users, Building2, Package, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/LoginDialog";
import { Providers } from "@/components/Providers"; // Import your providers
import Link from "next/link";
import "./globals.css";

const sidebarItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Flats", href: "#", icon: Building2, disabled: true },
  { name: "Assets", href: "#", icon: Package, disabled: true },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* FIX: Everything using useAuth() MUST be inside Providers.
          Providers contains the AuthProvider.
        */}
        <Providers>
          <DashboardLayoutContent>
            {children}
          </DashboardLayoutContent>
        </Providers>
      </body>
    </html>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAdmin, isLoading, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Lock className="h-8 w-8 text-slate-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-800">Restricted Access</h1>
          <p className="mb-6 text-slate-500">
            Only administrators can access this dashboard.
          </p>
          <Button onClick={() => setLoginDialogOpen(true)} size="lg">
            Login to Continue
          </Button>
        </div>
        <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
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
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Admin Portal
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.full_name}</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {children}
        </div>
      </main>

      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
    </div>
  );
}