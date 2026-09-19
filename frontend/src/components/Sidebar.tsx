import { Link, useLocation } from "react-router-dom";
import type { NavItem } from "../types/nav";

export default function Sidebar({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:block">
      <nav className="flex flex-col gap-1 p-4">
        {items.map((item) => {
          const prefixes = [item.path, ...(item.match ?? [])];
          const isActive = prefixes.some((p) => pathname.startsWith(p));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
