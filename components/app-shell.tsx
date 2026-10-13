import { Sidebar } from "@/components/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-6">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
