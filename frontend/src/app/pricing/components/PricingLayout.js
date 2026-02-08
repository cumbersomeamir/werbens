"use client";

export function PricingLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface overflow-hidden">
      {/* Subtle decorative background elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-werbens-light-cyan/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-werbens-dark-cyan/5 blur-3xl" />
      </div>
      <main className="relative">{children}</main>
    </div>
  );
}
