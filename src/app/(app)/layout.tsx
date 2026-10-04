import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

// Authenticated app group: Dashboard (also served at "/"), Planning,
// Profile, Settings. Route names match the reference app's capitalized
// paths exactly.
//
// Server-side session guard (session 5, G-1): the reference redirects
// unauthenticated visits to ANY app route to /login — the clone used to
// render the shell with empty data. `getSessionUser()` verifies the HMAC
// session token AND the user row; anything else → /login.
export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
