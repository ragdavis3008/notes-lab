import { Sidebar, type SidebarSelection } from "@/components/sidebar";

export function AppShell({
  children,
  selected = Promise.resolve("all"),
  activeNote,
}: {
  children: React.ReactNode;
  selected?: Promise<SidebarSelection>;
  activeNote?: Promise<{ id: string }>;
}) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <Sidebar selected={selected} activeNote={activeNote} />
      <main className="min-w-0 flex-1 p-6">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
