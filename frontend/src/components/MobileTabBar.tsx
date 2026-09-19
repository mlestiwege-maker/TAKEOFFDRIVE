import { Link, useLocation } from "react-router-dom";
import type { NavItem } from "../types/nav";

export default function MobileTabBar({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const prefixes = [item.path, ...(item.match ?? [])];
        const isActive = prefixes.some((p) => pathname.startsWith(p));
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${
              isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-500 dark:text-slate-500"
            }`}
          >
            <span className="text-lg leading-none" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
