import { redirect } from "next/navigation";

// The notes list lives at /notes. /notes then sends signed-out users to the login page.
export default function Home() {
  redirect("/notes");
}
