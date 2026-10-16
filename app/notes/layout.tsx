import { Suspense } from "react";
import { requireUser } from "@/lib/auth";

// Every page under /notes needs a signed-in user. The check runs on the server
// and asks Supabase Auth. It sits behind Suspense because it reads cookies.
async function RequireUser({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <RequireUser>{children}</RequireUser>
    </Suspense>
  );
}
