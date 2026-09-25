import { createClient } from "@supabase/supabase-js";

// The anon key is intentionally public for browser clients. Keep a fallback so static hosts
// that build without Vite env injection do not ship a Supabase client with no apikey header.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ejpdrcbgqelxlopivwld.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_wW3QKZLpeTB7OPNdpkW_pg_wOjiWWyj";

// Capture redirect intent before the auth client can consume URL tokens.
export const initialAuthRedirect = typeof window === "undefined" ? { callback: false, recovery: false, signup: false } : {
  callback: window.location.pathname === "/auth/callback" || window.location.hash.startsWith("#resetpassword#"),
  recovery: window.location.hash.includes("type=recovery") || window.location.hash.startsWith("#resetpassword#"),
  signup: window.location.hash.includes("type=signup"),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
