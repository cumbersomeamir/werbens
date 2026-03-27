"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/accounts", label: "Accounts" },
  { href: "/analytics", label: "Analytics" },
  { label: "Post", postMenu: true },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/automatic", label: "Automatic" },
  { label: "Apps", apps: true },
  { href: "/pricing", label: "Pricing" },
  { href: "/create", label: "Create" },
  { href: "/login", label: "Login" },
  { href: "/splash", label: "Splash", splash: true },
  { href: "/templates/admin", label: "Admin", muted: true },
];

const APP_ITEMS = [
  { href: "/youtube/comment-replier", label: "Youtube Comment Replier" },
  { href: "/feedback-loop", label: "Feedback Loop" },
  { href: "/ideation-engine", label: "Ideation Engine" },
  { href: "/reports", label: "Reports" },
];

const POST_ITEMS = [
  { href: "/post", label: "Post Now" },
  { href: "/post/schedule", label: "Schedule" },
];

function NavLink({ href, label, muted, isActive, onClick, isCta, isSplash }) {
  if (isSplash) {
    return (
      <Link
        key={href}
        href={href}
        onClick={onClick}
        className="
          group relative inline-flex items-center justify-center gap-1.5
          px-4 py-1.5 rounded-full text-sm font-medium
          bg-gradient-to-r from-werbens-midnight to-werbens-deep
          text-werbens-light-cyan border border-werbens-light-cyan/20
          transition-all duration-300 ease-out
          hover:border-werbens-light-cyan/40 hover:shadow-lg hover:shadow-werbens-light-cyan/15
          hover:scale-[1.03] active:scale-[0.97]
          focus-ring overflow-hidden
        "
      >
        <svg
          className="w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-180"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
        {label}
        <span
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(127,231,220,0.08), transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
          }}
          aria-hidden="true"
        />
      </Link>
    );
  }

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
      {NAV_ITEMS.map((item) => {
        if (item?.postMenu) {
          return <DesktopPostMenu key="post-nav" pathname={pathname} />;
        }

        if (item?.apps) {
          return <DesktopAppsMenu key="apps-nav" pathname={pathname} />;
        }

        const { href, label, muted, splash } = item;
        const isActive =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(href + "/");
        const isCta = href === "/create" || href === "/login";

        return (
          <NavLink
            key={href}
            href={href}
            label={label}
            muted={muted}
            isActive={isActive}
            isCta={isCta}
            isSplash={splash}
          />
        );
      })}
    </nav>
  );
}

