import { DashboardView } from "@/components/dashboard/DashboardView";

// "/" — the reference app's authenticated root (session 5, R-1): the
// dashboard renders AT the root URL (no redirect to /Dashboard), exactly
// like the live reference; unauthenticated visits are redirected to
// /login by the (app) group layout's session guard. The old root
// redirect-to-/Dashboard page was removed with this change.
export default function RootDashboardPage() {
  return <DashboardView />;
}
