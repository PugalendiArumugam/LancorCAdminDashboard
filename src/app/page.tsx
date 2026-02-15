"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Lock, Users } from "lucide-react";

export default function DashboardPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

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
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">LancorC Admin Overview</h1>
        <p className="text-slate-500">Welcome to your apartment management portal.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Users className="h-4 w-4" />
            Society Users
          </div>
          <div className="text-2xl font-bold mt-2">Manage residents and staff</div>
        </div>
      </div>
    </div>
  );
}
