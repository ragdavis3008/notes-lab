import Link from "next/link";
import { Button } from "./ui/button";
import { getCurrentClaims } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const user = await getCurrentClaims();

  return user ? (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="min-w-0 break-all">Hey, {user.email}!</span>
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
