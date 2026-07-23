import { createClient } from "@supabase/supabase-js";

// The anon key is intentionally public for browser clients. Keep a fallback so static hosts
// that build without Vite env injection do not ship a Supabase client with no apikey header.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ejpdrcbgqelxlopivwld.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcGRyY2JncWVseGxvcGl2d2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NzYzMDMsImV4cCI6MjEwMDI1MjMwM30.4nPfSJmgwPSJlv8nO8CBCxpjVkIKyl87MRbQMxjwpP0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
