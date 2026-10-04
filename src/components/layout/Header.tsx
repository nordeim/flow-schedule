"use client";

// FlowSchedule — app header.
// Mirrors the reference exactly:
//   - sticky, blurred, max-w-7xl, h-16
//   - logo: activity glyph (sky-400) in a slate gradient rounded-xl box +
//     gradient-text "FlowSchedule" brand
//   - DESKTOP (md+): avatar-initials Radix DropdownMenu (chevron-down)
//   - MOBILE (<md): ghost icon Button with the user glyph → Radix
//     DropdownMenu aligned to the END (the mobile navigation menu)
//   - menu: "My Account" label, Profile, Settings, Logout (red)
//
// Mobile-menu notes (verified against the live reference):
//   the menu anchors its right edge to the trigger's right edge (align="end")
//   and opens downward; the reference has NO bottom tab bar (its mobile nav
//   items array is empty), so none is rendered here.
//
// Tailwind v4 guardrail (Trap 4 — space-y selector rewrite): the menu
// content uses p-1 + item margins, NOT space-y with mt-*/mb-* children, so
// the v3/v4 margin-side swap cannot change this menu's geometry. Pinned by
// tests/e2e/mobile-navigation.spec.ts.

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFlowStore } from "@/store/useFlowStore";

export function Header() {
  const router = useRouter();
  const user = useFlowStore((s) => s.user);
  const logout = useFlowStore((s) => s.logout);

  const initial = user
    ? (user.email.split("@")[0]?.charAt(0).toUpperCase() ?? "U")
    : "U";

  const handleLogout = React.useCallback(async () => {
    await logout();
    router.push("/login");
    router.refresh();
  }, [logout, router]);

  const menuContent = (
    <DropdownMenuContent
      align="end"
      className="w-48 bg-white/90 backdrop-blur-md border-slate-200/80 shadow-lg rounded-xl"
    >
      <DropdownMenuLabel className="text-sm font-semibold text-slate-800 px-2 py-1.5">
        My Account
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-slate-200/50" />
      <DropdownMenuItem asChild className="cursor-pointer hover:bg-slate-100/80 rounded-md m-1 text-slate-700">
        <Link href="/Profile" className="flex items-center px-2 py-1.5">
          <User className="w-4 h-4 mr-2 opacity-80" /> Profile
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="cursor-pointer hover:bg-slate-100/80 rounded-md m-1 text-slate-700">
        <Link href="/Settings" className="flex items-center px-2 py-1.5">
          <Settings className="w-4 h-4 mr-2 opacity-80" /> Settings
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator className="bg-slate-200/50" />
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          void handleLogout();
        }}
        className="cursor-pointer hover:bg-red-50/80 rounded-md m-1 text-red-600"
      >
        <LogOut className="w-4 h-4 mr-2 opacity-80" /> Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-lg shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/Dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-slate-800 to-slate-600 rounded-xl flex items-center justify-center shadow-md">
                <Activity className="w-5 h-5 text-sky-400" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                FlowSchedule
              </h1>
            </Link>
          </div>

          {/* Desktop account menu */}
          <nav className="hidden md:flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center text-slate-700 font-medium text-xs">
                    {initial}
                  </div>
                  <ChevronDown className="w-4 h-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              {menuContent}
            </DropdownMenu>
          </nav>

          {/* Mobile navigation menu — user icon dropdown, align=end */}
          <div className="md:hidden flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-slate-600 hover:bg-slate-100"
                  aria-label="Open account menu"
                >
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              {menuContent}
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
