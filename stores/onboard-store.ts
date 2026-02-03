"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================
// Types
// ============================================
export type OnboardFlowType = "diver" | "center";

export interface DiverProfileData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  bio?: string;
  certificationLevel?: string;
  certificationOrg?: string;
  totalDives?: number;
  preferredLanguage?: string;
}

export interface DiverPreferencesData {
  preferredDiveTypes?: string[];
  preferredDepth?: { min: number; max: number };
  equipmentOwned?: string[];
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface CenterBasicData {
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  logo?: string;
  coverImage?: string;
  website?: string;
  email?: string;
  phone?: string;
}

export interface CenterLocationData {
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface CenterServicesData {
  diveTypes?: string[];
  certifications?: string[];
  languages?: string[];
  equipmentRental?: boolean;
  accommodationPartners?: boolean;
  transportIncluded?: boolean;
}

export interface CenterLegalData {
  businessName?: string;
  registrationNumber?: string;
  vatNumber?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  termsAccepted?: boolean;
}

// ============================================
// Store Interface
// ============================================
interface OnboardStore {
  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  // Current flow
  currentFlow: OnboardFlowType | null;
  currentStep: number;
  setCurrentFlow: (flow: OnboardFlowType | null) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Diver data
  diverProfile: DiverProfileData;
  diverPreferences: DiverPreferencesData;
  setDiverProfile: (data: Partial<DiverProfileData>) => void;
  setDiverPreferences: (data: Partial<DiverPreferencesData>) => void;

  // Center data
  centerBasic: CenterBasicData;
  centerLocation: CenterLocationData;
  centerServices: CenterServicesData;
  centerLegal: CenterLegalData;
  setCenterBasic: (data: Partial<CenterBasicData>) => void;
  setCenterLocation: (data: Partial<CenterLocationData>) => void;
  setCenterServices: (data: Partial<CenterServicesData>) => void;
  setCenterLegal: (data: Partial<CenterLegalData>) => void;

  // Completion tracking
  completedSteps: Record<string, boolean>;
  markStepCompleted: (step: string) => void;
  isStepCompleted: (step: string) => boolean;

  // Reset
  resetDiverData: () => void;
  resetCenterData: () => void;
  resetAll: () => void;
}

// ============================================
// Initial State
// ============================================
const initialDiverProfile: DiverProfileData = {};
const initialDiverPreferences: DiverPreferencesData = {
  notificationPreferences: { email: true, push: false, sms: false },
};
const initialCenterBasic: CenterBasicData = {};
const initialCenterLocation: CenterLocationData = {};
const initialCenterServices: CenterServicesData = {
  equipmentRental: false,
  accommodationPartners: false,
  transportIncluded: false,
};
const initialCenterLegal: CenterLegalData = {
  termsAccepted: false,
};

// ============================================
// Store
// ============================================
export const useOnboardStore = create<OnboardStore>()(
  persist(
    (set, get) => ({
      // Hydration
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      // Flow state
      currentFlow: null,
      currentStep: 0,
      setCurrentFlow: (flow) => set({ currentFlow: flow, currentStep: 0 }),
      setCurrentStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      prevStep: () =>
        set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),

      // Diver data
      diverProfile: initialDiverProfile,
      diverPreferences: initialDiverPreferences,
      setDiverProfile: (data) =>
        set((state) => ({
          diverProfile: { ...state.diverProfile, ...data },
        })),
      setDiverPreferences: (data) =>
        set((state) => ({
          diverPreferences: { ...state.diverPreferences, ...data },
        })),

      // Center data
      centerBasic: initialCenterBasic,
      centerLocation: initialCenterLocation,
      centerServices: initialCenterServices,
      centerLegal: initialCenterLegal,
      setCenterBasic: (data) =>
        set((state) => ({
          centerBasic: { ...state.centerBasic, ...data },
        })),
      setCenterLocation: (data) =>
        set((state) => ({
          centerLocation: { ...state.centerLocation, ...data },
        })),
      setCenterServices: (data) =>
        set((state) => ({
          centerServices: { ...state.centerServices, ...data },
        })),
      setCenterLegal: (data) =>
        set((state) => ({
          centerLegal: { ...state.centerLegal, ...data },
        })),

      // Completion tracking
      completedSteps: {},
      markStepCompleted: (step) =>
        set((state) => ({
          completedSteps: { ...state.completedSteps, [step]: true },
        })),
      isStepCompleted: (step) => get().completedSteps[step] ?? false,

      // Reset functions
      resetDiverData: () =>
        set({
          diverProfile: initialDiverProfile,
          diverPreferences: initialDiverPreferences,
        }),
      resetCenterData: () =>
        set({
          centerBasic: initialCenterBasic,
          centerLocation: initialCenterLocation,
          centerServices: initialCenterServices,
          centerLegal: initialCenterLegal,
        }),
      resetAll: () =>
        set({
          currentFlow: null,
          currentStep: 0,
          diverProfile: initialDiverProfile,
          diverPreferences: initialDiverPreferences,
          centerBasic: initialCenterBasic,
          centerLocation: initialCenterLocation,
          centerServices: initialCenterServices,
          centerLegal: initialCenterLegal,
          completedSteps: {},
        }),
    }),
    {
      name: "evidive-onboard-v2",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // Don't persist sensitive data
      partialize: (state) => ({
        currentFlow: state.currentFlow,
        currentStep: state.currentStep,
        diverProfile: state.diverProfile,
        diverPreferences: state.diverPreferences,
        // Don't persist center data (PII)
        completedSteps: state.completedSteps,
      }),
    }
  )
);
