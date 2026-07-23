import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ejpdrcbgqelxlopivwld.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcGRyY2JncWVseGxvcGl2d2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NzYzMDMsImV4cCI6MjEwMDI1MjMwM30.4nPfSJmgwPSJlv8nO8CBCxpjVkIKyl87MRbQMxjwpP0";

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const res = supabase.storage.from("product-images").getPublicUrl("1784747966161-mwqop.png");
console.log("PUBLIC URL DATA:", res);
