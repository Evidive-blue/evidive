/**
 * Supabase client singleton for browser-side authentication.
 *
 * Uses the anon (publishable) key — safe to expose client-side.
 * The JWT issued by Supabase Auth is sent to our Rust backend
 * via the Authorization header for every /api/v1/* call.
 *
 * Lazy-initialised: the client is only created on first access,
 * which avoids crashing during Next.js static page collection
 * when env vars are not yet injected by the build system.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  if (!url || !key) {
    /**
     * During `next build` page-data collection the env vars may be absent.
     * Return a stub client so the build proceeds. Auth will not function
     * at runtime without the real env vars.
     */
    const stub = "https://placeholder.supabase.co";
    const stubKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
      ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0" +
      ".placeholder-signature";

    _client = createClient(stub, stubKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return _client;
  }

  _client = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });

  return _client;
}

/** Lazily-initialised Supabase client singleton. */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    const client = getClient();
    const value = Reflect.get(client, prop);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Retrieve the current access token from the Supabase session.
 * Returns null if no active session.
 */
export async function getSupabaseToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Check whether a user is currently authenticated.
 */
export async function isSupabaseAuthenticated(): Promise<boolean> {
  const token = await getSupabaseToken();
  return token !== null;
}
