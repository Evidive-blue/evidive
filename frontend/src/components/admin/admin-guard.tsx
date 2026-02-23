"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { authApi, isAuthenticated } from "@/lib/api";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">(
    "checking"
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    authApi
      .me()
      .then((user) => {
        if (user.role !== "admin_diver") {
          setStatus("denied");
          router.replace("/");
        } else {
          setStatus("allowed");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (status === "denied") {
    return null;
  }

  return <>{children}</>;
}
