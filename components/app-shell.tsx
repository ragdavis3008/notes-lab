import { Sidebar, type SidebarSelection } from "@/components/sidebar";

export function AppShell({
  children,
  selected = Promise.resolve("all"),
  selectedTags = Promise.resolve([]),
  searchText = Promise.resolve(""),
  activeNote,
}: {
  children: React.ReactNode;
  selected?: Promise<SidebarSelection>;
  selectedTags?: Promise<number[]>;
  searchText?: Promise<string>;
  activeNote?: Promise<{ id: string }>;
}) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <Sidebar
        selected={selected}
        selectedTags={selectedTags}
        searchText={searchText}
        activeNote={activeNote}
      />
      <main className="min-w-0 flex-1 p-6">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