function DesktopPostMenu({ pathname }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const isPostActive = pathname === "/post" || pathname.startsWith("/post/");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`
          relative inline-flex items-center gap-1 text-sm transition-colors duration-300 ease-out
          py-3 px-4 rounded-lg min-h-[44px] md:py-1 md:px-1 md:min-h-0 md:rounded-none group
          ${isPostActive ? "text-werbens-dark-cyan font-medium" : "text-werbens-text hover:text-werbens-dark-cyan"}
        `}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open post menu"
      >
        Post
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
          aria-hidden="true"
        >
          <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span
          className={`
            hidden md:block absolute -bottom-0.5 left-1/2 h-[2px] rounded-full
            bg-werbens-dark-cyan transition-all duration-300 ease-out
            ${
              isPostActive
                ? "w-full -translate-x-1/2 opacity-100"
                : "w-0 -translate-x-1/2 opacity-0 group-hover:w-full group-hover:opacity-60"
            }
          `}
          aria-hidden="true"
        />
      </button>
      <div
        className={`
          absolute left-0 top-full mt-2 w-56 rounded-xl border border-werbens-dark-cyan/10
          bg-white shadow-xl shadow-werbens-dark-cyan/10 p-2
          transition-all duration-180 ease-out
          ${open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"}
        `}
        role="menu"
        aria-label="Post menu"
      >
        {POST_ITEMS.map(({ href, label }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`
                block rounded-lg px-3 py-2 text-sm transition-colors
                ${
                  isActive
                    ? "bg-werbens-dark-cyan/10 text-werbens-dark-cyan font-medium"
                    : "text-werbens-text hover:bg-werbens-dark-cyan/5 hover:text-werbens-dark-cyan"
                }
              `}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DesktopAppsMenu({ pathname }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const isAppActive = APP_ITEMS.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`)
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`
          relative inline-flex items-center gap-1 text-sm transition-colors duration-300 ease-out
          py-3 px-4 rounded-lg min-h-[44px] md:py-1 md:px-1 md:min-h-0 md:rounded-none group
          ${isAppActive ? "text-werbens-dark-cyan font-medium" : "text-werbens-text hover:text-werbens-dark-cyan"}
        `}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open apps menu"
      >
        Apps
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
          aria-hidden="true"
        >
          <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span
          className={`
            hidden md:block absolute -bottom-0.5 left-1/2 h-[2px] rounded-full
            bg-werbens-dark-cyan transition-all duration-300 ease-out
            ${
              isAppActive
                ? "w-full -translate-x-1/2 opacity-100"
                : "w-0 -translate-x-1/2 opacity-0 group-hover:w-full group-hover:opacity-60"
            }
          `}
          aria-hidden="true"
        />
      </button>
      <div
        className={`
          absolute left-0 top-full mt-2 w-64 rounded-xl border border-werbens-dark-cyan/10
          bg-white shadow-xl shadow-werbens-dark-cyan/10 p-2
          transition-all duration-180 ease-out
          ${open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"}
        `}
        role="menu"
        aria-label="Apps menu"
      >
        {APP_ITEMS.map(({ href, label }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`
                block rounded-lg px-3 py-2 text-sm transition-colors
                ${
                  isActive
                    ? "bg-werbens-dark-cyan/10 text-werbens-dark-cyan font-medium"
                    : "text-werbens-text hover:bg-werbens-dark-cyan/5 hover:text-werbens-dark-cyan"
                }
              `}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MobileAppsMenu({ pathname, onClose }) {
  const [open, setOpen] = useState(false);
  const isAppActive = APP_ITEMS.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`)
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="animate-fade-in-down">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`
          w-full flex items-center justify-between text-left text-sm py-3 px-4 rounded-lg min-h-[44px]
          transition-colors duration-300 ease-out
          ${isAppActive ? "text-werbens-dark-cyan font-medium" : "text-werbens-text hover:text-werbens-dark-cyan"}
        `}
        aria-expanded={open}
        aria-label="Toggle apps menu"
      >
        <span>Apps</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
          aria-hidden="true"
        >
          <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-250 ease-out ${open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="pl-4 space-y-1 pb-1">
          {APP_ITEMS.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`
                  block py-2 px-4 rounded-lg text-sm transition-colors
                  ${
                    isActive
                      ? "bg-werbens-dark-cyan/10 text-werbens-dark-cyan font-medium"
                      : "text-werbens-steel hover:text-werbens-dark-cyan hover:bg-werbens-dark-cyan/5"
                  }
                `}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MobilePostMenu({ pathname, onClose }) {
  const [open, setOpen] = useState(false);
  const isPostActive = pathname === "/post" || pathname.startsWith("/post/");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="animate-fade-in-down">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`
          w-full flex items-center justify-between text-left text-sm py-3 px-4 rounded-lg min-h-[44px]
          transition-colors duration-300 ease-out
          ${isPostActive ? "text-werbens-dark-cyan font-medium" : "text-werbens-text hover:text-werbens-dark-cyan"}
        `}
        aria-expanded={open}
        aria-label="Toggle post menu"
      >
        <span>Post</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
          aria-hidden="true"
        >
          <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-250 ease-out ${open ? "max-h-32 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="pl-4 space-y-1 pb-1">
          {POST_ITEMS.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`
                  block py-2 px-4 rounded-lg text-sm transition-colors
                  ${
                    isActive
                      ? "bg-werbens-dark-cyan/10 text-werbens-dark-cyan font-medium"
                      : "text-werbens-steel hover:text-werbens-dark-cyan hover:bg-werbens-dark-cyan/5"
                  }
                `}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
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
        {NAV_ITEMS.map((item, index) => {
          if (item?.postMenu) {
            return (
              <div
                key="post-nav-mobile"
                className="animate-fade-in-down"
                style={{
                  animationDelay: isOpen ? `${index * 50}ms` : "0ms",
                  animationFillMode: "backwards",
                }}
              >
                <MobilePostMenu pathname={pathname} onClose={onClose} />
              </div>
            );
          }

          if (item?.apps) {
            return (
              <div
                key="apps-nav-mobile"
                className="animate-fade-in-down"
                style={{
                  animationDelay: isOpen ? `${index * 50}ms` : "0ms",
                  animationFillMode: "backwards",
                }}
              >
                <MobileAppsMenu pathname={pathname} onClose={onClose} />
              </div>
            );
          }

          const { href, label, muted, splash } = item;
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");
          const isCta = href === "/create" || href === "/login";

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
                isSplash={splash}
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
      className="fixed inset-x-0 top-0 z-50 px-3 sm:px-6"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto max-w-7xl">
        <div
          className={`
            panel-surface overflow-visible rounded-[1.75rem] sm:rounded-[2rem]
            transition-all duration-500 ease-out
            ${scrolled ? "shadow-[0_18px_45px_rgba(7,16,32,0.12)]" : "shadow-[0_24px_60px_rgba(7,16,32,0.14)]"}
          `}
        >
          <div className="flex items-center justify-between px-5 sm:px-7">
            <div
              className={`
                flex w-full items-center justify-between
                transition-all duration-500 ease-out
                ${scrolled ? "min-h-[68px]" : "min-h-[78px]"}
              `}
            >
              <Link
                href="/"
                className="
                  group relative inline-flex items-center gap-3 rounded-2xl py-1 pr-3
                  transition-transform duration-300 ease-out
                  hover:scale-[1.02] active:scale-[0.98]
                "
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-werbens-dark-cyan to-werbens-light-cyan text-sm font-black text-white shadow-lg shadow-werbens-dark-cyan/15">
                  W
                </span>
                <span className="min-w-0">
                  <span className="font-display gradient-text block text-[1.65rem] font-bold leading-none sm:text-[1.9rem]">
                    Werbens
                  </span>
                  <span className="block pt-1 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-werbens-dark-cyan/52">
                    AI content system
                  </span>
                </span>
              </Link>

              <DesktopNav pathname={pathname} />

              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="
                  md:hidden relative rounded-2xl border border-werbens-dark-cyan/10 bg-white/65 p-2.5
                  text-werbens-text
                  transition-all duration-300 ease-out
                  hover:text-werbens-dark-cyan hover:bg-werbens-dark-cyan/5
                  active:scale-95
                  min-h-[46px] min-w-[46px]
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

          <MobileNav
            pathname={pathname}
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
          />
        </div>
      </div>
    </header>
  );
}
