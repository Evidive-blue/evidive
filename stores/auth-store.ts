"use client";

import { create } from "zustand";

interface AuthStore {
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error states
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Success states
  successMessage: string | null;
  setSuccessMessage: (message: string | null) => void;
  clearSuccessMessage: () => void;

  // Reset all
  reset: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  successMessage: null,
  setSuccessMessage: (message) => set({ successMessage: message }),
  clearSuccessMessage: () => set({ successMessage: null }),

  reset: () =>
    set({
      isLoading: false,
      error: null,
      successMessage: null,
    }),
}));
