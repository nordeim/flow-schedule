import { AppShell } from "@/components/layout/AppShell";

// Authenticated app group: Dashboard, Planning, Profile, Settings.
// Route names match the reference app's capitalized paths exactly.
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
