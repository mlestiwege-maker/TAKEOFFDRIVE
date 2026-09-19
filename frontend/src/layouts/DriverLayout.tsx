import type { ReactNode } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import MobileTabBar from "../components/MobileTabBar";
import type { NavItem } from "../types/nav";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/driver/dashboard", icon: "🏠" },
  { label: "Application", path: "/onboarding/personal", icon: "📝", match: ["/onboarding"] },
  { label: "Documents", path: "/driver/documents", icon: "📄" },
  { label: "Profile", path: "/driver/profile", icon: "👤" },
];

export default function DriverLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={NAV_ITEMS} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 pb-24 dark:bg-slate-950 sm:p-10 sm:pb-10">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
      <MobileTabBar items={NAV_ITEMS} />
    </div>
  );
}
