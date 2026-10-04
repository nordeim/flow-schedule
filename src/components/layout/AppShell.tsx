"use client";

// FlowSchedule — authenticated app shell (client side of the (app) group).
// Bootstraps the session store once per mount, then renders the reference's
// page chrome: gradient canvas + animated blobs + Header + <main>.

import * as React from "react";
import { useFlowStore } from "@/store/useFlowStore";
import { BackgroundBlobs } from "@/components/layout/BackgroundBlobs";
import { Header } from "@/components/layout/Header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const bootstrap = useFlowStore((s) => s.bootstrap);
  const bootstrapped = React.useRef(false);

  React.useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void bootstrap();
  }, [bootstrap]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-100 to-indigo-100 relative overflow-hidden">
      <BackgroundBlobs />
      <Header />
      <main className="relative z-10">{children}</main>
    </div>
  );
}
