import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EviDive - Plateforme de réservation de plongées",
    template: "%s | EviDive",
  },
  description:
    "Découvrez les plus beaux sites de plongée à travers le monde et réservez auprès de centres certifiés.",
  keywords: [
    "plongée",
    "diving",
    "réservation",
    "centres de plongée",
    "snorkeling",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
