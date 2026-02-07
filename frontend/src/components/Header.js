"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/accounts", label: "Accounts" },
  { href: "/analytics", label: "Analytics" },
  { href: "/pricing", label: "Pricing" },
  { href: "/create", label: "Create" },
  { href: "/templates/admin", label: "Admin", muted: true },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="shrink-0 border-b border-werbens-dark-cyan/10 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-semibold text-werbens-dark-cyan"
        >
          Werbens
        </Link>
        <nav className="flex items-center gap-4 flex-wrap" aria-label="Main">
          {NAV_ITEMS.map(({ href, label, muted }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm transition ${
                  muted
                    ? "text-werbens-text/50 hover:text-werbens-dark-cyan"
                    : isActive
                      ? "text-werbens-dark-cyan font-medium"
                      : "text-werbens-text/70 hover:text-werbens-dark-cyan"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
