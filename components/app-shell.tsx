import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { AuthButton } from "@/components/auth-button";
import { Sidebar, type SidebarSelection } from "@/components/sidebar";

export function AppShell({
  children,
  selected = Promise.resolve("all"),
  selectedTags = Promise.resolve([]),
  searchText = Promise.resolve(""),
  activeNote,
  backLink = false,
}: {
  children: React.ReactNode;
  selected?: Promise<SidebarSelection>;
  selectedTags?: Promise<number[]>;
  searchText?: Promise<string>;
  activeNote?: Promise<{ id: string }>;
  // Note pages (view, edit, new) set this to show "‹ All notes" on a phone.
  backLink?: boolean;
}) {
  return (
    <AppFrame
      sidebar={
        <Sidebar
          selected={selected}
          selectedTags={selectedTags}
          searchText={searchText}
          activeNote={activeNote}
        />
      }
      header={
        <Suspense fallback={null}>
          <AuthButton />
        </Suspense>
      }
      backLink={backLink}
    >
      {children}
    </AppFrame>
  );
}
