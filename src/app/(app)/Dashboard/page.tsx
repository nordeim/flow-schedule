import { DashboardView } from "@/components/dashboard/DashboardView";

// /Dashboard — the reference app's main page (the header's link target).
// The island itself lives in DashboardView, shared with the "/" route
// (session 5, R-1: the reference serves the dashboard at both paths).
export default function DashboardPage() {
  return <DashboardView />;
}
