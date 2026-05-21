"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: number;
  phone: string;
  name: string | null;
  role: "customer" | "admin";
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: "efir-auth" }
  )
);
