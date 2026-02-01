"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  DiverAccountData,
  DiverPreferencesData,
  SellerAccountData,
  SellerProfileData,
  SellerServiceData,
  CenterAccountData,
  CenterInfoData,
  CenterLocationData,
  CenterDocumentData,
} from "@/lib/validations";

export type OnboardDrawerType = "role" | "diver" | "seller" | "center";
export type OnboardDrawerIntent = "register" | "upgrade";
export type OnboardDrawerStepKey =
  | "account"
  | "preferences"
  | "review"
  | "profile"
  | "services"
  | "payments"
  | "info"
  | "location"
  | "documents";

interface OnboardStore {
  // Hydration status
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  // Drawer state
  isDrawerOpen: boolean;
  drawerType: OnboardDrawerType;
  drawerIntent: OnboardDrawerIntent;
  drawerStep: OnboardDrawerStepKey | null;
  openDrawer: (options: {
    intent: OnboardDrawerIntent;
    type?: OnboardDrawerType;
    step?: OnboardDrawerStepKey | null;
  }) => void;
  closeDrawer: () => void;
  setDrawerType: (type: OnboardDrawerType) => void;
  setDrawerIntent: (intent: OnboardDrawerIntent) => void;
  setDrawerStep: (step: OnboardDrawerStepKey | null) => void;
  resetDrawer: () => void;

  // Diver data
  diverAccount: Partial<DiverAccountData> | null;
  diverPreferences: Partial<DiverPreferencesData> | null;

  // Seller data
  sellerAccount: Partial<SellerAccountData> | null;
  sellerProfile: Partial<SellerProfileData> | null;
  sellerServices: SellerServiceData[];

  // Center data
  centerAccount: Partial<CenterAccountData> | null;
  centerInfo: Partial<CenterInfoData> | null;
  centerLocation: Partial<CenterLocationData> | null;
  centerDocuments: CenterDocumentData[];

  // Diver actions
  setDiverAccount: (data: Partial<DiverAccountData>) => void;
  setDiverPreferences: (data: Partial<DiverPreferencesData>) => void;
  clearDiverData: () => void;

  // Seller actions
  setSellerAccount: (data: Partial<SellerAccountData>) => void;
  setSellerProfile: (data: Partial<SellerProfileData>) => void;
  setSellerServices: (services: SellerServiceData[]) => void;
  addSellerService: (service: SellerServiceData) => void;
  removeSellerService: (index: number) => void;
  updateSellerService: (index: number, service: SellerServiceData) => void;
  clearSellerData: () => void;

  // Center actions
  setCenterAccount: (data: Partial<CenterAccountData>) => void;
  setCenterInfo: (data: Partial<CenterInfoData>) => void;
  setCenterLocation: (data: Partial<CenterLocationData>) => void;
  addCenterDocument: (document: CenterDocumentData) => void;
  removeCenterDocument: (index: number) => void;
  clearCenterData: () => void;

  // Global actions
  resetAll: () => void;
}

const initialState = {
  _hasHydrated: false,
  isDrawerOpen: false,
  drawerType: "role" as OnboardDrawerType,
  drawerIntent: "register" as OnboardDrawerIntent,
  drawerStep: null as OnboardDrawerStepKey | null,
  diverAccount: null,
  diverPreferences: null,
  sellerAccount: null,
  sellerProfile: null,
  sellerServices: [],
  centerAccount: null,
  centerInfo: null,
  centerLocation: null,
  centerDocuments: [],
};

export const useOnboardStore = create<OnboardStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Hydration action
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      // Drawer actions
      openDrawer: ({ intent, type = "role", step = null }) =>
        set({
          isDrawerOpen: true,
          drawerIntent: intent,
          drawerType: type,
          drawerStep: step,
        }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      setDrawerType: (type) => set({ drawerType: type }),
      setDrawerIntent: (intent) => set({ drawerIntent: intent }),
      setDrawerStep: (step) => set({ drawerStep: step }),
      resetDrawer: () =>
        set({
          isDrawerOpen: false,
          drawerType: "role",
          drawerIntent: "register",
          drawerStep: null,
        }),

      // Diver actions
      setDiverAccount: (data) =>
        set((state) => ({
          diverAccount: { ...state.diverAccount, ...data },
        })),

      setDiverPreferences: (data) =>
        set((state) => ({
          diverPreferences: { ...state.diverPreferences, ...data },
        })),

      clearDiverData: () =>
        set({
          diverAccount: null,
          diverPreferences: null,
        }),

      // Seller actions
      setSellerAccount: (data) =>
        set((state) => ({
          sellerAccount: { ...state.sellerAccount, ...data },
        })),

      setSellerProfile: (data) =>
        set((state) => ({
          sellerProfile: { ...state.sellerProfile, ...data },
        })),

      setSellerServices: (services) =>
        set({
          sellerServices: services,
        }),

      addSellerService: (service) =>
        set((state) => ({
          sellerServices: [...state.sellerServices, service],
        })),

      removeSellerService: (index) =>
        set((state) => ({
          sellerServices: state.sellerServices.filter((_, i) => i !== index),
        })),

      updateSellerService: (index, service) =>
        set((state) => ({
          sellerServices: state.sellerServices.map((s, i) =>
            i === index ? service : s
          ),
        })),

      clearSellerData: () =>
        set({
          sellerAccount: null,
          sellerProfile: null,
          sellerServices: [],
        }),

      // Center actions
      setCenterAccount: (data) =>
        set((state) => ({
          centerAccount: { ...state.centerAccount, ...data },
        })),

      setCenterInfo: (data) =>
        set((state) => ({
          centerInfo: { ...state.centerInfo, ...data },
        })),

      setCenterLocation: (data) =>
        set((state) => ({
          centerLocation: { ...state.centerLocation, ...data },
        })),

      addCenterDocument: (document) =>
        set((state) => ({
          centerDocuments: [...state.centerDocuments, document],
        })),

      removeCenterDocument: (index) =>
        set((state) => ({
          centerDocuments: state.centerDocuments.filter((_, i) => i !== index),
        })),

      clearCenterData: () =>
        set({
          centerAccount: null,
          centerInfo: null,
          centerLocation: null,
          centerDocuments: [],
        }),

      // Global reset
      resetAll: () => set(initialState),
    }),
    {
      name: "evidive-onboard-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        drawerType: state.drawerType,
        drawerIntent: state.drawerIntent,
        drawerStep: state.drawerStep,
        // Persist account data without passwords
        diverAccount: state.diverAccount
          ? { ...state.diverAccount, password: undefined, confirmPassword: undefined }
          : null,
        diverPreferences: state.diverPreferences,
        sellerAccount: state.sellerAccount
          ? { ...state.sellerAccount, password: undefined, confirmPassword: undefined }
          : null,
        sellerProfile: state.sellerProfile,
        sellerServices: state.sellerServices,
        // Do NOT persist center onboarding data (PII: email/phone/address/coords)
        centerAccount: null,
        centerInfo: null,
        centerLocation: null,
        centerDocuments: [],
      }),
    }
  )
);
