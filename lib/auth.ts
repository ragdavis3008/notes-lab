import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Asks the Supabase Auth server who is signed in (getUser), instead of trusting
// the cookie in the browser. Redirects to the login page when nobody is.
// redirect() works by throwing, so call this outside any try/catch.
export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/auth/login");
  return data.user;
}

// Only same-site paths are allowed as a redirect target ("/notes", not
// "https://evil.example" or "//evil.example").
export function safeNextPath(next: string | null, fallback = "/notes") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}
