"use client";

import Link from "next/link";

export function TemplatesLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-werbens-dark-cyan/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-semibold text-werbens-dark-cyan"
          >
            Werbens
          </Link>
          <nav className="flex gap-4">
            <Link
              href="/"
              className="text-sm text-werbens-text/70 hover:text-werbens-dark-cyan transition"
            >
              Home
            </Link>
            <Link
              href="/accounts"
              className="text-sm text-werbens-text/70 hover:text-werbens-dark-cyan transition"
            >
              Accounts
            </Link>
            <Link
              href="/templates/admin"
              className="text-sm text-werbens-text/50 hover:text-werbens-dark-cyan transition"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
