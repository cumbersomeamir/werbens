"use client";

import { useState, useEffect, useCallback } from "react";
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

function NavLink({ href, label, muted, isActive, onClick, isCta }) {
  if (isCta) {
    return (
      <Link
        key={href}
        href={href}
        onClick={onClick}
        className="
          inline-flex items-center justify-center
          px-5 py-1.5 rounded-full text-sm font-medium
          bg-werbens-dark-cyan text-white
          shadow-md shadow-werbens-dark-cyan/25
          transition-all duration-300 ease-out
          hover:shadow-lg hover:shadow-werbens-dark-cyan/35 hover:scale-[1.03]
          active:scale-[0.97]
          focus-ring
        "
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      key={href}
      href={href}
      onClick={onClick}
      className={`
        relative inline-flex items-center text-sm transition-colors duration-300 ease-out
        py-3 px-4 rounded-lg min-h-[44px] md:py-1 md:px-1 md:min-h-0 md:rounded-none
        group
        ${
          muted
            ? "text-werbens-steel hover:text-werbens-dark-cyan"
            : isActive
              ? "text-werbens-dark-cyan font-medium"
              : "text-werbens-text hover:text-werbens-dark-cyan"
        }
      `}
    >
      {label}

      {/* Animated underline indicator -- desktop only */}
      <span
        className={`
          hidden md:block absolute -bottom-0.5 left-1/2 h-[2px] rounded-full
          bg-werbens-dark-cyan
          transition-all duration-300 ease-out
          ${
            isActive
              ? "w-full -translate-x-1/2 opacity-100"
              : "w-0 -translate-x-1/2 opacity-0 group-hover:w-full group-hover:opacity-60"
          }
        `}
        aria-hidden="true"
      />

      {/* Active dot indicator -- mobile only */}
      {isActive && (
        <span
          className="
            md:hidden ml-auto w-1.5 h-1.5 rounded-full
            bg-werbens-dark-cyan
            animate-scale-in
          "
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

function DesktopNav({ pathname }) {
  return (
    <nav
      className="hidden md:flex items-center gap-6"
      aria-label="Main"
    >
      {NAV_ITEMS.map(({ href, label, muted }) => {
        const isActive =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(href + "/");
        const isCta = href === "/create";

        return (
          <NavLink
            key={href}
            href={href}
            label={label}
            muted={muted}
            isActive={isActive}
            isCta={isCta}
          />
        );
      })}
    </nav>
  );
}

function MobileNav({ pathname, isOpen, onClose }) {
  return (
    <div
      id="mobile-nav"
      className={`
        md:hidden overflow-hidden
        transition-all duration-400 ease-out
        ${isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}
      `}
    >
      <nav
        className="
          px-4 py-3 pb-5 space-y-1
          border-t border-werbens-dark-cyan/8
        "
        aria-label="Main"
      >
        {NAV_ITEMS.map(({ href, label, muted }, index) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");
          const isCta = href === "/create";

          return (
            <div
              key={href}
              className="animate-fade-in-down"
              style={{
                animationDelay: isOpen ? `${index * 50}ms` : "0ms",
                animationFillMode: "backwards",
              }}
            >
              <NavLink
                href={href}
                label={label}
                muted={muted}
                isActive={isActive}
                onClick={onClose}
                isCta={isCta}
              />
            </div>
          );
        })}
      </nav>
    </div>
  );
}

function HamburgerIcon({ isOpen }) {
  return (
    <div className="relative w-5 h-5" aria-hidden="true">
      <span
        className={`
          absolute left-0 block w-5 h-[1.5px] rounded-full bg-current
          transition-all duration-300 ease-out
          ${isOpen ? "top-[9px] rotate-45" : "top-[3px] rotate-0"}
        `}
      />
      <span
        className={`
          absolute left-0 top-[9px] block w-5 h-[1.5px] rounded-full bg-current
          transition-all duration-300 ease-out
          ${isOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"}
        `}
      />
      <span
        className={`
          absolute left-0 block w-5 h-[1.5px] rounded-full bg-current
          transition-all duration-300 ease-out
          ${isOpen ? "top-[9px] -rotate-45" : "top-[15px] rotate-0"}
        `}
      />
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 12);
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50
        glass shadow-elevated border-b border-white/10
        transition-all duration-500 ease-out
      `}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={`
            flex items-center justify-between
            transition-all duration-500 ease-out
            ${scrolled ? "py-3" : "py-5"}
          `}
        >
          {/* Logo */}
          <Link
            href="/"
            className="
              group relative flex items-center gap-2
              transition-transform duration-300 ease-out
              hover:scale-[1.02] active:scale-[0.98]
            "
          >
            <span className="gradient-text text-xl font-bold tracking-tight">
              Werbens
            </span>
          </Link>

          {/* Desktop navigation */}
          <DesktopNav pathname={pathname} />

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="
              md:hidden relative p-2.5 -mr-2 rounded-xl
              text-werbens-text
              transition-all duration-300 ease-out
              hover:text-werbens-dark-cyan hover:bg-werbens-dark-cyan/5
              active:scale-95
              min-h-[44px] min-w-[44px]
              flex items-center justify-center
              focus-ring
            "
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <HamburgerIcon isOpen={menuOpen} />
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      <MobileNav
        pathname={pathname}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </header>
  );
}
