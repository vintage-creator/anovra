import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ejpdrcbgqelxlopivwld.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcGRyY2JncWVseGxvcGl2d2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NzYzMDMsImV4cCI6MjEwMDI1MjMwM30.4nPfSJmgwPSJlv8nO8CBCxpjVkIKyl87MRbQMxjwpP0";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data: signInData, error: sErr } = await supabase.auth.signInWithPassword({
    email: "vendor@test.com",
    password: "password123"
  });
  console.log("SIGN IN SUCCESS:", !!signInData.user, "ERROR:", sErr);

  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  console.log("BUCKETS:", buckets, "ERROR:", bErr);

  const { data: uploadData, error: uErr } = await supabase.storage
    .from("product-images")
    .upload("test-file-auth.txt", Buffer.from("hello world auth"), {
      contentType: "text/plain",
      upsert: true
    });
  console.log("UPLOAD RESULT:", uploadData, "ERROR:", uErr);
}

test();
