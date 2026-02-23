"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authApi, setCachedAuthState } from "@/lib/api";
import { getApiUrl } from "@/lib/site-config";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = searchParams.get("code");

    async function handleCallback() {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace("/login?error=oauth_failed");
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login?error=no_session");
        return;
      }

      try {
        const user = await authApi.me();
        const profileComplete = !!(user.first_name && user.last_name);

        let centerCount = 0;
        try {
          const res = await fetch(
            `${getApiUrl().replace(/\/$/, "")}/api/v1/profile/centers`,
            { headers: { Authorization: `Bearer ${session.access_token}` } }
          );
          if (res.ok) {
            const data: Array<{ id: string }> = await res.json();
            centerCount = data.length;
          }
        } catch {
          /* centers fetch is optional */
        }

        setCachedAuthState(user.role, profileComplete, centerCount);
        window.dispatchEvent(new Event("auth-change"));

        if (!profileComplete) {
          router.replace("/onboard/profile");
        } else if (user.role === "admin_diver" && centerCount === 0) {
          router.replace("/onboard/center");
        } else if (user.role === "admin_diver") {
          router.replace("/admin");
        } else {
          router.replace("/");
        }
      } catch {
        router.replace("/");
      }
    }

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
