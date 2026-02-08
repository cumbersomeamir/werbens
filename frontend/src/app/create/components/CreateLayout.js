"use client";

export function CreateLayout({ children }) {
  return (
    <div className="min-h-screen bg-werbens-mist relative flex flex-col overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-werbens-light-cyan/20 via-transparent to-werbens-cloud/30 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-werbens-light-cyan/10 rounded-full blur-3xl pointer-events-none" />

      <main className="relative flex-1 flex flex-col z-10">{children}</main>
    </div>
  );
}
