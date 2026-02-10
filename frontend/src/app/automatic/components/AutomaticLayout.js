"use client";

export function AutomaticLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface overflow-hidden">
      {/* Soft background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[420px] w-[420px] rounded-full bg-werbens-light-cyan/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[360px] w-[360px] rounded-full bg-werbens-dark-cyan/10 blur-3xl" />
      </div>
      <main className="relative flex-1 flex flex-col">{children}</main>
    </div>
  );
}

