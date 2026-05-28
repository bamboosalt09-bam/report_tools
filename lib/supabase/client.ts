import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const rawSupabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "";

const placeholderKeys = new Set([
  "supabase anon public key",
  "supabase publishable key",
  "your supabase anon key",
  "your supabase publishable key",
]);

const supabaseKey = placeholderKeys.has(rawSupabaseKey.toLowerCase())
  ? ""
  : rawSupabaseKey;

let browserClient: SupabaseClient<Database> | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) return null;

  browserClient ??= createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
