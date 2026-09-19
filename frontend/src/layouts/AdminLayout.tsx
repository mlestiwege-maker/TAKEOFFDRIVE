import type { ReactNode } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import MobileTabBar from "../components/MobileTabBar";
import type { NavItem } from "../types/nav";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/admin/dashboard", icon: "🏠" },
  { label: "Applications", path: "/admin/applications", icon: "📋", match: ["/admin/applications"] },
  { label: "Drivers", path: "/admin/drivers", icon: "🧑‍✈️" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={NAV_ITEMS} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 pb-24 dark:bg-slate-950 sm:p-10 sm:pb-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
      <MobileTabBar items={NAV_ITEMS} />
    </div>
  );
}
