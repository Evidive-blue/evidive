"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Step 1 - Personal Info
export interface PersonalInfoData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

// Step 2 - Center Info
export interface MultilingualText {
  fr: string;
  en: string;
}

export interface CenterInfoData {
  centerName: MultilingualText;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  website: string;
  shortDescription: MultilingualText;
}

// Step 3 - Legal Info
export type CertificationType = "PADI" | "SSI" | "CMAS" | "FFESSM" | "NAUI" | "SDI" | "TDI" | "BSAC";

export interface LegalInfoData {
  companyName: string;
  siretOrVat: string;
  certifications: CertificationType[];
}

// Store state
interface CenterRegistrationStore {
  // Hydration status
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  // Current step (1-4)
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // Step data
  personalInfo: Partial<PersonalInfoData>;
  centerInfo: Partial<CenterInfoData>;
  legalInfo: Partial<LegalInfoData>;

  // Step setters
  setPersonalInfo: (data: Partial<PersonalInfoData>) => void;
  setCenterInfo: (data: Partial<CenterInfoData>) => void;
  setLegalInfo: (data: Partial<LegalInfoData>) => void;

  // Step validation flags
  isStep1Valid: boolean;
  isStep2Valid: boolean;
  isStep3Valid: boolean;
  setStepValid: (step: 1 | 2 | 3, valid: boolean) => void;

  // Terms acceptance
  termsAccepted: boolean;
  setTermsAccepted: (accepted: boolean) => void;

  // Reset
  resetStore: () => void;
}

const initialState = {
  _hasHydrated: false,
  currentStep: 1,
  personalInfo: {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  },
  centerInfo: {
    centerName: { fr: "", en: "" },
    street: "",
    city: "",
    postalCode: "",
    country: "",
    latitude: null,
    longitude: null,
    website: "",
    shortDescription: { fr: "", en: "" },
  },
  legalInfo: {
    companyName: "",
    siretOrVat: "",
    certifications: [] as CertificationType[],
  },
  isStep1Valid: false,
  isStep2Valid: false,
  isStep3Valid: false,
  termsAccepted: false,
};

export const useCenterRegistrationStore = create<CenterRegistrationStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Hydration
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      // Navigation
      setCurrentStep: (step) => set({ currentStep: step }),

      // Data setters
      setPersonalInfo: (data) =>
        set((state) => ({
          personalInfo: { ...state.personalInfo, ...data },
        })),

      setCenterInfo: (data) =>
        set((state) => ({
          centerInfo: { ...state.centerInfo, ...data },
        })),

      setLegalInfo: (data) =>
        set((state) => ({
          legalInfo: { ...state.legalInfo, ...data },
        })),

      // Validation setters
      setStepValid: (step, valid) => {
        const key = `isStep${step}Valid` as const;
        set({ [key]: valid });
      },

      // Terms
      setTermsAccepted: (accepted) => set({ termsAccepted: accepted }),

      // Reset
      resetStore: () => set(initialState),
    }),
    {
      name: "evidive-center-registration",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        currentStep: state.currentStep,
        // Persist data without passwords for security
        personalInfo: {
          firstName: state.personalInfo.firstName,
          lastName: state.personalInfo.lastName,
          email: state.personalInfo.email,
          phone: state.personalInfo.phone,
          // Do NOT persist passwords
        },
        centerInfo: state.centerInfo,
        legalInfo: state.legalInfo,
        isStep1Valid: state.isStep1Valid,
        isStep2Valid: state.isStep2Valid,
        isStep3Valid: state.isStep3Valid,
        termsAccepted: state.termsAccepted,
      }),
    }
  )
);
