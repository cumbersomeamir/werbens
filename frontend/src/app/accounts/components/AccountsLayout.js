"use client";

import Link from "next/link";

export function AccountsLayout({ children }) {
  return (
    <div className="min-h-screen bg-werbens-light-cyan/20">
      <header className="border-b border-werbens-dark-cyan/10 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-werbens-dark-cyan">
            Werbens
          </Link>
          <nav className="flex gap-4">
            <Link
              href="/"
              className="text-sm text-werbens-text/70 hover:text-werbens-dark-cyan"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
