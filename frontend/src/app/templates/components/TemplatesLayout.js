"use client";

export function TemplatesLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-werbens-mist via-white to-white">
      <main>{children}</main>
    </div>
  );
}
