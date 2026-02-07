"use client";

export function AccountsLayout({ children }) {
  return (
    <div className="min-h-screen bg-werbens-light-cyan/20">
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-10">{children}</main>
    </div>
  );
}
