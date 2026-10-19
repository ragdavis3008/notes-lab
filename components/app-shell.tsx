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
      {/* On a phone the sidebar stacks above the content. On a note page the note
          goes first, so opening a note from the sidebar does not leave it off-screen. */}
      <main
        className={`min-w-0 flex-1 p-6 ${activeNote ? "order-first sm:order-none" : ""}`}
      >
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
