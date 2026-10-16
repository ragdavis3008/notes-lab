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
  // Browsers drop tabs and newlines from URLs, so "/\t/evil.example" would turn
  // into "//evil.example". Reject any control character (and the space).
  if (/[\x00-\x20\x7f]/.test(next)) return fallback;
  // Check the decoded path too, so "/%2Fevil.example" and "/%5Cevil.example" fail.
  let decoded: string;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return fallback;
  }
  if (
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    /[\x00-\x1f\x7f]/.test(decoded)
  ) {
    return fallback;
  }
  return next;
}
