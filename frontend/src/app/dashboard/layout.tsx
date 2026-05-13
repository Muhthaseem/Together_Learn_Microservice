"use client";
import { useAuth } from "@/lib/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return null;
  }

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/auth/login";
    return null;
  }

  return (
    <main className="min-h-screen max-w-6xl mx-auto p-4 sm:p-6">{children}</main>
  );
}


