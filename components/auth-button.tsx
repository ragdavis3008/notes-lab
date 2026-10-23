import Link from "next/link";
import { Button } from "./ui/button";
import { getCurrentClaims } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const user = await getCurrentClaims();
  const email = typeof user?.email === "string" ? user.email : "";

  return user ? (
    <div className="flex items-center gap-2 text-sm">
      <span
        aria-hidden
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold uppercase text-primary-foreground"
      >
        {email.charAt(0)}
      </span>
      <span className="min-w-0 truncate text-xs text-foreground/60">{email}</span>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
