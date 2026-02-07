"use client";

export function AnalyticsLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <main>{children}</main>
    </div>
  );
}
