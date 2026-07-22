import { createClient } from "@supabase/supabase-js";

// Load configuration from Vite environment variables with hardcoded fallbacks for development convenience.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ejpdrcbgqelxlopivwld.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
