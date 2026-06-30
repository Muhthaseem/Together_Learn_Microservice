"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type UserProfile = {
  userId: string;
  name: string;
  department: string;
  batch: string;
  courses: string[];
  role?: string;
  registrationNumber?: string;
  indexNumber?: string;
  avatarUrl?: string;
};

type AuthContextValue = {
  user: UserProfile | null;
  login: (profile: UserProfile) => void;
  logout: () => void;
  ready: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tl_user");
      if (raw) setUser(JSON.parse(raw));
      // Refresh from backend to ensure latest avatar/name
      const token = typeof window !== 'undefined' ? localStorage.getItem('tl_token') : undefined;
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('tl_user') : null;
      let storedUserId: string | null = null;
      try { storedUserId = storedUser ? JSON.parse(storedUser).userId : null; } catch {}
      if (token && storedUserId) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/users/${storedUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }).then(async (r) => {
          if (!r.ok) return;
          const me = await r.json();
          const profile: UserProfile = {
            userId: me.userId,
            name: me.name,
            department: me.department,
            batch: me.batch,
            courses: me.courses || [],
            role: me.role,
            registrationNumber: me.registrationNumber,
            indexNumber: me.indexNumber,
            avatarUrl: me.avatarUrl,
          };
          setUser(profile);
          localStorage.setItem('tl_user', JSON.stringify(profile));
        }).catch(() => {});
      }
    } finally {
      setReady(true);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    login: (profile) => {
      setUser(profile);
      localStorage.setItem("tl_user", JSON.stringify(profile));
    },
    logout: () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tl_token') : null;
      if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      setUser(null);
      localStorage.removeItem("tl_user");
      localStorage.removeItem("tl_token");
    },
    ready,
  }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


