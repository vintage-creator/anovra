import { createClient } from "@supabase/supabase-js";

// The anon key is intentionally public for browser clients. Keep a fallback so static hosts
// that build without Vite env injection do not ship a Supabase client with no apikey header.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ejpdrcbgqelxlopivwld.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_wW3QKZLpeTB7OPNdpkW_pg_wOjiWWyj";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
