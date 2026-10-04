import { redirect } from "next/navigation";

// Root → Dashboard (the reference app's mainPage).
export default function RootPage() {
  redirect("/Dashboard");
}
