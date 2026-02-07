"use client";

import { useState } from "react";
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

function NavLinks({ pathname, onClick }) {
  return (
    <>
      {NAV_ITEMS.map(({ href, label, muted }) => {
        const isActive =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={`block py-3 px-4 rounded-lg min-h-[44px] flex items-center text-sm transition md:py-0 md:px-0 md:min-h-0 md:inline-block ${
              muted
                ? "text-werbens-text/50 hover:text-werbens-dark-cyan hover:bg-werbens-dark-cyan/5 md:hover:bg-transparent"
                : isActive
                  ? "text-werbens-dark-cyan font-medium bg-werbens-dark-cyan/5 md:bg-transparent"
                  : "text-werbens-text/70 hover:text-werbens-dark-cyan hover:bg-werbens-dark-cyan/5 md:hover:bg-transparent"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="shrink-0 border-b border-werbens-dark-cyan/10 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-semibold text-werbens-dark-cyan"
        >
          Werbens
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4 flex-wrap" aria-label="Main">
          <NavLinks pathname={pathname} />
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 -mr-2 rounded-lg text-werbens-text hover:bg-werbens-dark-cyan/5 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile nav */}
      <div
        id="mobile-nav"
        className={`md:hidden border-t border-werbens-dark-cyan/10 bg-white ${menuOpen ? "block" : "hidden"}`}
      >
        <nav className="px-4 py-2 pb-4" aria-label="Main">
          <NavLinks pathname={pathname} onClick={() => setMenuOpen(false)} />
        </nav>
      </div>
    </header>
  );
}
